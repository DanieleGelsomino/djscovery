// src/components/AdminPanel.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchBookings,
    createEvent,
    fetchEvents,
    updateEvent,
    deleteEvent,
    setAuthToken,
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
import LaunchIcon from "@mui/icons-material/Launch";
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

import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

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

/* =========================================
   GOOGLE PLACES (richiesto) — nessun fallback
   ========================================= */
const loadGooglePlaces = (() => {
    let p;
    return () => {
        if (p) return p;
        const key =
            (import.meta?.env && import.meta.env.VITE_GOOGLE_API_KEY) ||
            (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY);
        if (!key) return Promise.reject(new Error("VITE_GOOGLE_API_KEY mancante"));
        p = new Promise((resolve, reject) => {
            if (window.google?.maps?.places) return resolve(window.google.maps);
            const s = document.createElement("script");
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
                key
            )}&libraries=places&language=it&region=IT`;
            s.async = true;
            s.onerror = () => reject(new Error("Impossibile caricare Google Maps JS"));
            s.onload = () => resolve(window.google.maps);
            document.head.appendChild(s);
        });
        return p;
    };
})();

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

    const serviceRef = useRef(null);
    const detailsRef = useRef(null);
    const sessionRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const maps = await loadGooglePlaces();
                if (!alive) return;
                serviceRef.current = new maps.places.AutocompleteService();
                detailsRef.current = new maps.places.PlacesService(document.createElement("div"));
                sessionRef.current = new maps.places.AutocompleteSessionToken();
            } catch (e) {
                setInitError(e?.message || "Errore inizializzazione Google Places");
            }
        })();
        return () => {
            alive = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Predizioni con debounce
    useEffect(() => {
        const q = (inputValue || "").trim();
        if (!serviceRef.current) return;
        if (!q) {
            setPreds([]);
            return;
        }
        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            serviceRef.current.getPlacePredictions(
                {
                    input: q,
                    sessionToken: sessionRef.current,
                },
                (res, status) => {
                    setLoading(false);
                    if (!res || status !== "OK") {
                        setPreds([]);
                        return;
                    }
                    setPreds(
                        res.map((p) => ({
                            label: p.description,
                            place_id: p.place_id,
                            main_text: p.structured_formatting?.main_text,
                            secondary_text: p.structured_formatting?.secondary_text,
                        }))
                    );
                }
            );
        }, 220);
    }, [inputValue]);

    const selectOption = (evt, opt) => {
        if (!opt) {
            onChange(null);
            onCoords?.(null);
            return;
        }
        if (!detailsRef.current || !opt.place_id) {
            onChange({ label: opt.label });
            onCoords?.(null);
            return;
        }
        detailsRef.current.getDetails(
            { placeId: opt.place_id, fields: ["formatted_address", "geometry"] },
            (place, status) => {
                if (!place || status !== "OK") {
                    onChange({ label: opt.label, place_id: opt.place_id });
                    onCoords?.(null);
                    return;
                }
                const loc = place.geometry?.location;
                const coords = loc ? { lat: loc.lat?.(), lon: loc.lng?.() } : null;
                onChange({
                    label: place.formatted_address || opt.label,
                    place_id: opt.place_id,
                    verified: true,
                    ...coords,
                });
                onCoords?.(coords);
                try {
                    sessionRef.current = new window.google.maps.places.AutocompleteSessionToken();
                } catch {}
            }
        );
    };

    return (
        <MUIAutocomplete
            options={preds}
            value={value}
            onChange={selectOption}
            inputValue={inputValue}
            onInputChange={(e, v) => onInputChange(v)}
            getOptionLabel={(o) => o?.label || ""}
            noOptionsText={initError ? "Google Places non configurato" : "Nessun risultato"}
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
                        helperText={initError || helperText || "Suggerimenti da Google"}
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
   Dialog selezione copertina da Drive — griglia responsive
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

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const filtered = useMemo(() => {
        const t = filter.trim().toLowerCase();
        return t ? items.filter((i) => (i.name || "").toLowerCase().includes(t)) : items;
    }, [filter, items]);

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
                        {filtered.map((img) => {
                            const thumb = driveCdnSrc(img.id, 640);
                            const fallback = driveApiSrc(img.id, apiKey);
                            return (
                                <Box
                                    key={img.id}
                                    role="button"
                                    onClick={() => {
                                        onPick(driveCdnSrc(img.id, 1600));
                                        onClose();
                                    }}
                                    sx={{
                                        position: "relative",
                                        width: "100%",
                                        pt: "66.666%",
                                        overflow: "hidden",
                                        borderRadius: 1,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        cursor: "pointer",
                                        "&:hover": { outline: "2px solid", outlineColor: "primary.main" },
                                    }}
                                >
                                    <img
                                        src={thumb}
                                        alt={img.name}
                                        onError={(e) => (e.currentTarget.src = fallback)}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            background: "#111",
                                        }}
                                    />
                                </Box>
                            );
                        })}
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
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [section, setSection] = useState("events");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null, type: "" });

    const [bookings, setBookings] = useState([]);
    const [events, setEvents] = useState([]);

    // rbac
    const role = (localStorage.getItem("role") || "admin").toLowerCase();

    // refs per scorciatoie
    const evSearchRef = useRef(null);
    const bkSearchRef = useRef(null);
    const formRef = useRef(null);

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
        status: "published",          // draft | published | archived
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

    // bootstrap guard + fetch
    useEffect(() => {
        const t = localStorage.getItem("adminToken");
        if (t) setAuthToken(t);
        if (localStorage.getItem("isAdmin") !== "true") {
            navigate("/admin");
            return;
        }
        (async () => {
            try {
                const [b, e] = await Promise.all([fetchBookings(), fetchEvents()]);
                setBookings(b || []);
                setEvents(e || []);
            } catch (err) {
                if (err?.response?.status === 401) {
                    setAuthToken(null);
                    localStorage.removeItem("isAdmin");
                    navigate("/admin");
                }
            }
        })();
    }, [navigate]);

    // scorciatoie
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "N" || e.key === "n") {
                if (canEditEvent(role)) {
                    e.preventDefault();
                    resetForm();
                    setSection("create");
                }
            }
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
                const w = img.width, h = img.height;
                const targetRatio = 16 / 9;
                let sx = 0, sy = 0, sw = w, sh = h;
                if (w / h > targetRatio) {
                    // troppo larga, crop orizzontale
                    sw = h * targetRatio; sx = (w - sw) / 2;
                } else {
                    // troppo alta, crop verticale
                    sh = w / targetRatio; sy = (h - sh) / 2;
                }
                const canvas = document.createElement("canvas");
                canvas.width = 1600; canvas.height = 900;
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
        if (formData.capacity !== "" && (!Number.isInteger(Number(formData.capacity)) || Number(formData.capacity) < 0))
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
            const eList = await fetchEvents();
            setEvents(eList || []);
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
            setEvents((prev) => prev.filter((ev) => ev.id !== id));
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
        await updateEvent(id, { soldOut: value, updatedAt: new Date().toISOString(), updatedBy: auth?.currentUser?.email || "admin" });
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
        const ics =
            [
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
                // prova mapping by eventId se disponibile
                try {
                    sold = bookings.filter((b) => b.eventId === ev.id).reduce((n, b) => n + (b.quantity || 1), 0);
                } catch {}
            }
            const shouldBeSoldOut = capacity > 0 && sold >= capacity;
            if (shouldBeSoldOut && !ev.soldOut) {
                updates.push(updateEvent(ev.id, { soldOut: true }));
            }
        }
        if (updates.length) {
            await Promise.all(updates);
            const eList = await fetchEvents();
            setEvents(eList || []);
            showToast("Aggiornato stato Sold Out automaticamente", "info");
        }
    }, [events, bookings, showToast]);

    useEffect(() => { recomputeAutoSoldOut(); }, [recomputeAutoSoldOut]);

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
        if (statusFilter !== "all") list = list.filter((e) => (e.status || "published") === statusFilter);
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
                va = (a.name || "").toLowerCase(); vb = (b.name || "").toLowerCase();
            } else {
                va = (a.place || "").toLowerCase(); vb = (b.place || "").toLowerCase();
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
        if (q) {
            list = list.filter((b) =>
                [b.nome, b.cognome, b.email, b.telefono].filter(Boolean).some((s) => (s + "").toLowerCase().includes(q))
            );
        }
        const cmp = (a, b) => {
            let va, vb;
            if (bkSort.key === "created") {
                va = tsToDate(a.createdAt || a.created)?.getTime() ?? 0;
                vb = tsToDate(b.createdAt || b.created)?.getTime() ?? 0;
            }
            else if (bkSort.key === "name") {
                va = `${a.nome || ""} ${a.cognome || ""}`.toLowerCase();
                vb = `${b.nome || ""} ${b.cognome || ""}`.toLowerCase();
            } else {
                va = a.quantity || 1; vb = b.quantity || 1;
            }
            if (va < vb) return bkSort.dir === "asc" ? -1 : 1;
            if (va > vb) return bkSort.dir === "asc" ? 1 : -1;
            return 0;
        };
        return list.sort(cmp);
    }, [bookings, bkQuery, bkSort]);

    /* ---------- CSV Export ---------- */
    const downloadCsv = (rows, filename) => {
        const headers = Object.keys(rows[0] || {});
        const csv = [
            headers.join(","),
            ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
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
                            onClick={() => { setSection(item.key); setMobileOpen(false); }}
                            selected={section === item.key}
                            sx={{
                                borderRadius: 1,
                                "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.08)", "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } },
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
        try { await signOut(auth); } catch {}
        setAuthToken(null);
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminToken");
        navigate("/admin");
    };

    /* ---------- isValid per azioni sticky ---------- */
    const isValid = useMemo(() => Boolean(formData.name && formData.date && formData.time), [formData]);

    return (
        <MuiThemeProvider theme={muiTheme}>
            <Box sx={{ display: "flex" }}>
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
                                    <IconButton color="inherit" onClick={() => setMobileOpen(true)} aria-label="Apri menu">
                                        <MenuIcon />
                                    </IconButton>
                                )}
                                <Typography variant="h6" noWrap>Admin — {section === "create" ? "Crea / Modifica Evento" : section.charAt(0).toUpperCase() + section.slice(1)}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
                                <Badge icon={<EventAvailableIcon />} label={`Futuri: ${events.filter((e) => !isPast(e)).length}`} />
                                <Badge icon={<EventBusyIcon />} label={`Passati: ${events.filter(isPast).length}`} />
                                <Badge icon={<ListAltIcon />} label={`Prenotazioni: ${bookings.length}`} />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                            {driveFolderLink && (
                                <Tooltip title="Apri cartella Drive">
                                    <IconButton component="a" href={driveFolderLink} target="_blank" rel="noopener noreferrer" color="inherit" aria-label="Drive">
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
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
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
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                                    fullWidth={isMobile}
                                    sx={{ minWidth: 260 }}
                                />
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
                                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
                                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
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
                                    <Button variant="outlined" startIcon={<IosShareIcon />} onClick={exportEventsCsv}>Esporta CSV</Button>
                                    {canEditEvent(role) && (
                                        <Button startIcon={<AddCircleOutlineIcon />} variant="contained" color="primary" onClick={() => { resetForm(); setSection("create"); }}>
                                            Nuovo evento
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>

                            {isMobile ? (
                                <Box>
                                    {filteredSortedEvents.length === 0 && (
                                        <Box sx={{ p: 3, textAlign: "center", opacity: 0.7, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 2 }}>
                                            Nessun evento con i filtri attuali.
                                        </Box>
                                    )}
                                    {filteredSortedEvents.map((ev) => (
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
                                            {filteredSortedEvents.map((ev) => {
                                                const past = isPast(ev);
                                                const status = ev.status || "published";
                                                return (
                                                    <TableRow key={ev.id} hover sx={past ? { opacity: 0.55 } : {}}>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                {!past ? <CheckCircleIcon fontSize="small" color="success" /> : <LockClockIcon fontSize="small" color="disabled" />}
                                                                <span>{ev.name}</span>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>{ev.dj || "—"}</TableCell>
                                                        <TableCell>{ev.place || "—"}</TableCell>
                                                        <TableCell>{ev.date}</TableCell>
                                                        <TableCell>{ev.time}</TableCell>
                                                        <TableCell>{ev.capacity || "-"}</TableCell>
                                                        <TableCell>
                                                            <Chip size="small" label={status} color={status === "draft" ? "default" : status === "archived" ? "warning" : "success"} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch checked={!!ev.soldOut} onChange={(e) => handleToggleSoldOut(ev.id, e.target.checked)} color="warning" disabled={past} />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title="Duplica"><IconButton size="small" onClick={() => handleDuplicate(ev)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title=".ics"><IconButton size="small" onClick={() => exportICS(ev)}><CalendarMonthIcon fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title={past ? "Evento passato" : "Modifica"}>
                                  <span>
                                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(ev)} disabled={past || !canEditEvent(role)}>
                                      Modifica
                                    </Button>
                                  </span>
                                                                </Tooltip>
                                                                <Tooltip title={past ? "Evento passato" : "Elimina"}>
                                  <span>
                                    <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, id: ev.id, type: "event" })} disabled={past || !canDeleteEvent(role)}>
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
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* CREA / MODIFICA EVENTO */}
                    {section === "create" && canEditEvent(role) && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 1200, mx: "auto" }}>
                            <Typography variant="h5" sx={{ textAlign: { xs: "center", md: "left" }, mb: 2, letterSpacing: 0.3 }}>
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
                                            //backdropFilter: "blur(6px)",
                                        }}
                                    >
                                        <Tooltip title="Scegli da Drive">
                                            <IconButton onClick={() => setDriveDialogOpen(true)} aria-label="Scegli da Drive" size="small" sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}>
                                                <AddToDriveIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Carica da dispositivo">
                                            <IconButton onClick={onPickFromDevice} aria-label="Carica da dispositivo" size="small" sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}>
                                                <CloudUploadIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {formData.image && (
                                            <Tooltip title="Rimuovi immagine">
                                                <IconButton onClick={() => setFormData((f) => ({ ...f, image: "" }))} aria-label="Rimuovi immagine" size="small" sx={{ color: "primary.main", border: "1px solid rgba(255,255,255,0.14)" }}>
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onDeviceFileChange} />
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
                                                        InputProps={{ startAdornment: <InputAdornment position="start"><ImageIcon fontSize="small" /></InputAdornment> }}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        name="dj"
                                                        label="DJ / Line-up"
                                                        value={formData.dj}
                                                        onChange={handleChange}
                                                        placeholder="DJ Name, Guest, Resident…"
                                                        InputProps={{ startAdornment: <InputAdornment position="start">🎧</InputAdornment> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        name="price"
                                                        label="Prezzo (€)"
                                                        type="number"
                                                        value={formData.soldOut ? "" : formData.price}
                                                        onChange={handleChange}
                                                        disabled={formData.soldOut}
                                                        inputProps={{ step: "0.5", min: "0" }}
                                                        error={!!errors.price}
                                                        helperText={errors.price || (formData.soldOut ? "Non richiesto se sold out" : "")}
                                                        InputProps={{ startAdornment: <InputAdornment position="start"><EuroIcon fontSize="small" /></InputAdornment> }}
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
                                                            onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
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
                                                        multiline minRows={4}
                                                        placeholder="Es. briefing staff, orari, contatti…"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        name="guestList"
                                                        label="Guest list"
                                                        value={formData.guestList}
                                                        onChange={handleChange}
                                                        multiline minRows={4}
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
                                                            <TextField
                                                                type="date"
                                                                name="date"
                                                                label="Data *"
                                                                InputLabelProps={{ shrink: true }}
                                                                inputProps={{ min: todayISO() }}
                                                                value={formData.date}
                                                                onChange={handleChange}
                                                                required
                                                                error={!!errors.date}
                                                                helperText={errors.date}
                                                                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" /></InputAdornment> }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <TextField
                                                                type="time"
                                                                name="time"
                                                                label="Orario *"
                                                                InputLabelProps={{ shrink: true }}
                                                                value={formData.time}
                                                                onChange={handleChange}
                                                                required
                                                                error={!!errors.time}
                                                                helperText={errors.time}
                                                                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" /></InputAdornment> }}
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
                                                            setFormData((f) => ({ ...f, place: val?.label || "", placeId: val?.place_id || null }));
                                                        }}
                                                        inputValue={placeInput}
                                                        onInputChange={(v) => setPlaceInput(v)}
                                                        onCoords={(coords) => setPlaceCoords(coords)}
                                                        error={!!errors.place}
                                                        helperText={errors.place}
                                                    />

                                                    {placeCoords && (
                                                        <Box sx={{ mt: 1.5, borderRadius: 1, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0.5, opacity: 0.8 }}>
                                                                <MapIcon fontSize="small" /> <Typography variant="caption">Anteprima posizione (Google)</Typography>
                                                            </Box>
                                                            <Box sx={{ position: "relative", pt: "56.25%" }}>
                                                                <iframe
                                                                    title="map-preview"
                                                                    src={`https://www.google.com/maps?q=${placeCoords.lat},${placeCoords.lon}&z=15&output=embed`}
                                                                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer-when-downgrade"
                                                                />
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
                                                            <Switch checked={formData.soldOut} onChange={(_, checked) => setFormData((f) => ({ ...f, soldOut: checked }))} color="warning" />
                                                        </Stack>
                                                        <FormHelperText>Se attivo, il campo prezzo viene disabilitato.</FormHelperText>
                                                    </Stack>
                                                </Paper>
                                            </Grid>

                                            {/* Azioni desktop */}
                                            <Grid item xs={12} sx={{ display: { xs: "none", md: "block" } }}>
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button variant="contained" type="submit" disabled={!isValid}>
                                                        {editingId ? "Salva modifiche" : "Crea evento"}
                                                    </Button>
                                                    <Button variant="text" onClick={() => { resetForm(); setSection("events"); }}>
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
                                    <Button fullWidth variant="text" onClick={() => { resetForm(); setSection("events"); }}>
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
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                                    fullWidth={isMobile}
                                    sx={{ minWidth: 260 }}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Button variant="outlined" startIcon={<IosShareIcon />} onClick={exportBookingsCsv}>Esporta CSV</Button>
                                    <SortIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                    <FormControl size="small">
                                        <Select
                                            value={`${bkSort.key}-${bkSort.dir}`}
                                            onChange={(e) => {
                                                const [key, dir] = e.target.value.split("-");
                                                setBkSort({ key, dir });
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
                                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
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
                                </Stack>
                            </Stack>

                            {isMobile ? (
                                <Box>{filteredSortedBookings.map((b) => <MobileBookingCard key={b.id} b={b} />)}</Box>
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
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSortedBookings.map((b) => (
                                                <TableRow key={b.id} hover>
                                                    <TableCell>{b.nome}</TableCell>
                                                    <TableCell>{b.cognome}</TableCell>
                                                    <TableCell>{b.email}</TableCell>
                                                    <TableCell>{b.telefono}</TableCell>
                                                    <TableCell>{b.quantity || 1}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* CHECK-IN (QR scanner nativo se disponibile) */}
                    {section === "checkin" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 900, mx: "auto" }}>
                            <Typography variant="h5" sx={{ mb: 2 }}>Check-in</Typography>
                            <CheckInBox />
                        </Paper>
                    )}

                    {/* GALLERY */}
                    {section === "gallery" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 520, mx: "auto", textAlign: "center" }}>
                            <Typography variant="h5" gutterBottom>Gallery</Typography>
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
                                    try { await navigator.clipboard.writeText(driveFolderLink); } catch {}
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
                onConfirm={() => {
                    const id = confirm.id;
                    setConfirm({ open: false, id: null, type: "" });
                    if (confirm.type === "event") handleDelete(id);
                }}
                onClose={() => setConfirm({ open: false, id: null, type: "" })}
            />

            {/* Dialog Drive */}
            <DriveImagePickerDialog
                open={driveDialogOpen}
                onClose={() => setDriveDialogOpen(false)}
                onPick={(src) => setFormData((f) => ({ ...f, image: src }))}
            />
        </MuiThemeProvider>
    );
};

/* =======================
   Check-in component
   ======================= */
function CheckInBox() {
    const videoRef = useRef(null);
    const [support, setSupport] = useState({ camera: false, detector: false });
    const [scanning, setScanning] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        setSupport({
            camera: !!navigator.mediaDevices?.getUserMedia,
            detector: "BarcodeDetector" in window,
        });
    }, []);

    const startScan = async () => {
        if (!support.camera) return;
        setScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            if (support.detector) {
                const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
                const loop = async () => {
                    if (!videoRef.current || !scanning) return;
                    try {
                        const detections = await detector.detect(videoRef.current);
                        if (detections?.length) {
                            const text = detections[0].rawValue;
                            stopScan();
                            showToast(`QR letto: ${text}`, "success");
                        }
                    } catch {}
                    requestAnimationFrame(loop);
                };
                loop();
            }
        } catch (e) {
            setScanning(false);
        }
    };

    const stopScan = () => {
        setScanning(false);
        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Box sx={{ position: "relative", width: 360, maxWidth: "100%", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <video ref={videoRef} playsInline muted style={{ width: "100%", height: "auto", display: "block", background: "#000" }} />
                </Box>
                <Stack spacing={1}>
                    <Button startIcon={<QrCodeScannerIcon />} variant="contained" onClick={startScan} disabled={!support.camera || scanning}>
                        Avvia scansione
                    </Button>
                    <Button variant="text" onClick={stopScan} disabled={!scanning}>
                        Stop
                    </Button>
                    {!support.detector && <FormHelperText>Il tuo browser non supporta il rilevamento nativo dei QR. La scansione potrebbe non funzionare.</FormHelperText>}
                </Stack>
            </Stack>
        </Box>
    );
}

export default AdminPanel;
