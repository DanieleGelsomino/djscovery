import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, Stack, TextField, Button, Grid, Skeleton, Paper, Box, IconButton, InputAdornment } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { driveCdnSrc } from "../../lib/driveGallery";

function DriveImagePickerDialog({ open, onClose, onPick }) {
    const folderId =
        (import.meta?.env && import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID) ||
        (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID);
    const API_BASE =
        (import.meta?.env && import.meta.env.VITE_API_BASE_URL) ||
        (typeof window !== 'undefined' ? window.location.origin : '');

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [error, setError] = useState("");

    // Preconnect al CDN immagini di Google per ridurre il TTFB
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = "https://lh3.googleusercontent.com";
        document.head.appendChild(link);
        return () => { try { document.head.removeChild(link); } catch {} };
    }, []);

    const load = useCallback(async () => {
        if (!folderId) {
            setError("Config mancante: FOLDER_ID");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/drive/list?folderId=${encodeURIComponent(folderId)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list = await res.json();
            setItems(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error(e);
            setError("Impossibile caricare le immagini da Drive.");
        } finally {
            setLoading(false);
        }
    }, [folderId]);

    useEffect(() => { if (open) load(); }, [open, load]);

    const filtered = useMemo(() => {
        const t = filter.trim().toLowerCase();
        return t ? items.filter((i) => (i.name || "").toLowerCase().includes(t)) : items;
    }, [filter, items]);

    const [visible, setVisible] = useState(60);
    const sentinelRef = useRef(null);

    useEffect(() => { setVisible(60); }, [open, filter, items.length]);

    useEffect(() => {
        if (!open) return;
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisible((v) => Math.min(v + 60, filtered.length));
            }
        }, { root: null, rootMargin: "1200px 0px", threshold: 0 });
        io.observe(el);
        return () => io.disconnect();
    }, [open, filtered.length]);

    /* ====== Thumb ottimizzato con lazy + srcset + HEIC fallback ====== */

    // Cache per gli oggetti URL (HEIC → WEBP) per non riconvertire
    const heicUrlCacheRef = useRef(new Map());

    function DriveThumb({ id, name, mimeType, index }) {
        const boxRef = useRef(null);
        const imgRef = useRef(null);
        const objectUrlRef = useRef(null);
        const isHeic = useMemo(
            () =>
                /heic|heif/i.test(mimeType || "") ||
                /\.heic$|\.heif$/i.test(name || ""),
            [mimeType, name]
        );

        // Lazy load on-intersect
        useEffect(() => {
            const el = boxRef.current;
            if (!el) return;
            const io = new IntersectionObserver(
                (entries) => {
                    if (!entries[0].isIntersecting) return;
                    const img = imgRef.current;
                    if (!img || img.getAttribute("src")) return;

                    // srcset: lascia decidere al browser la risoluzione
                    const srcset = [200, 320, 480, 640, 800]
                        .map((w) => `${driveCdnSrc(id, w)} ${w}w`)
                        .join(", ");

                    img.src = driveCdnSrc(id, 320);
                    img.srcset = srcset;
                    img.sizes =
                        "(max-width:600px) 50vw, (max-width:900px) 33vw, (max-width:1200px) 25vw, 16.66vw";
                    img.setAttribute("fetchpriority", index < 8 ? "high" : "low");

                    io.disconnect();
                },
                { rootMargin: "300px 0px" }
            );
            io.observe(el);
            return () => io.disconnect();
        }, [id, index]);

        // Prefetch versione grande per click istantaneo
        const prefetchLarge = useCallback(() => {
            const i = new Image();
            i.decoding = "async";
            i.src = driveCdnSrc(id, 1600);
        }, [id]);

        // Cleanup di eventuali objectURL creati per HEIC
        const revokeObjUrl = useCallback(() => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        }, []);

        useEffect(() => revokeObjUrl, [revokeObjUrl]);

        const handleError = useCallback(async (e) => {
            const img = e.currentTarget;

            // Se già abbiamo una conversione in cache → usa quella
            const cached = heicUrlCacheRef.current.get(id);
            if (cached) {
                img.removeAttribute("srcset");
                img.removeAttribute("sizes");
                img.src = cached;
                return;
            }

            // Se HEIC/HEIF: prova transcodifica client-side → WEBP
            if (isHeic) {
                try {
                    // prendi l'originale (potrebbe essere HEIC)
                    const r = await fetch(`${API_BASE}/api/drive/file/${id}`);
                    const blob = await r.blob();

                    // import dinamico: caricato SOLO quando serve
                    const heic2any = (await import("heic2any")).default;
                    const out = await heic2any({ blob, toType: "image/webp", quality: 0.8 });

                    const webpBlob = Array.isArray(out) ? out[0] : out;
                    const url = URL.createObjectURL(webpBlob);
                    objectUrlRef.current = url;
                    heicUrlCacheRef.current.set(id, url);

                    img.removeAttribute("srcset");
                    img.removeAttribute("sizes");
                    img.src = url;
                    return;
                } catch (err) {
                    // se conversione fallisce, tenta comunque l'originale (se il browser lo supporta)
                    console.warn("HEIC conversion failed, fallback to original", err);
                }
            }

            // Fallback generico: original via API (PNG/JPEG ok, HEIC no se browser non supporta)
            img.removeAttribute("srcset");
            img.removeAttribute("sizes");
            img.src = `${API_BASE}/api/drive/file/${id}`;
        }, [API_BASE, id, isHeic]);

        return (
            <Box
                ref={boxRef}
                role="button"
                onClick={() => { onPick(driveCdnSrc(id, 1600)); onClose(); }}
                onMouseEnter={prefetchLarge}
                onTouchStart={prefetchLarge}
                sx={{
                    position: "relative",
                    width: "100%",
                    pt: "66.666%",
                    overflow: "hidden",
                    borderRadius: 1,
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    "&:hover": { outline: "2px solid", outlineColor: "primary.main" },
                    contentVisibility: "auto",
                    containIntrinsicSize: "120px 80px",
                    background: "#111",
                }}
            >
                <img
                    ref={imgRef}
                    alt={name}
                    decoding="async"
                    loading="lazy"
                    onError={handleError}
                    onLoad={() => {
                        // se abbiamo usato un objectURL per HEIC, nulla da fare qui
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </Box>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ImageIcon color="primary" /> Seleziona copertina da Drive
                <IconButton onClick={onClose} sx={{ ml: "auto" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ background: "#101014" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Filtra per nome…"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button onClick={load} variant="outlined" sx={{ color: "primary.main", borderColor: "primary.main" }}>
                        Ricarica
                    </Button>
                </Stack>

                {loading && (
                    <Grid container spacing={1}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Grid item xs={6} sm={4} md={3} key={i}>
                                <Skeleton variant="rectangular" height={120} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && error && (
                    <Paper sx={{ p: 2, textAlign: "center", border: "1px dashed rgba(255,255,255,.15)" }}>{error}</Paper>
                )}

                {!loading && !error && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, 1fr)",
                                sm: "repeat(3, 1fr)",
                                md: "repeat(4, 1fr)",
                                lg: "repeat(6, 1fr)",
                            },
                            gap: 1,
                        }}
                    >
                        {filtered.slice(0, visible).map((img, i) => (
                            <DriveThumb
                                key={img.id}
                                id={img.id}
                                name={img.name}
                                mimeType={img.mimeType}
                                index={i}
                            />
                        ))}
                        <Box ref={sentinelRef} sx={{ height: 1, gridColumn: "1 / -1" }} />
                        {!filtered.length && (
                            <Box sx={{ gridColumn: "1/-1", p: 3, textAlign: "center", opacity: 0.7 }}>
                                Nessuna immagine trovata.
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default DriveImagePickerDialog;
