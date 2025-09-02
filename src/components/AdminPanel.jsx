import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    fetchBookings,
    createEvent,
    fetchEvents,
    updateEvent,
    deleteEvent,
    setAuthToken,
    verifyBooking,
    checkInBooking,
    undoCheckIn,
    updateBooking,
    deleteBooking,
    deleteAllBookings,
    deleteAllEvents,
} from "../api";

import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Autocomplete as MUIAutocomplete,
    Button,
    CssBaseline,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Switch,
    Divider,
    IconButton,
    Grid,
    Paper,
    useMediaQuery,
    useTheme,
    Tooltip,
    Chip,
    Stack,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    Card,
    CardContent,
    CardActions,
    TableContainer,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    FormHelperText,
    TablePagination
} from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";

// assets
import heroImg from "../assets/img/hero.png";

// icons
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LockClockIcon from "@mui/icons-material/LockClock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import PlaceIcon from "@mui/icons-material/Place";
import EuroIcon from "@mui/icons-material/Euro";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import IosShareIcon from "@mui/icons-material/IosShare";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LinkIcon from "@mui/icons-material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import UndoIcon from "@mui/icons-material/Undo";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";




import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import jsQR from "jsqr";


// Drive utils
import { listImagesInFolder, driveCdnSrc, driveApiSrc } from "../lib/driveGallery";

/* ---------------- THEME ---------------- */
const drawerWidth = 256;
const muiTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#FFD54F" },
        secondary: { main: "#E53935" },
        background: { default: "#0B0B0D", paper: "#141418" },
    },
    shape: { borderRadius: 12 },
    typography: {
        button: { textTransform: "none", fontWeight: 600 },
        h5: { fontWeight: 700 },
    },
    components: {
        MuiTableCell: { styleOverrides: { head: { fontWeight: 700, background: "#1b1b22" } } },
        MuiButton: { defaultProps: { disableElevation: true } },
       // MuiPaper: { styleOverrides: { root: { backdropFilter: "blur(6px)" } } },
        MuiTextField: { defaultProps: { size: "medium", fullWidth: true } },
    },
});
const glass = {
    backgroundColor: "rgba(20,20,24,0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 26px rgba(0,0,0,0.45)",
};

/* ----------- DATE UTILS ----------- */

/* ----------- Firestore Timestamp helpers ----------- */
const tsToDate = (v) => {
    if (!v) return null;
    if (typeof v?.toDate === "function") return v.toDate(); // Timestamp
    if (typeof v === "object" && (v.seconds || v._seconds)) {
        const s = v.seconds ?? v._seconds;
        const ns = v.nanoseconds ?? v._nanoseconds ?? 0;
        return new Date(s * 1000 + Math.floor(ns / 1e6));
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const toISO = (v) => {
    const d = tsToDate(v);
    return d ? d.toISOString() : "";
};


const todayISO = () => new Date().toISOString().slice(0, 10);
const eventDateTime = (ev) => {
    const d = ev?.date || "";
    const t = ev?.time || "00:00";
    const dt = new Date(`${d}T${t}:00`);
    return isNaN(dt.getTime()) ? null : dt;
};
const isPast = (ev) => {
    const dt = eventDateTime(ev);
    return dt ? dt.getTime() < Date.now() : false;
};

// ======= GEOAPIFY Autocomplete (OSM) =======

function PlaceAutocomplete({
                               value,
                               onChange,
                               inputValue,
                               onInputChange,
                               error,
                               helperText,
                               onCoords,
                           }) {
    const [preds, setPreds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initError, setInitError] = useState("");
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    const apiKey =
        (import.meta?.env && import.meta.env.VITE_GEOAPIFY_KEY) ||
        (window.APP_CONFIG && window.APP_CONFIG.GEOAPIFY_KEY);

    useEffect(() => {
        if (!apiKey) setInitError("Geoapify API key mancante");
    }, [apiKey]);

    useEffect(() => {
        const q = (inputValue || "").trim();
        if (!apiKey) return;
        if (!q) {
            setPreds([]);
            return;
        }
        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                if (abortRef.current) abortRef.current.abort();
                abortRef.current = new AbortController();

                const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
                url.searchParams.set("text", q);
                url.searchParams.set("limit", "7");
                url.searchParams.set("lang", "it");
                // opzionale: restrizione paese → Italia
                // url.searchParams.set("filter", "countrycode:it");
                url.searchParams.set("apiKey", apiKey);

                const r = await fetch(url.toString(), { signal: abortRef.current.signal });
                const data = await r.json();
                const rows = (data?.features || []).map((f) => {
                    const p = f.properties || {};
                    return {
                        label: p.formatted || p.address_line1 || p.name || "",
                        place_id: p.place_id || p.datasource?.raw?.osm_id || p.osm_id || p.datasource?.feature_id || Math.random().toString(36).slice(2),
                        main_text: p.address_line1 || p.name || p.street || "",
                        secondary_text: p.address_line2 || [p.postcode, p.city, p.country].filter(Boolean).join(" "),
                        lat: p.lat,
                        lon: p.lon,
                    };
                });
                setPreds(rows);
            } catch (e) {
                if (e?.name !== "AbortError") {
                    setPreds([]);
                }
            } finally {
                setLoading(false);
            }
        }, 220);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [inputValue, apiKey]);

    const selectOption = (_evt, opt) => {
        if (!opt) {
            onChange(null);
            onCoords?.(null);
            return;
        }
        onChange({
            label: opt.label,
            place_id: opt.place_id,
            verified: true,
            lat: opt.lat,
            lon: opt.lon,
        });
        if (opt.lat && opt.lon) onCoords?.({ lat: opt.lat, lon: opt.lon });
    };

    return (
        <MUIAutocomplete
            options={preds}
            value={value}
            onChange={selectOption}
            inputValue={inputValue}
            onInputChange={(e, v) => onInputChange(v)}
            getOptionLabel={(o) => o?.label || ""}
            noOptionsText={initError ? "Geoapify non configurato" : "Nessun risultato"}
            loading={loading}
            clearOnBlur={false}
            blurOnSelect
            isOptionEqualToValue={(o, v) => o.place_id === v.place_id}
            renderOption={(props, option) => (
                <li {...props} key={option.place_id}>
                    <Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {option.main_text || option.label}
                        </Typography>
                        {option.secondary_text && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {option.secondary_text}
                            </Typography>
                        )}
                    </Stack>
                </li>
            )}
            renderInput={(params) => {
                const { InputProps, ...rest } = params;
                return (
                    <TextField
                        {...rest}
                        label="Cerca e seleziona un luogo"
                        required
                        error={!!error || !!initError}
                        helperText={initError || helperText || "Suggerimenti da OSM/Geoapify"}
                        InputProps={{
                            ...InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PlaceIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
                                "&:hover fieldset": { borderColor: "primary.main" },
                                "&.Mui-focused fieldset": { borderColor: "primary.main" },
                            },
                        }}
                    />
                );
            }}
        />
    );
}

/* =========================================
   Dialog selezione copertina da Drive — griglia responsive (ottimizzata + HEIC)
   ========================================= */
function DriveImagePickerDialog({ open, onClose, onPick }) {
    const apiKey =
        (import.meta?.env && import.meta.env.VITE_GOOGLE_API_KEY) ||
        (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY);
    const folderId =
        (import.meta?.env && import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID) ||
        (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID);

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
        if (!apiKey || !folderId) {
            setError("Config mancante: API_KEY o FOLDER_ID");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const list = await listImagesInFolder(folderId, {
                apiKey,
                includeSharedDrives: true,
                pageSize: 200,
            });
            setItems(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error(e);
            setError("Impossibile caricare le immagini da Drive.");
        } finally {
            setLoading(false);
        }
    }, [apiKey, folderId]);

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
                    const r = await fetch(driveApiSrc(id, apiKey));
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
            img.src = driveApiSrc(id, apiKey);
        }, [apiKey, id, isHeic]);

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


