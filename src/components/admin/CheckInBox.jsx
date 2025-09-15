import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Button,
    IconButton,
    Stack,
    Typography,
    Switch,
    Dialog,
    DialogContent,
    FormControl,
    FormHelperText,
    TextField,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Grid, Paper
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LinkIcon from "@mui/icons-material/Link";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import jsQR from "jsqr";
import { useToast } from "../ToastContext";
import { verifyBooking, checkInBooking, undoCheckIn } from "../../api";
import InfoRow from "./InfoRow";

function CheckInBox({ events = [] }) {

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const trackRef = useRef(null);
    const wakeLockRef = useRef(null);

    const [support, setSupport] = useState({ camera: false, detector: false, torch: false });
    const [scanning, setScanning] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [lastScan, setLastScan] = useState("");
    const [result, setResult] = useState(null); // { valid, reason, token, ... }
    const [onlyToday, setOnlyToday] = useState(true);
    const [autoAll, setAutoAll] = useState(() => {
        try { return localStorage.getItem("checkinAutoAll") !== "false"; } catch { return true; }
    });
    const [opOpen, setOpOpen] = useState(false); // modal operatore
    const [manual, setManual] = useState("");

    const { showToast } = useToast();

    const todayISO = new Date().toISOString().slice(0,10);
    const eventById = useCallback((id) => events.find((e) => e.id === id), [events]);

    const formatDate = (iso) => {
        if (!iso) return "—";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
    };

    // Audio
    const audioCtxRef = useRef(null);
    const [soundOn, setSoundOn] = useState(() => localStorage.getItem("checkinSound") !== "off");
    const [torchOn, setTorchOn] = useState(false);

    // dentro CheckInBox, in alto tra gli hook:
    const theme = useTheme();
    const downSmQuery = useMemo(() => theme.breakpoints.down("sm"), [theme]);
    const isXs = useMediaQuery(downSmQuery, { noSsr: true });


// sblocca l’audio su gesto utente (iOS richiede interazione)
    async function ensureAudio() {
        try {
            if (!audioCtxRef.current) {
                const ACtx = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new ACtx();
            }
            if (audioCtxRef.current?.state === "suspended") {
                await audioCtxRef.current.resume();
            }
        } catch {}
    }

    function beep({ freq = 880, when = 0, duration = 0.12, type = "sine", gain = 0.03 }) {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        const t0 = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(gain, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(g).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

// “ding” (successo)
    function playDing() {
        if (!soundOn) return;
        ensureAudio();
        beep({ freq: 880, duration: 0.11, gain: 0.04 });
        beep({ freq: 1320, when: 0.12, duration: 0.10, gain: 0.04 });
    }

// “beep-beep” (warning)
    function playWarn() {
        if (!soundOn) return;
        ensureAudio();
        beep({ freq: 650, duration: 0.08, gain: 0.035 });
        beep({ freq: 650, when: 0.18, duration: 0.08, gain: 0.035 });
    }

// “buzzer” (errore)
    function playError() {
        if (!soundOn) return;
        ensureAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(360, t0);
        osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.25);
        g.gain.setValueAtTime(0.035, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        osc.connect(g).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.27);
    }



    useEffect(() => {
        setSupport((s) => ({
            ...s,
            camera: !!navigator.mediaDevices?.getUserMedia,
            detector: "BarcodeDetector" in window,
        }));
    }, []);

    async function requestWakeLock() { try { wakeLockRef.current = await navigator.wakeLock?.request("screen"); } catch {} }
    function releaseWakeLock() { try { wakeLockRef.current?.release(); wakeLockRef.current = null; } catch {} }

    useEffect(() => {
        const onVis = () => document.hidden && stopScan();
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    const extractToken = (text) => {
        try { const u = new URL(text); const tk = u.searchParams.get("token"); if (tk) return tk; } catch {}
        const maybeJwt = (text || "").trim();
        if (maybeJwt.split(".").length === 3) return maybeJwt;
        const m = text.match(/[?&]token=([^&\s]+)/i);
        if (m) return m[1];
        return null;
    };

    const [lastAutoCount, setLastAutoCount] = useState(0);
    const [lastPreRemaining, setLastPreRemaining] = useState(0);
    const [lastJustCheckedIn, setLastJustCheckedIn] = useState(false);

    const doVerify = async (text, opts = { autoCheckIn: true }) => {
        const token = extractToken(text);
        if (!token) { showToast("QR/Link non valido: nessun token trovato", "error"); return; }
        setLastScan(text);
        setVerifying(true);
        try {
            const data = await verifyBooking(token);
            const isValid = (data?.valid !== undefined) ? !!data.valid : !!data?.ok;
            const ev = eventById(data.eventId);
            const isToday = (data.eventDate || ev?.date) === todayISO;
            const payload = { ...data, token, isToday, valid: isValid };
            setResult(payload);

            setOpOpen(true); // apri modal operatore

            if (!isValid) { showToast("Token non valido", "error"); return; }
            if (onlyToday && !isToday) { showToast("Evento non è oggi — verifica manuale", "warning"); return; }

            // ✅ AUTO CHECK-IN: +1 o tutti i rimanenti, in base al toggle
            if (opts.autoCheckIn && data.remaining > 0) {
                const n = autoAll ? data.remaining : 1;
                setLastAutoCount(n);
                // tieni traccia dello stato pre-checkin per i messaggi UI
                // (così distinguiamo "già utilizzato" da "appena validato")
                // pre-remaining prima del check-in
                try { setLastPreRemaining(data.remaining); } catch {}
                try { setLastJustCheckedIn(false); } catch {}
                await doCheckIn(token, n, { silent: true });
                try { setLastJustCheckedIn(true); } catch {}
            } else if (data.remaining <= 0) {
                showToast("Prenotazione già Sold out", "error");
                playWarn();
            }
        } catch (e) {
            const code = e?.response?.data?.error || (e?.response?.status === 401 ? "expired" : null) || "network_error";
            setResult({ valid: false, reason: code });
            if (code === "expired") {
                showToast("Token scaduto", "warning");
                playWarn();
            } else if (code === "not_found") {
                showToast("Prenotazione non trovata", "error");
                playError();
            } else if (code === "token_mismatch") {
                showToast("Token non corrisponde alla prenotazione", "error");
                playError();
            } else if (code === "missing_token") {
                showToast("Token mancante", "error");
                playError();
            } else if (code === "invalid") {
                showToast("Token non valido", "error");
                playError();
            } else {
                showToast("Errore di verifica", "error");
                playError();
            }
        } finally {
            setVerifying(false);
        }
    };

    const stopScan = () => {
        setScanning(false);
        setTorchOn(false);
        const stream = videoRef.current?.srcObject;
        if (stream) { stream.getTracks().forEach((t) => t.stop()); videoRef.current.srcObject = null; }
        trackRef.current = null;
        releaseWakeLock();
    };

    const startScan = async () => {
        if (!support.camera) return;
        setResult(null);
        setScanning(true);
        await requestWakeLock();
        await ensureAudio();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // risoluzione moderata per prestazioni migliori sui device lenti
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            trackRef.current = stream.getVideoTracks()[0];

            // torch capability (solo alcuni device/browser)
            try {
                const caps = trackRef.current?.getCapabilities?.();
                const hasTorch = !!caps?.torch;
                if (hasTorch) setSupport((s) => ({ ...s, torch: true }));
            } catch {}

            await new Promise((r) => {
                const v = videoRef.current;
                const check = () => (v && v.videoWidth > 0) ? r() : setTimeout(check, 60);
                check();
            });

            const v = videoRef.current;
            const c = canvasRef.current;
            const scale = Math.min(640 / Math.max(v.videoWidth, v.videoHeight), 1);
            c.width  = Math.round(v.videoWidth * scale);
            c.height = Math.round(v.videoHeight * scale);
            const ctx = c.getContext("2d", { willReadFrequently: true });

            let detector = null;
            if (support.detector) { try { detector = new window.BarcodeDetector({ formats: ["qr_code"] }); } catch { detector = null; } }

            const lastTsRef = { v: 0 };
            const loop = async (ts) => {
                if (!videoRef.current || !scanning) return;
                try {
                    // throttling ~8fps per risparmiare CPU
                    if (ts && ts - lastTsRef.v < 120) { requestAnimationFrame(loop); return; }
                    lastTsRef.v = ts || performance.now();
                    if (detector) {
                        const detections = await detector.detect(videoRef.current);
                        if (detections?.length) { const text = detections[0].rawValue; stopScan(); await doVerify(text, { autoCheckIn: true }); return; }
                    }
                    ctx.drawImage(v, 0, 0, c.width, c.height);
                    const imageData = ctx.getImageData(0, 0, c.width, c.height);
                    const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
                    if (qr?.data) { stopScan(); await doVerify(qr.data, { autoCheckIn: true }); return; }
                } catch {}
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        } catch {
            setScanning(false);
            showToast("Impossibile accedere alla fotocamera", "error");
            releaseWakeLock();
        }
    };

    const toggleTorch = async () => {
        if (!support.torch || !trackRef.current) return;
        const next = !torchOn;
        try {
            await trackRef.current.applyConstraints({ advanced: [{ torch: next }] });
            setTorchOn(next);
        } catch {
            // ignore
        }
    };

    const onPickImage = async (file) => {
        if (!file) return;
        const img = new Image();
        img.onload = async () => {
            const c = canvasRef.current;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            c.width = img.width; c.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, c.width, c.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
            if (qr?.data) await doVerify(qr.data, { autoCheckIn: true });
            else showToast("Nessun QR riconosciuto", "error");
        };
        img.onerror = () => showToast("Immagine non valida", "error");
        img.src = URL.createObjectURL(file);
    };

    // AZIONI
    const doCheckIn = async (token, count = 1, { silent = false } = {}) => {
        try {
            const r = await checkInBooking(token, count);
            setResult(prev => prev ? { ...prev, checkedInCount: r.checkedInCount, remaining: r.remaining } : prev);
            if (!silent) showToast("Check-in registrato ", "success");
            if (!silent) playDing();
            else playDing(); // anche per l’auto +1 va bene dare feedback

            try { navigator.vibrate?.(30); } catch {}
        } catch (e) {
            const code = e?.response?.data?.error || e?.message;
            if (code === "already_fully_checked_in") showToast("Prenotazione già Sold out", "error");
            else if (code === "exceeds_quantity") showToast("Numero superiore ai biglietti disponibili", "error");
            else if (code === "token_mismatch") showToast("Token non corrisponde alla prenotazione", "error");
            else showToast("Errore nel check-in", "error");
            playError();
        }
    };

    const doUndo = async () => {
        if (!result?.token) return;
        try {
            const r = await undoCheckIn(result.token, 1);
            setResult(prev => prev ? { ...prev, checkedInCount: r.checkedInCount, remaining: r.remaining } : prev);
            showToast("Ultimo check-in annullato", "success");
            try { navigator.vibrate?.([20, 20]); } catch {}
        } catch (e) {
            const code = e?.response?.data?.error || e?.message;
            if (code === "nothing_to_undo") showToast("Nulla da annullare", "info");
            else showToast("Errore nell'annullamento", "error");
        }
    };

    // VIEW helpers
    const statusKind = (() => {
        if (!result) return "idle";
        if (!result.valid) return result.reason === "expired" ? "warn" : "error";
        if (onlyToday && result.valid && !result.isToday) return "warn";
        if (result.valid && result.remaining > 0) return "ok";
        if (result.valid && result.remaining === 0) return "done";
        return "error";
    })();

    const colorByKind = {
        ok:   { bg: "#10391F", border: "#2ECC71" },
        done: { bg: "#102537", border: "#5DADE2" },
        warn: { bg: "#3A2F10", border: "#F1C40F" },
        error:{ bg: "#3A1010", border: "#E74C3C" },
        idle: { bg: "#1a1a22", border: "#444" },
    };

    const ev = result?.eventId ? eventById(result.eventId) : null;

    return (
        <Box>
            {/* Controlli rapidi */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
                <FormControl>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Switch checked={onlyToday} onChange={(_, v) => setOnlyToday(v)} />
                        <FormHelperText sx={{ color: "inherit" }}>Solo eventi di oggi ({todayISO})</FormHelperText>
                    </Stack>
                </FormControl>
                <FormControl>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                            checked={autoAll}
                            onChange={(_, v) => {
                                setAutoAll(v);
                                try { localStorage.setItem("checkinAutoAll", v ? "on" : "false"); } catch {}
                            }}
                        />
                        <FormHelperText sx={{ color: "inherit" }}>Alla scansione: registra tutti i rimanenti</FormHelperText>
                    </Stack>
                </FormControl>
                <Button variant="outlined" startIcon={<FullscreenIcon />} onClick={() => setOpOpen(true)}>
                    Modal operatore
                </Button>
            </Stack>

            <Grid container spacing={2}>
                {/* Scanner */}
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            p: { xs: 1.25, md: 1.5 },       // 10px mobile
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "#0c0c12",
                        }}
                    >

                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Scanner QR</Typography>
                        <Box sx={{ position: "relative", width: "100%", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", background: "#000" }}>
                            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "auto", display: "block" }} />
                            {!scanning && (
                                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", p: 2,
                                    background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 10px, rgba(255,255,255,0.06) 10px 20px)" }}>
                                    <Stack spacing={1} alignItems="center">
                                        <QrCodeScannerIcon sx={{ fontSize: 42, opacity: 0.7 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.8, textAlign: "center" }}>
                                            Premi “Avvia scansione” e inquadra il QR
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        {/* --- PATCH mobile: pulsanti scanner --- */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ mt: 1, "& .MuiButton-root": { minHeight: 44 } }}
                        >
                            {/* riga 1 su mobile: Avvia + Carica (50/50) */}
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1}
                                sx={{ flexShrink: { sm: 0 } }}
                            >
                                <Button
                                    startIcon={<QrCodeScannerIcon />}
                                    variant="contained"
                                    onClick={startScan}
                                    disabled={!support.camera || scanning}
                                    sx={{ width: { xs: "100%", md: "auto" }, whiteSpace: "nowrap" }}
                                >
                                    Avvia scansione
                                </Button>

                                <Button
                                    variant="outlined"
                                    component="label"
                                    sx={{ width: { xs: "100%", md: "auto" }, whiteSpace: "nowrap" }}
                                >
                                    Carica immagine
                                    <input
                                        hidden
                                        accept="image/*"
                                        type="file"
                                        onChange={(e) => { onPickImage(e.target.files?.[0]); if (e?.target) e.target.value = ""; }}
                                    />
                                </Button>
                            </Stack>


                            {/* riga 2 su mobile: Stop + volume */}
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}
                            >
                                <Button
                                    variant="text"
                                    onClick={stopScan}
                                    disabled={!scanning}
                                    sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}
                                >
                                    Stop
                                </Button>

                                <IconButton
                                    onClick={() => {
                                        const next = !soundOn;
                                        setSoundOn(next);
                                        try { localStorage.setItem("checkinSound", next ? "on" : "off"); } catch {}
                                    }}
                                    aria-label={soundOn ? "Disattiva suoni" : "Attiva suoni"}
                                    sx={{ ml: { xs: 0, sm: "auto" } }}
                                >
                                    {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                                </IconButton>

                                {support.torch && (
                                    <IconButton
                                        onClick={toggleTorch}
                                        disabled={!scanning}
                                        aria-label={torchOn ? "Spegni torcia" : "Accendi torcia"}
                                    >
                                        {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                                    </IconButton>
                                )}
                            </Stack>
                        </Stack>


                        <FormHelperText sx={{ mt: 1 }}>
                            In alternativa carica una foto del QR.
                        </FormHelperText>

                        {/* Verifica manuale (link o token) */}
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.9 }}>
                                Verifica manuale (link del QR o token JWT)
                            </Typography>
                            {/* --- PATCH mobile: verifica manuale --- */}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <TextField
                                    placeholder="Incolla link completo ricevuto via email, o il token…"
                                    value={manual}
                                    onChange={(e) => setManual(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && manual && !verifying) {
                                            e.preventDefault();
                                            doVerify(manual, { autoCheckIn: true });
                                        }
                                    }}
                                    size="small"
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => doVerify(manual, { autoCheckIn: true })}
                                    disabled={!manual || verifying}
                                    sx={{ width: { xs: "100%", sm: "auto" } }}
                                >
                                    {verifying ? <CircularProgress size={18} /> : "Verifica"}
                                </Button>
                            </Stack>

                            <FormHelperText sx={{ mt: 0.5 }}>
                                Se valido e l’evento è di oggi (toggle attivo), viene registrato automaticamente un +1 check-in.
                            </FormHelperText>
                        </Box>


                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </Paper>
                </Grid>

                {/* Esito & azioni */}
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            p: { xs: 1.25, md: 1.5 },
                            borderRadius: 2,
                            border: {
                                xs: `1px solid ${colorByKind[statusKind].border}`,
                                md: `2px solid ${colorByKind[statusKind].border}`,
                            },
                            background: colorByKind[statusKind].bg,
                            transition: "all .2s",
                        }}
                    >

                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                            {statusKind === "ok" && <CheckCircleIcon color="success" />}
                            {statusKind === "done" && <CheckCircleIcon color="info" />}
                            {statusKind === "warn" && <WarningAmberIcon color="warning" />}
                            {statusKind === "error" && <ErrorOutlineIcon color="error" />}
                            <Typography variant="h6" fontWeight={800}>
                            {statusKind === "ok"   && (lastAutoCount > 1 ? `VALIDO (auto +${lastAutoCount})` : "VALIDO")}
                            {statusKind === "done" && (lastJustCheckedIn && lastPreRemaining > 0 ? "CHECK-IN COMPLETATO" : "GIÀ UTILIZZATO (0 rimanenti)")}
                            {statusKind === "warn" && (result?.reason === "expired" ? "TOKEN SCADUTO" : "EVENTO NON DI OGGI")}
                            {statusKind === "error"&& "NON VALIDO"}
                            {statusKind === "idle" && "In attesa di scansione"}
                            </Typography>
                        </Stack>

                        {result?.valid && (
                            <>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} md={6}>
                                        <InfoRow label="Nome" value={`${result.nome || "—"} ${result.cognome || ""}`} />
                                        <InfoRow label="Email" value={result.email || "—"} copy />
                                        <InfoRow label="Telefono" value={result.telefono || "—"} copy />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoRow label="Evento" value={ev?.name || result.eventId} />
                                        <InfoRow label="Data evento" value={formatDate(ev?.date)} />
                                        <InfoRow label="Biglietti" value={`${result.checkedInCount || 0} / ${result.quantity} (rim. ${result.remaining ?? 0})`} />
                                    </Grid>
                                </Grid>

                                {/* Esito & azioni */}
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    spacing={{ xs: 1, md: 1.5 }}
                                    sx={{ mt: 2, width: "100%" }}
                                >
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => doCheckIn(result.token, 1)}
                                        disabled={(result.remaining ?? 0) <= 0}
                                        sx={{ height: 46, borderRadius: 999, fontWeight: 800 }}
                                    >
                                        +1 Check-in
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={doUndo}
                                        disabled={(result?.checkedInCount || 0) <= 0}
                                        sx={{ height: 46, borderRadius: 999, fontWeight: 700 }}
                                    >
                                        Annulla ultimo
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<LinkIcon />}
                                        onClick={() => {
                                            const base = (
                                                (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL)) ||
                                                (typeof window !== 'undefined' ? window.location.origin : '')
                                            ).replace(/\/+$/, "");
                                            window.open(`${base}/api/bookings/verify?token=${encodeURIComponent(result.token)}`,
                                                "_blank", "noopener,noreferrer");
                                        }}
                                        sx={{ height: 46, borderRadius: 999, fontWeight: 700 }}
                                    >
                                        Apri verifica
                                    </Button>
                                </Stack>

                            </>
                        )}

                        {!result && <Typography sx={{ opacity: .75 }}>Scansiona un QR o incolla un link/token per verificare.</Typography>}
                    </Paper>
                </Grid>
            </Grid>

            {/* MODAL OPERATORE FULL-SCREEN */}
            <Dialog fullScreen open={opOpen} onClose={() => setOpOpen(false)}>
                <Box sx={{ p: 2, background: "#0b0b0f", color: "#fff", minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Button variant="text" startIcon={<FullscreenExitIcon />} onClick={() => setOpOpen(false)} sx={{ color: "#fff" }}>
                            Chiudi
                        </Button>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {support.torch && (
                                <IconButton onClick={toggleTorch} disabled={!scanning} sx={{ color: "#fff" }} aria-label={torchOn ? "Spegni torcia" : "Accendi torcia"}>
                                    {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                                </IconButton>
                            )}
                            <IconButton
                                onClick={() => {
                                    const next = !soundOn;
                                    setSoundOn(next);
                                    try { localStorage.setItem("checkinSound", next ? "on" : "off"); } catch {}
                                }}
                                sx={{ color: "#fff" }}
                            >
                                {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                            </IconButton>
                        </Stack>

                    </Stack>

                    <Box sx={{ display: "grid", placeItems: "center" }}>
                        <Box sx={{ textAlign: "center" }}>
                            <Box sx={{
                                width: 220, height: 220, borderRadius: "50%",
                                mx: "auto", mb: 3,
                                background:
                                    statusKind === "ok"   ? "radial-gradient(circle, #1e7f39 0%, #0f3f20 70%)" :
                                        statusKind === "done" ? "radial-gradient(circle, #1b4d74 0%, #0b2336 70%)" :
                                            statusKind === "warn" ? "radial-gradient(circle, #8a6d1a 0%, #3d2f0a 70%)" :
                                                statusKind === "error"? "radial-gradient(circle, #7f1e1e 0%, #3f0f0f 70%)" :
                                                    "radial-gradient(circle, #333 0%, #111 70%)",
                                boxShadow: "0 0 60px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.5)",
                                border: "6px solid rgba(255,255,255,.08)",
                            }} />

                            <Typography sx={{ fontSize: 40, fontWeight: 900, letterSpacing: 1, mb: 1 }}>
                                {statusKind === "ok"   && (lastAutoCount > 1 ? "VALIDO" : "VALIDO")}
                                {statusKind === "done" && (lastJustCheckedIn && lastPreRemaining > 0 ? "VALIDO" : "GIÀ UTILIZZATO")}
                                {statusKind === "warn" && (result?.reason === "expired" ? "SCADUTO" : "NON DI OGGI")}
                                {statusKind === "error"&& "NON VALIDO"}
                                {statusKind === "idle" && "IN ATTESA"}
                            </Typography>

                            {result?.valid && (
                                <>
                                    <Typography sx={{ fontSize: 24, opacity: .9, mb: .5 }}>{(result.nome || "") + " " + (result.cognome || "")}</Typography>
                                    <Typography sx={{ fontSize: 20, opacity: .75, mb: 2 }}>{eventById(result.eventId)?.name || result.eventId}</Typography>
                                    <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
                                        {`Entrati: ${result.checkedInCount || 0} / ${result.quantity} — Rim.: ${result.remaining ?? 0}`}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* --- PATCH: bottoni footer modal operatore --- */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="center"
                        sx={{ pb: 1, width: "100%" }}
                        flexWrap={{ xs: "nowrap", sm: "wrap" }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={startScan}
                            startIcon={<QrCodeScannerIcon />}
                            sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 48 }}
                        >
                            Scansiona
                        </Button>

                        {result?.valid && (
                            <>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => doCheckIn(result.token, 1)}
                                    disabled={(result.remaining ?? 0) <= 0}
                                    sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 48 }}
                                >
                                    +1
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={doUndo}
                                    disabled={(result?.checkedInCount || 0) <= 0}
                                    sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 48 }}
                                >
                                    Annulla
                                </Button>
                            </>
                        )}
                    </Stack>

                </Box>
            </Dialog>
        </Box>
    );
}

export default CheckInBox;
