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

import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

// Drive utils (pubblici, come la home)
import { listImagesInFolder, driveCdnSrc, driveApiSrc } from "../lib/driveGallery";

/* ---------------- THEME ---------------- */
const drawerWidth = 256;
const muiTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#FFD54F" }, // giallo
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
        MuiPaper: { styleOverrides: { root: { backdropFilter: "blur(6px)" } } },
    },
});
const glass = {
    backgroundColor: "rgba(20,20,24,0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 26px rgba(0,0,0,0.45)",
};

/* ----------- DATE UTILS ----------- */
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
   GOOGLE PLACES (lazy) con fallback OSM
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
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
            s.async = true;
            s.onerror = () => reject(new Error("Impossibile caricare Google Maps JS"));
            s.onload = () => resolve(window.google.maps);
            document.head.appendChild(s);
        });
        return p;
    };
})();

function PlaceAutocomplete({ value, onChange, inputValue, onInputChange, error, helperText, onCoords }) {
    const [preds, setPreds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("google"); // "google" | "osm"
    const serviceRef = useRef(null);
    const detailsRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const maps = await loadGooglePlaces();
                if (!alive) return;
                try {
                    serviceRef.current = new maps.places.AutocompleteService();
                    detailsRef.current = new maps.places.PlacesService(document.createElement("div"));
                    setMode("google");
                } catch {
                    setMode("osm");
                }
            } catch {
                setMode("osm");
            }
        })();
        return () => {
            alive = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    useEffect(() => {
        const q = (inputValue || "").trim();
        if (!q) {
            setPreds([]);
            return;
        }
        setLoading(true);

        if (mode === "google" && serviceRef.current) {
            let cancel = false;
            serviceRef.current.getPlacePredictions({ input: q }, (res, status) => {
                if (cancel) return;
                setLoading(false);
                if (!res || status !== "OK") {
                    setPreds([]);
                    return;
                }
                setPreds(res.map((p) => ({ label: p.description, place_id: p.place_id })));
            });
            return () => { cancel = true; };
        }

        // OSM fallback
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        (async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q)}`;
                const r = await fetch(url, { signal: controller.signal, headers: { "Accept-Language": "it" } });
                const data = await r.json();
                setPreds(
                    (data || []).map((d) => ({
                        label: d.display_name,
                        lat: parseFloat(d.lat),
                        lon: parseFloat(d.lon),
                        place_id: d.place_id,
                    }))
                );
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [inputValue, mode]);

    const selectOption = (evt, opt) => {
        if (!opt) {
            onChange(null);
            onCoords?.(null);
            return;
        }
        if (mode === "google" && detailsRef.current && opt.place_id) {
            detailsRef.current.getDetails({ placeId: opt.place_id }, (place, status) => {
                if (!place || status !== "OK") {
                    onChange({ label: opt.label });
                    onCoords?.(null);
                    return;
                }
                const loc = place.geometry?.location;
                const coords = loc ? { lat: loc.lat?.(), lon: loc.lng?.() } : null;
                onChange({ label: place.formatted_address || opt.label, ...coords });
                onCoords?.(coords);
            });
        } else {
            onChange(opt);
            onCoords?.(opt.lat && opt.lon ? { lat: opt.lat, lon: opt.lon } : null);
        }
    };

    return (
        <MUIAutocomplete
            options={preds}
            value={value}
            onChange={selectOption}
            inputValue={inputValue}
            onInputChange={(e, v) => onInputChange(v)}
            getOptionLabel={(o) => o?.label || ""}
            noOptionsText="Nessun risultato"
            loading={loading}
            clearOnBlur={false}
            blurOnSelect
            renderInput={(params) => {
                const { InputProps, ...rest } = params;
                return (
                    <TextField
                        {...rest}
                        label="Cerca e seleziona un luogo"
                        required
                        error={!!error}
                        helperText={helperText || (mode === "osm" ? "Ricerca tramite OpenStreetMap" : "")}
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
   Dialog selezione copertina da Drive (grid)
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
            const list = await listImagesInFolder(folderId, { apiKey, includeSharedDrives: true, pageSize: 200 });
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

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ImageIcon color="primary" /> Seleziona copertina da Drive
            </DialogTitle>
            <DialogContent dividers sx={{ background: "#101014" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
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
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
                                "&:hover fieldset": { borderColor: "primary.main" },
                                "&.Mui-focused fieldset": { borderColor: "primary.main" },
                            },
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
                    <Grid container spacing={1}>
                        {filtered.map((img) => {
                            const thumb = driveCdnSrc(img.id, 640);
                            const fallback = driveApiSrc(img.id, apiKey);
                            return (
                                <Grid item xs={6} sm={4} md={3} key={img.id}>
                                    <Box
                                        role="button"
                                        onClick={() => { onPick(driveCdnSrc(img.id, 1600)); onClose(); }}
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            pt: "70%",
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
                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#111" }}
                                        />
                                    </Box>
                                </Grid>
                            );
                        })}
                        {!filtered.length && (
                            <Grid item xs={12}>
                                <Box sx={{ p: 3, textAlign: "center", opacity: 0.7 }}>Nessuna immagine trovata.</Box>
                            </Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ------------ MOBILE CARDS ------------ */
function MobileEventCard({ ev, onEdit, onDelete, onToggleSoldOut }) {
    const past = isPast(ev);
    return (
        <Card sx={{ mb: 1.5, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ pb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    {!past ? <CheckCircleIcon color="success" fontSize="small" /> : <LockClockIcon color="disabled" fontSize="small" />}
                    <Typography variant="subtitle1" fontWeight={700}>{ev.name}</Typography>
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
                    <Button size="small" startIcon={<EditIcon />} onClick={onEdit} disabled={past}>Modifica</Button>
                    <IconButton size="small" color="error" onClick={onDelete} disabled={past}><DeleteIcon fontSize="small" /></IconButton>
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

    // form
    const [formData, setFormData] = useState({
        name: "", dj: "", date: "", time: "", price: "", capacity: "",
        description: "", soldOut: false, image: "", place: "", placeCoords: null,
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
        : driveFolderId ? `https://drive.google.com/drive/u/0/folders/${driveFolderId}` : "";

    // bootstrap guard
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

    const openExternal = (url) => url && window.open(url, "_blank", "noopener,noreferrer");

    // pick immagine da device
    const onPickFromDevice = () => fileInputRef.current?.click();
    const onDeviceFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setFormData((f) => ({ ...f, image: reader.result || "" }));
        reader.readAsDataURL(file);
    };

    // validazione
    const validate = () => {
        const e = {};
        if (!formData.name?.trim()) e.name = "Inserisci un nome";
        if (!formData.date || formData.date < todayISO()) e.date = "Scegli una data futura";
        if (!formData.time) e.time = "Inserisci un orario";
        if (!placeSelected) e.place = "Seleziona un luogo dall'elenco";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const resetForm = () => {
        setEditingId(null);
        setErrors({});
        setPlaceSelected(null);
        setPlaceInput("");
        setPlaceCoords(null);
        setFormData({
            name: "", dj: "", date: "", time: "", price: "", capacity: "",
            description: "", soldOut: false, image: "", place: "", placeCoords: null,
        });
    };

    const handleChange = (ev) => setFormData({ ...formData, [ev.target.name]: ev.target.value });

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        try {
            const payload = {
                ...formData,
                image: formData.image || heroImg,
                place: placeSelected?.label || formData.place,
                placeCoords: placeCoords || formData.placeCoords || null,
            };
            if (editingId) {
                await updateEvent(editingId, payload);
                showToast("Evento aggiornato", "success");
            } else {
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
            name: ev.name || "", dj: ev.dj || "", date: ev.date || "", time: ev.time || "",
            price: ev.price || "", capacity: ev.capacity || "", description: ev.description || "",
            soldOut: !!ev.soldOut, image: ev.image || "", place: ev.place || "", placeCoords: ev.placeCoords || null,
        });
        if (ev.place) {
            setPlaceSelected({ label: ev.place, ...(ev.placeCoords || {}) });
            setPlaceInput(ev.place);
            setPlaceCoords(ev.placeCoords || null);
        } else {
            setPlaceSelected(null); setPlaceInput(""); setPlaceCoords(null);
        }
        setEditingId(ev.id);
        setSection("create");
    };

    const handleToggleSoldOut = async (id, value) => {
        await updateEvent(id, { soldOut: value });
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, soldOut: value } : e)));
    };

    /* ---------- FILTRI EVENTI ---------- */
    const [evQuery, setEvQuery] = useState("");
    const [evStatus, setEvStatus] = useState("all"); // all|future|past
    const [evSort, setEvSort] = useState({ key: "date", dir: "asc" }); // date|name|place

    const filteredSortedEvents = useMemo(() => {
        const q = evQuery.toLowerCase().trim();
        let list = [...events];
        list = list.filter((ev) => {
            const past = isPast(ev);
            if (evStatus === "future") return !past;
            if (evStatus === "past") return past;
            return true;
        });
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
    }, [events, evQuery, evStatus, evSort]);

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
                va = new Date(a.createdAt || a.created || 0).getTime();
                vb = new Date(b.createdAt || b.created || 0).getTime();
            } else if (bkSort.key === "name") {
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

    /* ---------- Drawer ---------- */
    const navItems = [
        { key: "events", label: "Eventi", icon: <CalendarTodayIcon /> },
        { key: "create", label: "Crea / Modifica Evento", icon: <AddCircleOutlineIcon /> },
        { key: "bookings", label: "Prenotazioni", icon: <ListAltIcon /> },
        { key: "gallery", label: "Gallery", icon: <PhotoLibraryIcon /> },
    ];
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
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
                                    <Button
                                        startIcon={<AddCircleOutlineIcon />}
                                        variant="contained"
                                        color="primary"
                                        onClick={() => { resetForm(); setSection("create"); }}
                                    >
                                        Nuovo evento
                                    </Button>
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
                                                <TableCell>Sold Out</TableCell>
                                                <TableCell align="right">Azioni</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSortedEvents.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center" sx={{ py: 4, opacity: 0.7 }}>
                                                        Nessun evento con i filtri attuali.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {filteredSortedEvents.map((ev) => {
                                                const past = isPast(ev);
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
                                                            <Switch
                                                                checked={!!ev.soldOut}
                                                                onChange={(e) => handleToggleSoldOut(ev.id, e.target.checked)}
                                                                color="warning"
                                                                disabled={past}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title={past ? "Evento passato" : "Modifica"}>
                                  <span>
                                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(ev)} disabled={past}>
                                      Modifica
                                    </Button>
                                  </span>
                                                                </Tooltip>
                                                                <Tooltip title={past ? "Evento passato" : "Elimina"}>
                                  <span>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => setConfirm({ open: true, id: ev.id, type: "event" })}
                                        disabled={past}
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
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    {/* CREA / MODIFICA EVENTO */}
                    {section === "create" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 1200, mx: "auto" }}>
                            <Typography
                                variant="h5"
                                sx={{ textAlign: { xs: "center", md: "left" }, mb: 2, letterSpacing: 0.3 }}
                            >
                                {editingId ? "Modifica evento" : "Crea nuovo evento"}
                            </Typography>

                            {/* Copertina con overlay bottoni */}
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
                                            backdropFilter: "blur(6px)",
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
                                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onDeviceFileChange} />
                                </Box>

                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Carica una copertina 16:9. Formati consigliati: JPG/WEBP, &lt; 1MB.
                                </Typography>
                            </Paper>

                            {/* FORM GRID — Desktop 8/4, Mobile 1 colonna */}
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2}>
                                    {/* SINISTRA (Dettagli + Descrizione & Stato) */}
                                    <Grid item xs={12} md={8}>
                                        {/* Dettagli */}
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                Dettagli
                                            </Typography>

                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        name="name"
                                                        label="Nome evento"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        fullWidth
                                                        required
                                                        error={!!errors.name}
                                                        helperText={errors.name}
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
                                                        label="DJ"
                                                        value={formData.dj}
                                                        onChange={handleChange}
                                                        fullWidth
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    {/* musica */}
                                                                    <ImageIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        name="price"
                                                        label="Prezzo"
                                                        value={formData.soldOut ? "" : formData.price}
                                                        onChange={handleChange}
                                                        fullWidth
                                                        disabled={formData.soldOut}
                                                        inputMode="decimal"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <EuroIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        helperText={formData.soldOut ? "Non richiesto se sold out" : ""}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        name="capacity"
                                                        label="Capienza"
                                                        value={formData.capacity}
                                                        onChange={handleChange}
                                                        fullWidth
                                                        inputMode="numeric"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        {/* Descrizione & Stato */}
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Grid container spacing={2} alignItems="flex-start">
                                                <Grid item xs={12} md={8}>
                                                    <TextField
                                                        name="description"
                                                        label="Descrizione"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        fullWidth
                                                        multiline
                                                        minRows={6}
                                                        placeholder="Line-up, dress code, guestlist…"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <Stack spacing={1.5} sx={{ pt: { md: 0.5 } }}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Typography variant="body2">Sold out</Typography>
                                                            <Switch
                                                                checked={formData.soldOut}
                                                                onChange={(_, checked) => setFormData((f) => ({ ...f, soldOut: checked }))}
                                                                color="warning"
                                                            />
                                                        </Stack>
                                                        <FormHelperText>Se attivo, il campo prezzo viene disabilitato.</FormHelperText>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>

                                    {/* DESTRA (Programmazione + Luogo) */}
                                    <Grid item xs={12} md={4}>
                                        <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
                                            {/* Programmazione */}
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                    Programmazione
                                                </Typography>
                                                <Grid container spacing={1.5}>
                                                    <Grid item xs={12} sm={6} md={12}>
                                                        <TextField
                                                            type="date"
                                                            name="date"
                                                            label="Data"
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: todayISO() }}
                                                            value={formData.date}
                                                            onChange={handleChange}
                                                            required
                                                            error={!!errors.date}
                                                            helperText={errors.date}
                                                            fullWidth
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <CalendarTodayIcon fontSize="small" />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={12}>
                                                        <TextField
                                                            type="time"
                                                            name="time"
                                                            label="Orario"
                                                            InputLabelProps={{ shrink: true }}
                                                            value={formData.time}
                                                            onChange={handleChange}
                                                            required
                                                            error={!!errors.time}
                                                            helperText={errors.time}
                                                            fullWidth
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <AccessTimeIcon fontSize="small" />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>

                                            {/* Luogo */}
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                                                    Luogo
                                                </Typography>

                                                <PlaceAutocomplete
                                                    value={placeSelected}
                                                    onChange={(val) => {
                                                        setPlaceSelected(val);
                                                        setFormData((f) => ({ ...f, place: val?.label || "" }));
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
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0.5, opacity: 0.8 }}>
                                                            <MapIcon fontSize="small" />{" "}
                                                            <Typography variant="caption">Anteprima posizione</Typography>
                                                        </Box>
                                                        <img
                                                            src={`https://staticmap.openstreetmap.de/staticmap.php?center=${placeCoords.lat},${placeCoords.lon}&zoom=14&size=600x240&markers=${placeCoords.lat},${placeCoords.lon},lightred1`}
                                                            alt="Mappa"
                                                            style={{ width: "100%", height: 240, objectFit: "cover" }}
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    </Box>
                                                )}
                                            </Paper>

                                            {/* Azioni desktop */}
                                            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
                                                <Button variant="contained" type="submit" disabled={!isValid}>
                                                    {editingId ? "Salva modifiche" : "Crea evento"}
                                                </Button>
                                                <Button variant="text" onClick={() => { resetForm(); setSection("events"); }}>
                                                    Annulla
                                                </Button>
                                            </Stack>
                                        </Stack>
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
                                    onChange={(e) => setBkQuery(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                                    fullWidth={isMobile}
                                    sx={{ minWidth: 260 }}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
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
                                <Box>
                                    {filteredSortedBookings.map((b) => <MobileBookingCard key={b.id} b={b} />)}
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

                    {/* GALLERY (link esterno) */}
                    {section === "gallery" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 2, maxWidth: 520, mx: "auto", textAlign: "center" }}>
                            <Typography variant="h5" gutterBottom>Gallery</Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                                Le immagini della Home sono lette direttamente dalla cartella Drive pubblica.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<LaunchIcon />}
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

export default AdminPanel;