/* ------------ MOBILE CARDS ------------ */
function MobileEventCard({ ev, onEdit, onDelete, onToggleSoldOut, onDuplicate, onExportICS, canDelete }) {
    const past = isPast(ev);
    const statusColor =
        ev.status === "draft" ? "default" : ev.status === "archived" ? "warning" : "success";
    return (
        <Card sx={{ mb: 1.5, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ pb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
                    {!past ? <CheckCircleIcon color="success" fontSize="small" /> : <LockClockIcon color="disabled" fontSize="small" />}
                    <Typography variant="subtitle1" fontWeight={700}>{ev.name}</Typography>
                    <Chip size="small" label={ev.status || "published"} sx={{ ml: "auto" }} color={statusColor} />
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{ev.dj || "—"}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{ev.place || "—"}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1, opacity: 0.8 }}>
                    <Typography variant="caption">📅 {ev.date}</Typography>
                    <Typography variant="caption">⏰ {ev.time}</Typography>
                    <Typography variant="caption">👥 {ev.capacity || "-"}</Typography>
                </Stack>
            </CardContent>
            <CardActions sx={{ pt: 0, pb: 1.5, px: 2, justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">Sold Out</Typography>
                    <Switch size="small" color="warning" checked={!!ev.soldOut} onChange={(e) => onToggleSoldOut(e.target.checked)} disabled={past} />
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Duplica"><IconButton size="small" onClick={onDuplicate}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title=".ics"><IconButton size="small" onClick={onExportICS}><CalendarMonthIcon fontSize="small" /></IconButton></Tooltip>
                    <Button size="small" startIcon={<EditIcon />} onClick={onEdit} disabled={past}>Modifica</Button>
                    <span>
            <IconButton size="small" color="error" onClick={onDelete} disabled={past || !canDelete}><DeleteIcon fontSize="small" /></IconButton>
          </span>
                </Stack>
            </CardActions>
        </Card>
    );
}
function MobileBookingCard({ b }) {
    return (
        <Card sx={{ mb: 1.2, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{b.nome} {b.cognome}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{b.email}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.85 }}>
                    <Typography variant="caption">📞 {b.telefono}</Typography>
                    <Typography variant="caption">🎟️ {b.quantity || 1}</Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

/* ---------- Helpers ---------- */
const roles = { admin: "admin", editor: "editor", staff: "staff" };
const canDeleteEvent = (role) => role === roles.admin;
const canEditEvent = (role) => role === roles.admin || role === roles.editor;

/* --------------- MAIN --------------- */
const AdminPanel = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

    const [section, setSection] = useState("events");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null, type: "" });

    const isAdmin = localStorage.getItem("isAdmin") === "true";

    const {
        data: bookingsData = [],
        refetch: refetchBookings,
    } = useQuery({
        queryKey: ["bookings"],
        queryFn: fetchBookings,
        enabled: isAdmin,
        onError: (err) => {
            if (err?.response?.status === 401) {
                setAuthToken(null);
                localStorage.removeItem("isAdmin");
                navigate("/admin");
            }
        },
    });

    const {
        data: eventsData = [],
        refetch: refetchEvents,
    } = useQuery({
        queryKey: ["events"],
        queryFn: fetchEvents,
        enabled: isAdmin,
        onError: (err) => {
            if (err?.response?.status === 401) {
                setAuthToken(null);
                localStorage.removeItem("isAdmin");
                navigate("/admin");
            }
        },
    });

    const [bookings, setBookings] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        setBookings(bookingsData);
    }, [bookingsData]);

    useEffect(() => {
        setEvents(eventsData);
    }, [eventsData]);

    // pagination
    const [evPage, setEvPage] = useState(0);
    const [evRowsPerPage, setEvRowsPerPage] = useState(10);
    const [bkPage, setBkPage] = useState(0);
    const [bkRowsPerPage, setBkRowsPerPage] = useState(10);

    // filtro prenotazioni per evento
    const [bkEventFilter, setBkEventFilter] = useState("all");

    // dialog modifica prenotazione
    const [bkEdit, setBkEdit] = useState(null);
    const openBookingEdit = (b) => setBkEdit(b);
    const closeBookingEdit = () => setBkEdit(null);

    // ⬇️⬇️ NUOVO: salva modifica prenotazione
    const saveBookingEdit = async () => {
        if (!bkEdit?.id) return;
        const payload = {
            eventId: bkEdit.eventId || "",
            nome: (bkEdit.nome || "").trim(),
            cognome: (bkEdit.cognome || "").trim(),
            email: (bkEdit.email || "").trim(),
            telefono: (bkEdit.telefono || "").trim(),
            quantity: Math.max(1, parseInt(bkEdit.quantity, 10) || 1),
        };
        try {
            await updateBooking(bkEdit.id, payload);
            setBookings((prev) => prev.map((b) => (b.id === bkEdit.id ? { ...b, ...payload } : b)));
            setBkEdit(null);
            showToast("Prenotazione aggiornata", "success");
        } catch (e) {
            showToast("Errore aggiornamento prenotazione", "error");
        }
    };
    // ⬆️⬆️ FINE NUOVO

    // rbac
    const role = (localStorage.getItem("role") || "admin").toLowerCase();

    // refs per scorciatoie
    const evSearchRef = useRef(null);
    const bkSearchRef = useRef(null);
    const formRef = useRef(null);
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);

    // form
    const [formData, setFormData] = useState({
        name: "",
        dj: "",
        date: "",
        time: "",
        price: "",
        capacity: "",
        description: "",
        soldOut: false,
        image: "",
        place: "",
        placeCoords: null,
        placeId: null,
        status: "published", // draft | published | archived
        internalNotes: "",
        guestList: "",
    });
    const [errors, setErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    // places
    const [placeSelected, setPlaceSelected] = useState(null);
    const [placeInput, setPlaceInput] = useState("");
    const [placeCoords, setPlaceCoords] = useState(null);

    // drive link
    const driveFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
    const driveFolderLinkEnv = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER;
    const driveFolderLink = driveFolderLinkEnv?.startsWith("http")
        ? driveFolderLinkEnv
        : driveFolderId
            ? `https://drive.google.com/drive/u/0/folders/${driveFolderId}`
            : "";

    // bootstrap guard
    useEffect(() => {
        const t = localStorage.getItem("adminToken");
        if (t) setAuthToken(t);
        if (!isAdmin) {
            navigate("/admin");
        }
    }, [navigate, isAdmin]);

    // scorciatoie
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                if (section === "events") evSearchRef.current?.focus();
                if (section === "bookings") bkSearchRef.current?.focus();
            }
            if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey) && section === "create") {
                e.preventDefault();
                formRef.current?.requestSubmit?.();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [section, role]);

    const openExternal = (url) => url && window.open(url, "_blank", "noopener,noreferrer");

    // compress + crop 16:9 → webp
    const toWebp16x9 = (file) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const w = img.width,
                    h = img.height;
                const targetRatio = 16 / 9;
                let sx = 0,
                    sy = 0,
                    sw = w,
                    sh = h;
                if (w / h > targetRatio) {
                    sw = h * targetRatio;
                    sx = (w - sw) / 2;
                } else {
                    sh = w / targetRatio;
                    sy = (h - sh) / 2;
                }
                const canvas = document.createElement("canvas");
                canvas.width = 1600;
                canvas.height = 900;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1600, 900);
                canvas.toBlob(
                    (blob) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    },
                    "image/webp",
                    0.85
                );
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });

    // pick immagine da device
    const onPickFromDevice = () => fileInputRef.current?.click();
    const onDeviceFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const webp = await toWebp16x9(file);
        if (webp) setFormData((f) => ({ ...f, image: webp }));
        else {
            const reader = new FileReader();
            reader.onload = () => setFormData((f) => ({ ...f, image: reader.result || "" }));
            reader.readAsDataURL(file);
        }
    };

    // validazione
    const validate = () => {
        const e = {};
        if (!formData.name?.trim()) e.name = "Inserisci un nome";
        if (!formData.date) e.date = "Scegli una data";
        if (!formData.time) e.time = "Inserisci un orario";
        if (formData.date && formData.time) {
            const dt = new Date(`${formData.date}T${formData.time}:00`);
            if (isNaN(dt.getTime()) || dt.getTime() <= Date.now()) e.time = "Data/ora deve essere nel futuro";
        }
        if (formData.price !== "" && Number(formData.price) < 0) e.price = "Prezzo non valido";
        if (
            formData.capacity !== "" &&
            (!Number.isInteger(Number(formData.capacity)) || Number(formData.capacity) < 0)
        )
            e.capacity = "Capienza non valida";
        if (!placeSelected?.place_id || !placeCoords) e.place = "Seleziona un luogo dai suggerimenti";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const diffObjects = (a, b) => {
        const d = {};
        Object.keys({ ...a, ...b }).forEach((k) => {
            if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) d[k] = { from: a[k], to: b[k] };
        });
        return d;
    };

    const resetForm = () => {
        setEditingId(null);
        setErrors({});
        setPlaceSelected(null);
        setPlaceInput("");
        setPlaceCoords(null);
        setFormData({
            name: "",
            dj: "",
            date: "",
            time: "",
            price: "",
            capacity: "",
            description: "",
            soldOut: false,
            image: "",
            place: "",
            placeCoords: null,
            placeId: null,
            status: "published",
            internalNotes: "",
            guestList: "",
        });
    };

    const handleChange = (ev) => setFormData({ ...formData, [ev.target.name]: ev.target.value });

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        const userEmail = auth?.currentUser?.email || "admin";
        try {
            const payload = {
                ...formData,
                image: formData.image || heroImg,
                place: placeSelected?.label || formData.place,
                placeCoords: placeCoords || formData.placeCoords || null,
                placeId: placeSelected?.place_id || formData.placeId || null,
                updatedAt: new Date().toISOString(),
                updatedBy: userEmail,
            };
            if (editingId) {
                const prev = events.find((e) => e.id === editingId) || {};
                payload.lastDiff = diffObjects(prev, payload);
                await updateEvent(editingId, payload);
                showToast("Evento aggiornato", "success");
            } else {
                payload.lastDiff = diffObjects({}, payload);
                await createEvent(payload);
                showToast("Evento creato", "success");
            }
            await refetchEvents();
            resetForm();
            setSection("events");
        } catch (err) {
            if (err?.response?.status === 401) {
                setAuthToken(null);
                localStorage.removeItem("isAdmin");
                navigate("/admin");
            } else {
                showToast("Errore nel salvataggio", "error");
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteEvent(id);
            await refetchEvents();
            showToast("Evento eliminato", "success");
        } catch {
            showToast("Errore", "error");
        }
    };

    const handleEdit = (ev) => {
        setFormData({
            name: ev.name || "",
            dj: ev.dj || "",
            date: ev.date || "",
            time: ev.time || "",
            price: ev.price || "",
            capacity: ev.capacity || "",
            description: ev.description || "",
            soldOut: !!ev.soldOut,
            image: ev.image || "",
            place: ev.place || "",
            placeCoords: ev.placeCoords || null,
            placeId: ev.placeId || null,
            status: ev.status || "published",
            internalNotes: ev.internalNotes || "",
            guestList: ev.guestList || "",
        });
        if (ev.place) {
            setPlaceSelected({
                label: ev.place,
                place_id: ev.placeId || "",
                ...(ev.placeCoords || {}),
                verified: true,
            });
            setPlaceInput(ev.place);
            setPlaceCoords(ev.placeCoords || null);
        } else {
            setPlaceSelected(null);
            setPlaceInput("");
            setPlaceCoords(null);
        }
        setEditingId(ev.id);
        setSection("create");
    };

    const handleToggleSoldOut = async (id, value) => {
        await updateEvent(id, {
            soldOut: value,
            updatedAt: new Date().toISOString(),
            updatedBy: auth?.currentUser?.email || "admin",
        });
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, soldOut: value } : e)));
    };

    // Duplica
    const handleDuplicate = (ev) => {
        if (!canEditEvent(role)) return;
        const { id, date, time, soldOut, updatedAt, updatedBy, lastDiff, ...rest } = ev;
        setEditingId(null);
        setFormData({
            ...rest,
            date: "",
            time: "",
            soldOut: false,
            status: "draft",
        });
        if (ev.place) {
            setPlaceSelected({ label: ev.place, place_id: ev.placeId || "", ...(ev.placeCoords || {}) });
            setPlaceInput(ev.place);
            setPlaceCoords(ev.placeCoords || null);
        }
        setSection("create");
    };

    // Export ICS
    const exportICS = (ev) => {
        const dtStart = `${ev.date}T${(ev.time || "00:00").replace(":", "")}00`;
        const dtEnd = `${ev.date}T${(ev.time || "00:00").replace(":", "")}00`;
        const ics = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//AdminPanel//EN",
            "BEGIN:VEVENT",
            `UID:${ev.id || crypto.randomUUID()}@adminpanel`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}Z`,
            `DTSTART:${dtStart.replace(/[-:]/g, "")}`,
            `DTEND:${dtEnd.replace(/[-:]/g, "")}`,
            `SUMMARY:${(ev.name || "").replace(/\n/g, " ")}`,
            `DESCRIPTION:${(ev.description || "").replace(/\n/g, "\\n")}`,
            `LOCATION:${(ev.place || "").replace(/\n/g, " ")}`,
            "END:VEVENT",
            "END:VCALENDAR",
        ].join("\r\n");
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(ev.name || "evento").replace(/\s+/g, "_")}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Auto SoldOut (se abbiamo conteggi)
    const recomputeAutoSoldOut = useCallback(async () => {
        const updates = [];
        for (const ev of events) {
            const capacity = Number(ev.capacity) || 0;
            let sold = Number(ev.bookingsCount || 0);
            if (!sold && Array.isArray(bookings) && bookings.length && ev.id) {
                try {
                    sold = bookings
                        .filter((b) => b.eventId === ev.id)
                        .reduce((n, b) => n + (b.quantity || 1), 0);
                } catch {}
            }
            const shouldBeSoldOut = capacity > 0 && sold >= capacity;
            if (shouldBeSoldOut && !ev.soldOut) {
                updates.push(updateEvent(ev.id, { soldOut: true }));
            }
        }
        if (updates.length) {
            await Promise.all(updates);
            await refetchEvents();
            showToast("Aggiornato stato Sold Out automaticamente", "info");
        }
    }, [events, bookings, showToast, refetchEvents]);

    useEffect(() => {
        recomputeAutoSoldOut();
    }, [recomputeAutoSoldOut]);

    /* ---------- FILTRI EVENTI ---------- */
    const [evQuery, setEvQuery] = useState("");
    const [evStatus, setEvStatus] = useState("all"); // all|future|past
    const [evSort, setEvSort] = useState({ key: "date", dir: "asc" }); // date|name|place
    const [statusFilter, setStatusFilter] = useState("all"); // all|draft|published|archived

    const filteredSortedEvents = useMemo(() => {
        const q = evQuery.toLowerCase().trim();
        let list = [...events];
        list = list.filter((ev) => {
            const past = isPast(ev);
            if (evStatus === "future") return !past;
            if (evStatus === "past") return past;
            return true;
        });
        if (statusFilter !== "all")
            list = list.filter((e) => (e.status || "published") === statusFilter);
        if (q) {
            list = list.filter((ev) =>
                [ev.name, ev.dj, ev.place].filter(Boolean).some((s) => s.toLowerCase().includes(q))
            );
        }
        const cmp = (a, b) => {
            let va, vb;
            if (evSort.key === "date") {
                va = eventDateTime(a)?.getTime() || 0;
                vb = eventDateTime(b)?.getTime() || 0;
            } else if (evSort.key === "name") {
                va = (a.name || "").toLowerCase();
                vb = (b.name || "").toLowerCase();
            } else {
                va = (a.place || "").toLowerCase();
                vb = (b.place || "").toLowerCase();
            }
            if (va < vb) return evSort.dir === "asc" ? -1 : 1;
            if (va > vb) return evSort.dir === "asc" ? 1 : -1;
            return 0;
        };
        return list.sort(cmp);
    }, [events, evQuery, evStatus, evSort, statusFilter]);

    /* ---------- FILTRI PRENOTAZIONI ---------- */
    const [bkQuery, setBkQuery] = useState("");
    const [bkSort, setBkSort] = useState({ key: "created", dir: "desc" });

    const filteredSortedBookings = useMemo(() => {
        const q = bkQuery.toLowerCase().trim();
        let list = [...bookings];

        if (bkEventFilter !== "all") {
            list = list.filter((b) => (b.eventId || "") === bkEventFilter);
        }

        if (q) {
            list = list.filter((b) =>
                [b.nome, b.cognome, b.email, b.telefono]
                    .filter(Boolean)
                    .some((s) => (s + "").toLowerCase().includes(q))
            );
        }

        const cmp = (a, b) => {
            let va, vb;
            if (bkSort.key === "created") {
                va = tsToDate(a.createdAt || a.created)?.getTime() ?? 0;
                vb = tsToDate(b.createdAt || b.created)?.getTime() ?? 0;
            } else if (bkSort.key === "name") {
                va = `${a.nome || ""} ${a.cognome || ""}`.toLowerCase();
                vb = `${b.nome || ""} ${b.cognome || ""}`.toLowerCase();
            } else {
                va = a.quantity || 1;
                vb = b.quantity || 1;
            }
            if (va < vb) return bkSort.dir === "asc" ? -1 : 1;
            if (va > vb) return bkSort.dir === "asc" ? 1 : -1;
            return 0;
        };

        return list.sort(cmp);
    }, [bookings, bkQuery, bkSort, bkEventFilter]);

    useEffect(() => {
        setEvPage(0);
    }, [evQuery, evStatus, evSort, statusFilter, events.length]);
    useEffect(() => {
        setBkPage(0);
    }, [bkQuery, bkSort, bkEventFilter, bookings.length]);

    const evPageRows = filteredSortedEvents.slice(
        evPage * evRowsPerPage,
        evPage * evRowsPerPage + evRowsPerPage
    );
    const bkPageRows = filteredSortedBookings.slice(
        bkPage * bkRowsPerPage,
        bkPage * bkRowsPerPage + bkRowsPerPage
    );

    const [evMobileVis, setEvMobileVis] = useState(12);
    const evSentinelRef = useRef(null);

    useEffect(() => { setEvMobileVis(12); }, [evQuery, evStatus, evSort, statusFilter, events.length]);

    useEffect(() => {
        const el = evSentinelRef.current;
        if (!isMobile || !el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setEvMobileVis((v) => Math.min(v + 12, filteredSortedEvents.length));
            }
        }, { rootMargin: "600px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [isMobile, filteredSortedEvents.length]);

    const [bkMobileVis, setBkMobileVis] = useState(20);
    const bkSentinelRef = useRef(null);

    useEffect(() => { setBkMobileVis(20); }, [bkQuery, bkSort, bkEventFilter, bookings.length]);

    useEffect(() => {
        const el = bkSentinelRef.current;
        if (!isMobile || !el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setBkMobileVis((v) => Math.min(v + 20, filteredSortedBookings.length));
            }
        }, { rootMargin: "600px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [isMobile, filteredSortedBookings.length]);


    /* ---------- CSV Export ---------- */
    const downloadCsv = (rows, filename) => {
        const headers = Object.keys(rows[0] || {});
        const csv = [
            headers.join(","),
            ...rows.map((r) =>
                headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };
    const exportEventsCsv = () => {
        const rows = filteredSortedEvents.map((e) => ({
            Id: e.id || "",
            Nome: e.name || "",
            DJ: e.dj || "",
            Stato: e.status || "published",
            Data: e.date || "",
            Ora: e.time || "",
            Luogo: e.place || "",
            Capienza: e.capacity || "",
            SoldOut: e.soldOut ? "sì" : "no",
            Prenotazioni: e.bookingsCount ?? "",
            AggiornatoIl: e.updatedAt || "",
            AggiornatoDa: e.updatedBy || "",
        }));
        downloadCsv(rows, "eventi.csv");
    };
    const exportBookingsCsv = () => {
        const rows = filteredSortedBookings.map((b) => ({
            Id: b.id || "",
            Evento: b.eventName || b.eventId || "",
            Nome: b.nome || "",
            Cognome: b.cognome || "",
            Email: b.email || "",
            Telefono: b.telefono || "",
            Biglietti: b.quantity || 1,
            CreatoIl: toISO(b.createdAt || b.created),
        }));
        downloadCsv(rows, "prenotazioni.csv");
    };

    /* ---------- Drawer ---------- */
    const navItems = [
        { key: "events", label: "Eventi", icon: <CalendarTodayIcon /> },
        { key: "create", label: "Crea / Modifica Evento", icon: <AddCircleOutlineIcon /> },
        { key: "bookings", label: "Prenotazioni", icon: <ListAltIcon /> },
        { key: "checkin", label: "Check-in", icon: <QrCodeScannerIcon /> },
        { key: "gallery", label: "Gallery", icon: <PhotoLibraryIcon /> },
    ].filter((item) => {
        if (role === roles.staff) return item.key === "checkin" || item.key === "bookings";
        return true;
    });

    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem disablePadding key={item.key}>
                        <ListItemButton
                            onClick={() => {
                                setSection(item.key);
                                setMobileOpen(false);
                            }}
                            selected={section === item.key}
                            sx={{
                                borderRadius: 1,
                                "&.Mui-selected": {
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
                                },
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    /* ---------- Header badge ---------- */
    const Badge = ({ icon, label }) => (
        <Chip
            icon={icon}
            label={label}
            sx={{
                bgcolor: "rgba(255,213,79,0.12)",
                color: "primary.main",
                border: "1px solid rgba(255,213,79,0.35)",
                "& .MuiChip-icon": { color: "primary.main" },
            }}
            variant="outlined"
        />
    );

    /* ---------- Dialog Drive ---------- */
    const [driveDialogOpen, setDriveDialogOpen] = useState(false);

    /* ---------- Logout ---------- */
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch {}
        setAuthToken(null);
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminToken");
        navigate("/admin");
    };

    /* ---------- isValid per azioni sticky ---------- */
    const isValid = useMemo(
        () => Boolean(formData.name && formData.date && formData.time),
        [formData]
    );

    return (
        <MuiThemeProvider theme={muiTheme}>
            <Box sx={{ display: "flex", minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
            <CssBaseline />

                {/* HEADER */}
                <AppBar
                    position="fixed"
                    sx={{
                        ...glass,
                        zIndex: (t) => t.zIndex.drawer + 1,
                        color: "primary.main",
                        background: "linear-gradient(90deg, #0b0b0d 0%, #171722 50%, #222235 100%)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <Toolbar sx={{ gap: 1, justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                                {isMobile && (
                                    <IconButton
                                        color="inherit"
                                        onClick={() => setMobileOpen(true)}
                                        aria-label="Apri menu"
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                )}
                                <Typography variant="h6" noWrap>
                                    Admin —{" "}
                                    {section === "create"
                                        ? "Crea / Modifica Evento"
                                        : section.charAt(0).toUpperCase() + section.slice(1)}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
                                <Badge
                                    icon={<EventAvailableIcon />}
                                    label={`Futuri: ${events.filter((e) => !isPast(e)).length}`}
                                />
                                <Badge icon={<EventBusyIcon />} label={`Passati: ${events.filter(isPast).length}`} />
                                <Badge icon={<ListAltIcon />} label={`Prenotazioni: ${bookings.length}`} />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                            {driveFolderLink && (
                                <Tooltip title="Apri cartella Drive">
                                    <IconButton
                                        component="a"
                                        href={driveFolderLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="inherit"
                                        aria-label="Drive"
                                    >
                                        <AddToDriveIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Logout">
                                <IconButton color="inherit" onClick={handleLogout} aria-label="Logout">
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Toolbar>
                </AppBar>

                {/* DRAWER */}
                <Drawer
                    variant={isMobile ? "temporary" : "permanent"}
                    open={isMobile ? mobileOpen : true}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            ...glass,
                            width: drawerWidth,
                            boxSizing: "border-box",
                            color: "var(--white)",
                            borderRadius: "0 12px 12px 0",
                            backgroundImage: "linear-gradient(180deg, #121218 0%, #171722 100%)",
                        },
                    }}
                >
                    <Toolbar />
                    <Divider />
                    {drawer}
                </Drawer>

                {/* MAIN */}
                <Box component="main" sx={{ flexGrow: 1,p: { xs: 1.5, md: 3 }, overflowX: "hidden" , minWidth: 0 }}>
                <Toolbar />

                    {/* EVENTI */}
                    {section === "events" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2 }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.5}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2 }}
                            >
                                <TextField
                                    size="small"
                                    placeholder="Cerca per nome / DJ / luogo"
                                    value={evQuery}
                                    inputRef={evSearchRef}
                                    onChange={(e) => setEvQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    fullWidth={isMobile}
                                    sx={{ minWidth: 260 }}
                                />
                                <Stack  direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        flexWrap="wrap"
                                        sx={{ rowGap: 1, "& > *": { mt: { xs: 1, md: 0 } } }}>
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <MenuItem value="all">Tutti gli status</MenuItem>
                                            <MenuItem value="draft">Bozze</MenuItem>
                                            <MenuItem value="published">Pubblicati</MenuItem>
                                            <MenuItem value="archived">Archiviati</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <SortIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                        <FormControl size="small">
                                            <Select
                                                value={`${evSort.key}-${evSort.dir}`}
                                                onChange={(e) => {
                                                    const [key, dir] = e.target.value.split("-");
                                                    setEvSort({ key, dir });
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "rgba(255,255,255,0.18)",
                                                    },
                                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "primary.main",
                                                    },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: "primary.main",
                                                    },
                                                    "& .MuiSelect-icon": { color: "primary.main" },
                                                }}
                                            >
                                                <MenuItem value="date-asc">Data ↑</MenuItem>
                                                <MenuItem value="date-desc">Data ↓</MenuItem>
                                                <MenuItem value="name-asc">Nome ↑</MenuItem>
                                                <MenuItem value="name-desc">Nome ↓</MenuItem>
                                                <MenuItem value="place-asc">Luogo ↑</MenuItem>
                                                <MenuItem value="place-desc">Luogo ↓</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                    <Button variant="outlined" startIcon={<IosShareIcon />} onClick={exportEventsCsv}>
                                        Esporta CSV
                                    </Button>
                                    {canEditEvent(role) && (
                                        <Button
                                            startIcon={<AddCircleOutlineIcon />}
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                                resetForm();
                                                setSection("create");
                                            }}
                                        >
                                            Nuovo evento
                                        </Button>
                                    )}
                                    <Button
                                        color="error"
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                            setConfirm({
                                                open: true,
                                                id: null,
                                                type: "event-all",
                                                filterStatus: statusFilter !== "all" ? statusFilter : null,
                                            })
                                        }
                                    >
                                        Elimina {statusFilter !== "all" ? "tutti (filtrati)" : "tutti gli eventi"}
                                    </Button>
                                </Stack>
                            </Stack>

                            {isMobile ? (
                                <Box sx={{ overflowX: "hidden" }}>
                                    {filteredSortedEvents.length === 0 && (
                                        <Box sx={{ p: 3, textAlign: "center", opacity: 0.7, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 2 }}>
                                            Nessun evento con i filtri attuali.
                                        </Box>
                                    )}
                                    {filteredSortedEvents.slice(0, evMobileVis).map((ev) => (
                                        <MobileEventCard
                                            key={ev.id}
                                            ev={ev}
                                            onEdit={() => handleEdit(ev)}
                                            onDelete={() => setConfirm({ open: true, id: ev.id, type: "event" })}
                                            onToggleSoldOut={async (val) => { if (!isPast(ev)) await handleToggleSoldOut(ev.id, val); }}
                                            onDuplicate={() => handleDuplicate(ev)}
                                            onExportICS={() => exportICS(ev)}
                                            canDelete={canDeleteEvent(role)}
                                        />
                                    ))}
                                    <Box ref={evSentinelRef} sx={{ height: 1 }} />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Nome</TableCell>
                                                <TableCell>DJ</TableCell>
                                                <TableCell>Luogo</TableCell>
                                                <TableCell>Data</TableCell>
                                                <TableCell>Ora</TableCell>
                                                <TableCell>Capienza</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Sold Out</TableCell>
                                                <TableCell align="right">Azioni</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSortedEvents.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} align="center" sx={{ py: 4, opacity: 0.7 }}>
                                                        Nessun evento con i filtri attuali.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {evPageRows.map((ev) => {
                                                const past = isPast(ev);
                                                const status = ev.status || "published";
                                                return (
                                                    <TableRow key={ev.id} hover sx={past ? { opacity: 0.55 } : {}}>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                {!past ? (
                                                                    <CheckCircleIcon fontSize="small" color="success" />
                                                                ) : (
                                                                    <LockClockIcon fontSize="small" color="disabled" />
                                                                )}
                                                                <span>{ev.name}</span>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>{ev.dj || "—"}</TableCell>
                                                        <TableCell>{ev.place || "—"}</TableCell>
                                                        <TableCell>{ev.date}</TableCell>
                                                        <TableCell>{ev.time}</TableCell>
                                                        <TableCell>{ev.capacity || "-"}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                size="small"
                                                                label={status}
                                                                color={
                                                                    status === "draft"
                                                                        ? "default"
                                                                        : status === "archived"
                                                                            ? "warning"
                                                                            : "success"
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch
                                                                checked={!!ev.soldOut}
                                                                onChange={(e) => handleToggleSoldOut(ev.id, e.target.checked)}
                                                                color="warning"
                                                                disabled={past}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title="Duplica">
                                                                    <IconButton size="small" onClick={() => handleDuplicate(ev)}>
                                                                        <ContentCopyIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title=".ics">
                                                                    <IconButton size="small" onClick={() => exportICS(ev)}>
                                                                        <CalendarMonthIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title={past ? "Evento passato" : "Modifica"}>
                                  <span>
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEdit(ev)}
                                        disabled={past || !canEditEvent(role)}
                                    >
                                      Modifica
                                    </Button>
                                  </span>
                                                                </Tooltip>
                                                                <Tooltip title={past ? "Evento passato" : "Elimina"}>
                                  <span>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                            setConfirm({ open: true, id: ev.id, type: "event" })
                                        }
                                        disabled={past || !canDeleteEvent(role)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <TablePagination
                                        component="div"
                                        count={filteredSortedEvents.length}
                                        page={evPage}
                                        onPageChange={(_, p) => setEvPage(p)}
                                        rowsPerPage={evRowsPerPage}
                                        onRowsPerPageChange={(e) => {
                                            setEvRowsPerPage(parseInt(e.target.value, 10));
                                            setEvPage(0);
                                        }}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                    />
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* CREA / MODIFICA EVENTO */}
                    {section === "create" && canEditEvent(role) && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 1200, mx: "auto" }}>
                            <Typography
                                variant="h5"
                                sx={{ textAlign: { xs: "center", md: "left" }, mb: 2, letterSpacing: 0.3 }}
                            >
                                {editingId ? "Modifica evento" : "Crea nuovo evento"}
                            </Typography>

                            {/* Copertina */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    mb: 3,
                                    borderRadius: 2,
                                    borderColor: "rgba(255,255,255,0.1)",
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
                                    alignItems: "center",
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: { xs: "100%", sm: 320 },
                                        height: { xs: 180, sm: 180 },
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        bgcolor: "#0f0f12",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        position: "relative",
                                    }}
                                >
                                    <img
                                        src={formData.image || heroImg}
                                        alt="Anteprima evento"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{
                                            position: "absolute",
                                            right: 8,
                                            bottom: 8,
                                            bgcolor: "rgba(0,0,0,0.45)",
                                            p: 0.5,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Tooltip title="Scegli da Drive">
                                            <IconButton
                                                onClick={() => setDriveDialogOpen(true)}
                                                aria-label="Scegli da Drive"
                                                size="small"
                                                sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}
                                            >
                                                <AddToDriveIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Carica da dispositivo">
                                            <IconButton
                                                onClick={onPickFromDevice}
                                                aria-label="Carica da dispositivo"
                                                size="small"
                                                sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}
                                            >
                                                <CloudUploadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {formData.image && (
                                            <Tooltip title="Rimuovi immagine">
                                                <IconButton
                                                    onClick={() => setFormData((f) => ({ ...f, image: "" }))}
                                                    aria-label="Rimuovi immagine"
                                                    size="small"
                                                    sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={onDeviceFileChange}
                                    />
                                </Box>

                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Copertina 16:9. Consigliato WEBP &lt; 1MB.
                                </Typography>
                            </Paper>

                            {/* GRID: sinistra dettagli/descrizione — destra colonne affiancate */}
                            <Box component="form" onSubmit={handleSubmit} ref={formRef} noValidate>
                                <Grid container spacing={2}>
                                    {/* SINISTRA */}
                                    <Grid item xs={12} md={7}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                Dettagli
                                            </Typography>
                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        name="name"
                                                        label="Nome evento *"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        required
                                                        error={!!errors.name}
                                                        helperText={errors.name || "Esempio: Friday Groove @ Rooftop"}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <ImageIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        name="dj"
                                                        label="DJ / Line-up"
                                                        value={formData.dj}
                                                        onChange={handleChange}
                                                        placeholder="DJ Name, Guest, Resident…"
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">🎧</InputAdornment>,
                                                        }}
                                                    />
                                                </Grid>
                                                {/* PREZZO */}
                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        name="price"
                                                        label="Prezzo (€)"
                                                        type="number"
                                                        value={formData.price}                // ← NON svuotiamo più se soldOut
                                                        onChange={handleChange}
                                                        disabled={formData.soldOut}           // ← visibile ma non editabile
                                                        inputProps={{ step: "0.5", min: "0" }}
                                                        error={!!errors.price}
                                                        helperText={errors.price || (formData.soldOut ? "Sold out: il prezzo resta visibile" : "")}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <EuroIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                            readOnly: formData.soldOut || undefined, // evita il tastierino in mobile se disabilitato
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        name="capacity"
                                                        label="Capienza"
                                                        type="number"
                                                        value={formData.capacity}
                                                        onChange={handleChange}
                                                        inputProps={{ min: "0", step: "1" }}
                                                        error={!!errors.capacity}
                                                        helperText={errors.capacity}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            name="status"
                                                            value={formData.status}
                                                            onChange={(e) =>
                                                                setFormData((f) => ({ ...f, status: e.target.value }))
                                                            }
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="draft">Bozza</MenuItem>
                                                            <MenuItem value="published">Pubblicato</MenuItem>
                                                            <MenuItem value="archived">Archiviato</MenuItem>
                                                        </Select>
                                                        <FormHelperText>Status evento</FormHelperText>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                Descrizione (pubblica)
                                            </Typography>
                                            <TextField
                                                name="description"
                                                label="Dettagli, line-up, note"
                                                value={formData.description}
                                                onChange={handleChange}
                                                multiline
                                                minRows={6}
                                                placeholder="Line-up, dress code, guestlist, promozioni…"
                                            />
                                        </Paper>

                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                Note interne (non pubbliche) & Guest list
                                            </Typography>
                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        name="internalNotes"
                                                        label="Note interne"
                                                        value={formData.internalNotes}
                                                        onChange={handleChange}
                                                        multiline
                                                        minRows={4}
                                                        placeholder="Es. briefing staff, orari, contatti…"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        name="guestList"
                                                        label="Guest list"
                                                        value={formData.guestList}
                                                        onChange={handleChange}
                                                        multiline
                                                        minRows={4}
                                                        placeholder="Un nominativo per riga, o CSV 'Nome,Cognome,+#'…"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>

                                    {/* DESTRA — 3 card affiancate in desktop, full width in mobile */}
                                    <Grid item xs={12} md={5}>
                                        <Grid container spacing={2} alignItems="stretch">
                                            {/* Programmazione */}
                                            <Grid item xs={12} md={4}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                        Programmazione
                                                    </Typography>
                                                    <Grid container spacing={1.5}>
                                                        <Grid item xs={12}>
                                                            {/* DATA */}
                                                            <TextField
                                                                type="date"
                                                                name="date"
                                                                label="Data *"
                                                                inputRef={dateInputRef}
                                                                InputLabelProps={{ shrink: true }}
                                                                inputProps={{ min: todayISO() }}
                                                                value={formData.date}
                                                                onChange={handleChange}
                                                                required
                                                                error={!!errors.date}
                                                                helperText={errors.date}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton size="small" onClick={() => dateInputRef.current?.showPicker?.()}>
                                                                                <CalendarTodayIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                sx={{
                                                                    "& input::-webkit-calendar-picker-indicator": { opacity: 0, display: "none" }, // nasconde l’icona nera di default
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            {/* ORARIO */}
                                                            <TextField
                                                                type="time"
                                                                name="time"
                                                                label="Orario *"
                                                                inputRef={timeInputRef}
                                                                InputLabelProps={{ shrink: true }}
                                                                value={formData.time}
                                                                onChange={handleChange}
                                                                required
                                                                error={!!errors.time}
                                                                helperText={errors.time}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton size="small" onClick={() => timeInputRef.current?.showPicker?.()}>
                                                                                <AccessTimeIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                sx={{
                                                                    "& input::-webkit-calendar-picker-indicator": { opacity: 0, display: "none" },
                                                                }}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            </Grid>

                                            {/* Luogo */}
                                            <Grid item xs={12} md={5}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                        Luogo
                                                    </Typography>

                                                    <PlaceAutocomplete
                                                        value={placeSelected}
                                                        onChange={(val) => {
                                                            setPlaceSelected(val);
                                                            setFormData((f) => ({
                                                                ...f,
                                                                place: val?.label || "",
                                                                placeId: val?.place_id || null,
                                                            }));
                                                        }}
                                                        inputValue={placeInput}
                                                        onInputChange={(v) => setPlaceInput(v)}
                                                        onCoords={(coords) => setPlaceCoords(coords)}
                                                        error={!!errors.place}
                                                        helperText={errors.place}
                                                    />

                                                    {placeCoords && (
                                                        <Box
                                                            sx={{
                                                                mt: 1.5,
                                                                borderRadius: 1,
                                                                overflow: "hidden",
                                                                border: "1px solid rgba(255,255,255,0.08)",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 0.5,
                                                                    p: 0.5,
                                                                    opacity: 0.8,
                                                                }}
                                                            >
                                                                <MapIcon fontSize="small" />{" "}
                                                                <Typography variant="caption">
                                                                    Anteprima posizione (OpenStreetMap)
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ position: "relative", pt: "56.25%" }}>
                                                                {(() => {
                                                                    const lat = placeCoords.lat,
                                                                        lon = placeCoords.lon;
                                                                    const delta = 0.01; // zoom livello ~15
                                                                    const bbox = `${lon - delta},${lat - delta},${lon + delta},${
                                                                        lat + delta
                                                                    }`;
                                                                    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
                                                                    return (
                                                                        <iframe
                                                                            title="map-preview"
                                                                            src={src}
                                                                            style={{
                                                                                position: "absolute",
                                                                                inset: 0,
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                border: 0,
                                                                            }}
                                                                            loading="lazy"
                                                                            referrerPolicy="no-referrer-when-downgrade"
                                                                        />
                                                                    );
                                                                })()}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </Grid>

                                            {/* Stato vendita */}
                                            <Grid item xs={12} md={3}>
                                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                        Stato vendita
                                                    </Typography>
                                                    <Stack spacing={1.5}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Typography variant="body2">Sold out</Typography>
                                                            <Switch
                                                                checked={formData.soldOut}
                                                                onChange={(_, checked) =>
                                                                    setFormData((f) => ({ ...f, soldOut: checked }))
                                                                }
                                                                color="warning"
                                                            />
                                                        </Stack>
                                                        <FormHelperText>
                                                            Se attivo, il campo prezzo viene disabilitato.
                                                        </FormHelperText>
                                                    </Stack>
                                                </Paper>
                                            </Grid>

                                            {/* Azioni desktop */}
                                            <Grid item xs={12} sx={{ display: { xs: "none", md: "block" } }}>
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button variant="contained" type="submit" disabled={!isValid}>
                                                        {editingId ? "Salva modifiche" : "Crea evento"}
                                                    </Button>
                                                    <Button
                                                        variant="text"
                                                        onClick={() => {
                                                            resetForm();
                                                            setSection("events");
                                                        }}
                                                    >
                                                        Annulla
                                                    </Button>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Action bar mobile sticky */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: "sticky",
                                        bottom: 0,
                                        mt: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        display: { xs: "flex", md: "none" },
                                        gap: 1,
                                        backdropFilter: "blur(8px)",
                                        bgcolor: "rgba(20,20,22,0.7)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <Button fullWidth variant="contained" type="submit" disabled={!isValid}>
                                        {editingId ? "Salva" : "Crea evento"}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        onClick={() => {
                                            resetForm();
                                            setSection("events");
                                        }}
                                    >
                                        Annulla
                                    </Button>
                                </Paper>
                            </Box>
                        </Paper>
                    )}

                    {/* PRENOTAZIONI */}
                    {section === "bookings" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2 }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.5}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2 }}
                            >
                                <TextField
                                    size="small"
                                    placeholder="Cerca per nome / email / telefono"
                                    value={bkQuery}
                                    inputRef={bkSearchRef}
                                    onChange={(e) => setBkQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    fullWidth={isMobile}
                                    sx={{ minWidth: 260 }}
                                />
                                <Stack   direction="row"
                                         spacing={1}
                                         alignItems="center"
                                         flexWrap="wrap"
                                         sx={{ rowGap: 1, "& > *": { mt: { xs: 1, md: 0 } } }}>
                                    <Button variant="outlined" startIcon={<IosShareIcon />} onClick={exportBookingsCsv}>
                                        Esporta CSV
                                    </Button>

                                    {/* Filtro per evento */}
                                    <FormControl size="small" sx={{ minWidth: 220 }}>
                                        <Select
                                            value={bkEventFilter}
                                            onChange={(e) => setBkEventFilter(e.target.value)}
                                            displayEmpty
                                            sx={{
                                                "& .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "rgba(255,255,255,0.18)",
                                                },
                                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "primary.main",
                                                },
                                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "primary.main",
                                                },
                                                "& .MuiSelect-icon": { color: "primary.main" },
                                            }}
                                        >
                                            <MenuItem value="all">Tutti gli eventi</MenuItem>
                                            {events.map((ev) => (
                                                <MenuItem key={ev.id} value={ev.id}>
                                                    {ev.name} — {ev.date}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <SortIcon fontSize="small" sx={{ opacity: 0.7 }} />

                                    <FormControl size="small">
                                        <Select
                                            value={`${bkSort.key}-${bkSort.dir}`}
                                            onChange={(e) => {
                                                const [key, dir] = e.target.value.split("-");
                                                setBkSort({ key, dir });
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "rgba(255,255,255,0.18)",
                                                },
                                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "primary.main",
                                                },
                                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "primary.main",
                                                },
                                                "& .MuiSelect-icon": { color: "primary.main" },
                                            }}
                                        >
                                            <MenuItem value="created-desc">Più recenti</MenuItem>
                                            <MenuItem value="created-asc">Meno recenti</MenuItem>
                                            <MenuItem value="name-asc">Nome A→Z</MenuItem>
                                            <MenuItem value="name-desc">Nome Z→A</MenuItem>
                                            <MenuItem value="tickets-desc">Biglietti ↓</MenuItem>
                                            <MenuItem value="tickets-asc">Biglietti ↑</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        color="error"
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                            setConfirm({
                                                open: true,
                                                id: null,
                                                type: "booking-all",
                                                filterEventId: bkEventFilter !== "all" ? bkEventFilter : null,
                                            })
                                        }
                                    >
                                        Elimina {bkEventFilter !== "all" ? "tutte (evento filtrato)" : "tutte le prenotazioni"}
                                    </Button>
                                </Stack>
                            </Stack>

                            {isMobile ? (
                                <Box sx={{ overflowX: "hidden" }}>
                                    {filteredSortedBookings.slice(0, bkMobileVis).map((b) => (
                                        <MobileBookingCard key={b.id} b={b} />
                                    ))}
                                    <Box ref={bkSentinelRef} sx={{ height: 1 }} />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Nome</TableCell>
                                                <TableCell>Cognome</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Telefono</TableCell>
                                                <TableCell>Biglietti</TableCell>
                                                <TableCell align="right">Azioni</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSortedEvents.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} align="center" sx={{ py: 4, opacity: 0.7 }}>
                                                        Nessuna prenotazione presente.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {bkPageRows.map((b) => (
                                                <TableRow key={b.id} hover>
                                                    <TableCell>{b.nome}</TableCell>
                                                    <TableCell>{b.cognome}</TableCell>
                                                    <TableCell>{b.email}</TableCell>
                                                    <TableCell>{b.telefono}</TableCell>
                                                    <TableCell>{b.quantity || 1}</TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Button
                                                                size="small"
                                                                startIcon={<EditIcon />}
                                                                onClick={() => openBookingEdit(b)}
                                                            >
                                                                Modifica
                                                            </Button>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    setConfirm({ open: true, id: b.id, type: "booking" })
                                                                }
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <TablePagination
                                        component="div"
                                        count={filteredSortedBookings.length}
                                        page={bkPage}
                                        onPageChange={(_, p) => setBkPage(p)}
                                        rowsPerPage={bkRowsPerPage}
                                        onRowsPerPageChange={(e) => {
                                            setBkRowsPerPage(parseInt(e.target.value, 10));
                                            setBkPage(0);
                                        }}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                    />
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* CHECK-IN */}
                    {section === "checkin" && (
                        <Paper
                            sx={{
                                ...glass,
                                p: { xs: 2, md: 3 },           // 16px mobile, 24px desktop
                                mb: { xs: 2, md: 4 },
                                borderRadius: 2,
                                maxWidth: 900,
                                mx: "auto",
                            }}
                        >

                        <Typography variant="h5" sx={{ mb: 2 }}>
                                Check-in
                            </Typography>
                            <CheckInBox events={events} />
                        </Paper>
                    )}

                    {/* GALLERY */}
                    {section === "gallery" && (
                        <Paper
                            sx={{
                                ...glass,
                                p: 3,
                                mb: 4,
                                borderRadius: 2,
                                maxWidth: 520,
                                mx: "auto",
                                textAlign: "center",
                            }}
                        >
                            <Typography variant="h5" gutterBottom>
                                Gallery
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                                Le immagini della Home sono lette direttamente dalla cartella Drive pubblica.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddToDriveIcon />}
                                onClick={() => openExternal(driveFolderLink)}
                                sx={{ color: "primary.main", borderColor: "primary.main" }}
                                disabled={!driveFolderLink}
                            >
                                Apri cartella Drive
                            </Button>
                            <Button
                                variant="text"
                                startIcon={<ContentCopyIcon />}
                                onClick={async () => {
                                    if (!driveFolderLink) return;
                                    try {
                                        await navigator.clipboard.writeText(driveFolderLink);
                                    } catch {}
                                }}
                                sx={{ color: "primary.main", ml: 1 }}
                                disabled={!driveFolderLink}
                            >
                                Copia link
                            </Button>
                        </Paper>
                    )}
                </Box>
            </Box>

            {/* Conferma */}
            <ConfirmDialog
                open={confirm.open}
                title="Conferma"
                message="Eliminare definitivamente?"
                onConfirm={async () => {
                    const { type, id, filterStatus, filterEventId } = confirm;
                    setConfirm({ open: false, id: null, type: "" });

                    try {
                        switch (type) {
                            case "event": {
                                await deleteEvent(id);
                                await refetchEvents();
                                showToast("Evento eliminato", "success");
                                break;
                            }
                            case "booking": {
                                await deleteBooking(id);
                                await refetchBookings();
                                showToast("Prenotazione eliminata", "success");
                                break;
                            }
                            case "event-all": {
                                const ids = events
                                    .filter((ev) =>
                                        filterStatus ? (ev.status || "published") === filterStatus : true
                                    )
                                    .map((ev) => ev.id);
                                await Promise.all(ids.map(deleteEvent));
                                await refetchEvents();
                                showToast("Eventi eliminati", "success");
                                break;
                            }
                            case "booking-all": {
                                const ids = bookings
                                    .filter((b) => (filterEventId ? b.eventId === filterEventId : true))
                                    .map((b) => b.id);
                                await Promise.all(ids.map(deleteBooking));
                                await refetchBookings();
                                showToast("Prenotazioni eliminati", "success");
                                break;
                            }
                            default:
                                break;
                        }
                    } catch (e) {
                        showToast("Errore", "error");
                    }
                }}
                onClose={() => setConfirm({ open: false, id: null, type: "" })}
            />

            {/* Dialog Drive */}
            <DriveImagePickerDialog
                open={driveDialogOpen}
                onClose={() => setDriveDialogOpen(false)}
                onPick={(src) => setFormData((f) => ({ ...f, image: src }))}
            />

            <Dialog open={!!bkEdit} onClose={closeBookingEdit} fullWidth maxWidth="sm">
                <DialogTitle>Modifica prenotazione</DialogTitle>
                <DialogContent dividers sx={{ display: "grid", gap: 1.2, pt: 2 }}>
                    <TextField
                        label="Nome"
                        value={bkEdit?.nome || ""}
                        onChange={(e) => setBkEdit((s) => ({ ...s, nome: e.target.value }))}
                    />
                    <TextField
                        label="Cognome"
                        value={bkEdit?.cognome || ""}
                        onChange={(e) => setBkEdit((s) => ({ ...s, cognome: e.target.value }))}
                    />
                    <TextField
                        label="Email"
                        value={bkEdit?.email || ""}
                        onChange={(e) => setBkEdit((s) => ({ ...s, email: e.target.value }))}
                    />
                    <TextField
                        label="Telefono"
                        value={bkEdit?.telefono || ""}
                        onChange={(e) => setBkEdit((s) => ({ ...s, telefono: e.target.value }))}
                    />
                    <TextField
                        label="Biglietti"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={bkEdit?.quantity || 1}
                        onChange={(e) => setBkEdit((s) => ({ ...s, quantity: e.target.value }))}
                    />
                    <FormHelperText>
                        Attenzione: cambiare quantità impatta i contatori e il sold out.
                    </FormHelperText>
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                        <Button onClick={closeBookingEdit}>Annulla</Button>
                        <Button variant="contained" onClick={saveBookingEdit}>
                            Salva
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
};


/* =======================
   Check-in component
   ======================= */
function CheckInBox({ events = [] }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const trackRef = useRef(null);
    const wakeLockRef = useRef(null);

    const [support, setSupport] = useState({ camera: false, detector: false });
    const [scanning, setScanning] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [lastScan, setLastScan] = useState("");
    const [result, setResult] = useState(null); // { valid, reason, token, ... }
    const [onlyToday, setOnlyToday] = useState(true);
    const [opOpen, setOpOpen] = useState(false); // modal operatore
    const [manual, setManual] = useState("");

    const { showToast } = useToast();

    const todayISO = new Date().toISOString().slice(0,10);
    const eventById = useCallback((id) => events.find((e) => e.id === id), [events]);

    // Audio
    const audioCtxRef = useRef(null);
    const [soundOn, setSoundOn] = useState(() => localStorage.getItem("checkinSound") !== "off");

    // dentro CheckInBox, in alto tra gli hook:
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));


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
        setSupport({
            camera: !!navigator.mediaDevices?.getUserMedia,
            detector: "BarcodeDetector" in window,
        });
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

    const doVerify = async (text, opts = { autoCheckIn: true }) => {
        const token = extractToken(text);
        if (!token) { showToast("QR/Link non valido: nessun token trovato", "error"); return; }
        setLastScan(text);
        setVerifying(true);
        try {
            const data = await verifyBooking(token);
            const ev = eventById(data.eventId);
            const isToday = ev?.date === todayISO;
            const payload = { ...data, token, isToday };
            setResult(payload);

            setOpOpen(true); // apri modal operatore

            if (!data.valid) { showToast("Token non valido", "error"); return; }
            if (onlyToday && !isToday) { showToast("Evento non è oggi — verifica manuale", "warning"); return; }

            // ✅ AUTO CHECK-IN: +1 alla scansione
            if (opts.autoCheckIn && data.remaining > 0) {
                await doCheckIn(token, data.remaining, { silent: true });
            } else if (data.remaining <= 0) {
                showToast("Prenotazione già esaurita", "error");
                playWarn();
            }
        } catch {
            setResult({ valid: false, reason: "network_error" });
            showToast("Errore di verifica", "error");
        } finally {
            setVerifying(false);
        }
    };

    const stopScan = () => {
        setScanning(false);
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
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            trackRef.current = stream.getVideoTracks()[0];

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

            const loop = async () => {
                if (!videoRef.current || !scanning) return;
                try {
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
            loop();
        } catch {
            setScanning(false);
            showToast("Impossibile accedere alla fotocamera", "error");
            releaseWakeLock();
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
            if (code === "already_fully_checked_in") showToast("Prenotazione già esaurita", "error");
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
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                                <Button
                                    startIcon={<QrCodeScannerIcon />}
                                    variant="contained"
                                    onClick={startScan}
                                    disabled={!support.camera || scanning}
                                    sx={{ width: { xs: "100%", md: "auto" } }}
                                >
                                    Avvia scansione
                                </Button>

                                <Button
                                    variant="outlined"
                                    component="label"
                                    sx={{ width: { xs: "100%", md: "auto" } }}
                                >
                                    Carica immagine
                                    <input
                                        hidden
                                        accept="image/*"
                                        type="file"
                                        onChange={(e) => onPickImage(e.target.files?.[0])}
                                    />
                                </Button>
                            </Stack>


                            {/* riga 2 su mobile: Stop + volume */}
                            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
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
                                {statusKind === "ok"   && "ACCESSO CONSENTITO (auto +1)"}
                                {statusKind === "done" && "GIÀ UTILIZZATO (0 rimanenti)"}
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
                                        <InfoRow label="Data evento" value={ev?.date || "—"} />
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
                                            const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
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
                                {statusKind === "ok"   && "VALIDO"}
                                {statusKind === "done" && "COMPLETO"}
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



// Piccola riga info con bottone copia
// ⬇️ SOSTITUISCI TUTTA InfoRow con questa
function InfoRow({ label, value, copy = false }) {
    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.6, minWidth: 0 }}
        >
            <Typography
                sx={{
                    flex: { xs: "0 0 96px", sm: "0 0 120px" },
                    width: { xs: 96, sm: 120 },
                    opacity: 0.75,
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    fontWeight: 600,
                    overflowWrap: "anywhere",   // <-- niente scroll orizzontale
                    wordBreak: "break-word",
                }}
            >
                {value}
            </Typography>

            {copy && (
                <IconButton
                    size="small"
                    onClick={async () => {
                        try { await navigator.clipboard.writeText(String(value || "")); } catch {}
                    }}
                    sx={{ flex: "0 0 auto", ml: 0.5, opacity: 0.8 }}
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            )}
        </Stack>
    );
}



export default AdminPanel;
