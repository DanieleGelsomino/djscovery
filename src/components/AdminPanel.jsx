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
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, TextField, Button, CssBaseline, Table, TableHead,
    TableRow, TableCell, TableBody, Switch, Divider, IconButton, Grid, Paper,
    useMediaQuery, useTheme, Tooltip, Stack, InputAdornment, TableContainer,
    MenuItem, Select, FormControl, Chip, Dialog, DialogTitle, DialogContent,
    Skeleton, Alert, Autocomplete,
} from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";

import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

import { listImagesInFolder, driveCdnSrc, driveApiSrc } from "../lib/driveGallery";

// icons
import CalendarIcon from "@mui/icons-material/CalendarToday";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import CelebrationIcon from "@mui/icons-material/Celebration";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import EuroIcon from "@mui/icons-material/Euro";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import ImageIcon from "@mui/icons-material/Image";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// assets
import heroImg from "../assets/img/hero.png";

/* ───────────────── THEME ──────────────── */
const drawerWidth = 240;
const appTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#FFD54F" },
        secondary: { main: "#E53935" },
        background: { default: "#0b0b0d", paper: "#141418" },
    },
    shape: { borderRadius: 12 },
    typography: { button: { textTransform: "none", fontWeight: 600 } },
    components: {
        MuiTableCell: { styleOverrides: { head: { fontWeight: 700, background: "#1b1b22" } } },
        MuiPaper: { styleOverrides: { root: { backdropFilter: "blur(6px)" } } },
    },
});
const glass = {
    backgroundColor: "rgba(20,20,24,0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 26px rgba(0,0,0,0.45)",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const eventDateTime = (ev) => new Date(`${ev?.date}T${ev?.time || "00:00"}:00`);
const isPast = (ev) => !ev?.date ? false : eventDateTime(ev).getTime() < Date.now();

/* ───────────── Google Places loader con fallback OSM ───────────── */
const loadGooglePlaces = (() => {
    let promise;
    return () => {
        if (promise) return promise;
        const key = import.meta.env.VITE_GOOGLE_API_KEY || window.APP_CONFIG?.GOOGLE_API_KEY;
        if (!key) return Promise.reject(new Error("Manca VITE_GOOGLE_API_KEY"));
        promise = new Promise((resolve, reject) => {
            if (window.google?.maps?.places) return resolve(window.google.maps);
            const s = document.createElement("script");
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
            s.async = true;
            s.onerror = () => reject(new Error("Errore caricamento Google Maps"));
            s.onload = () => {
                if (window.google?.maps?.places) resolve(window.google.maps);
                else reject(new Error("Places non disponibile (API non abilitate?)"));
            };
            document.head.appendChild(s);
        });
        return promise;
    };
})();

/* ───────────── Autocomplete luogo (Google → OSM fallback) ───────────── */
function PlaceAutocomplete({ value, onChange, inputValue, onInputChange, error, helperText }) {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const serviceRef = useRef(null);
    const detailsRef = useRef(null);
    const debounceRef = useRef();

    useEffect(() => {
        let alive = true;
        loadGooglePlaces()
            .then((maps) => {
                if (!alive) return;
                serviceRef.current = new maps.places.AutocompleteService();
                detailsRef.current = new maps.places.PlacesService(document.createElement("div"));
            })
            .catch(() => {});
        return () => (alive = false);
    }, []);

    const queryOSM = async (q) => {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        return data.map((d) => ({ label: d.display_name, lat: +d.lat, lon: +d.lon }));
    };

    useEffect(() => {
        const q = (inputValue || "").trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 3) {
            setOptions([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                if (serviceRef.current) {
                    serviceRef.current.getPlacePredictions({ input: q }, async (preds, status) => {
                        if (status === "OK" && preds?.length) {
                            setOptions(preds.map((p) => ({ label: p.description, place_id: p.place_id })));
                            setLoading(false);
                        } else {
                            const osm = await queryOSM(q);
                            setOptions(osm);
                            setLoading(false);
                        }
                    });
                } else {
                    const osm = await queryOSM(q);
                    setOptions(osm);
                    setLoading(false);
                }
            } catch {
                const osm = await queryOSM(q);
                setOptions(osm);
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [inputValue]);

    const handleSelect = (e, opt) => {
        if (!opt) return onChange(null);
        if (opt.place_id && detailsRef.current) {
            detailsRef.current.getDetails({ placeId: opt.place_id }, (place, status) => {
                if (status !== "OK" || !place) return onChange({ label: opt.label });
                const loc = place.geometry?.location;
                onChange({
                    label: place.formatted_address || opt.label,
                    lat: loc?.lat?.() ?? null,
                    lon: loc?.lng?.() ?? null,
                });
            });
        } else {
            onChange(opt);
        }
    };

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={handleSelect}
            inputValue={inputValue}
            onInputChange={(e, v) => onInputChange(v)}
            getOptionLabel={(o) => o?.label || ""}
            loading={loading}
            noOptionsText="Nessun risultato"
            clearOnBlur={false}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Luogo (cerca e seleziona)"
                    required
                    error={!!error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <>
                                <InputAdornment position="start">
                                    <PlaceIcon fontSize="small" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
}

/* ───────────── Dialog: immagini da Drive (anteprime) ───────────── */
function DriveImagePickerDialog({ open, onClose, onPick }) {
    const apiKey =
        import.meta.env.VITE_GOOGLE_API_KEY || window.APP_CONFIG?.GOOGLE_API_KEY;
    const folderId =
        import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || window.APP_CONFIG?.GOOGLE_DRIVE_FOLDER_ID;

    const driveFolderLink =
        (import.meta.env.VITE_GOOGLE_DRIVE_FOLDER && import.meta.env.VITE_GOOGLE_DRIVE_FOLDER.startsWith("http"))
            ? import.meta.env.VITE_GOOGLE_DRIVE_FOLDER
            : folderId
                ? `https://drive.google.com/drive/folders/${folderId}`
                : "";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        if (!apiKey || !folderId) {
            setError("Configurazione mancante: API key o Folder ID non trovati.");
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const list = await listImagesInFolder(folderId, {
                apiKey,
                includeSharedDrives: true,
                pageSize: 200,
            });
            setItems(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("[Drive Picker] fetch error:", e);
            setError("Impossibile caricare le immagini da Drive.");
            setItems([]);
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ImageIcon /> Seleziona copertina da Drive
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    background: "#101014",
                    minHeight: 260,
                    maxHeight: 560,
                    overflowY: "auto",
                }}
            >
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
                    />
                    <Button
                        onClick={load}
                        variant="outlined"
                        sx={{ color: "#FFD54F", borderColor: "#FFD54F" }}
                    >
                        Ricarica
                    </Button>
                    {driveFolderLink && (
                        <Button
                            variant="text"
                            endIcon={<OpenInNewIcon />}
                            onClick={() =>
                                window.open(driveFolderLink, "_blank", "noopener,noreferrer")
                            }
                            sx={{ color: "#FFD54F" }}
                        >
                            Apri cartella
                        </Button>
                    )}
                </Stack>

                {!!error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Grid container spacing={1}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Grid item xs={6} sm={4} md={3} key={i}>
                                <Skeleton variant="rectangular" height={120} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && !error && (
                    <Grid container spacing={1}>
                        {filtered.map((img) => {
                            const cdnThumb = `https://lh3.googleusercontent.com/d/${img.id}=w320`;
                            const fallback = `https://www.googleapis.com/drive/v3/files/${img.id}?alt=media&key=${encodeURIComponent(apiKey)}`;
                            return (
                                <Grid item xs={6} sm={4} md={3} key={img.id}>
                                    <Box
                                        role="button"
                                        onClick={() => {
                                            onPick(`https://lh3.googleusercontent.com/d/${img.id}=w1600`);
                                            onClose();
                                        }}
                                        sx={{
                                            position: "relative",
                                            width: "100%",
                                            pt: "70%",
                                            overflow: "hidden",
                                            borderRadius: 1,
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            cursor: "pointer",
                                            "&:hover": { outline: "2px solid #FFD54F" },
                                        }}
                                    >
                                        <img
                                            src={cdnThumb}
                                            alt={img.name}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => (e.currentTarget.src = fallback)}
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
                                </Grid>
                            );
                        })}
                        {!filtered.length && (
                            <Grid item xs={12}>
                                <Box sx={{ p: 3, textAlign: "center", opacity: 0.7 }}>
                                    Nessuna immagine trovata.
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ───────────────────────────── ADMIN PANEL ───────────────────────────── */
const AdminPanel = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const mui = useTheme();
    const isMobile = useMediaQuery(mui.breakpoints.down("md"));

    const [section, setSection] = useState("create");
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
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);
    const [driveDialogOpen, setDriveDialogOpen] = useState(false);

    // place autocomplete
    const [placeSelected, setPlaceSelected] = useState(null);
    const [placeInput, setPlaceInput] = useState("");

    // drive link in header
    const driveFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
    const driveFolderLinkEnv = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER;
    const driveFolderLink = driveFolderLinkEnv?.startsWith("http")
        ? driveFolderLinkEnv
        : driveFolderId
            ? `https://drive.google.com/drive/folders/${driveFolderId}`
            : "";

    /* bootstrap */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    /* header actions */
    const handleLogout = async () => {
        try { await signOut(auth); } catch {}
        setAuthToken(null);
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminToken");
        navigate("/admin");
    };

    /* form helpers */
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onPickFromDevice = () => fileInputRef.current?.click();
    const onDeviceFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setFormData((f) => ({ ...f, image: reader.result || "" }));
        reader.readAsDataURL(file);
    };
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
        setFormData({
            name: "", dj: "", date: "", time: "", price: "", capacity: "",
            description: "", soldOut: false, image: "", place: "", placeCoords: null,
        });
        setErrors({});
        setEditingId(null);
        setPlaceSelected(null);
        setPlaceInput("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                image: formData.image || heroImg,
                place: placeSelected?.label || "",
                placeCoords: placeSelected?.lat ? { lat: placeSelected.lat, lon: placeSelected.lon } : null,
            };
            if (editingId) {
                await updateEvent(editingId, payload);
                showToast("Evento aggiornato", "success");
            } else {
                await createEvent(payload);
                showToast("Evento creato", "success");
            }
            const list = await fetchEvents();
            setEvents(list || []);
            setSection("events");
            resetForm();
        } catch (err) {
            if (err?.response?.status === 401) {
                setAuthToken(null);
                localStorage.removeItem("isAdmin");
                navigate("/admin");
            } else {
                showToast("Errore nel salvataggio", "error");
            }
        } finally {
            setSaving(false);
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
        } else { setPlaceSelected(null); setPlaceInput(""); }
        setEditingId(ev.id);
        setSection("create");
    };

    const handleDelete = async (id) => {
        try {
            await deleteEvent(id);
            setEvents((prev) => prev.filter((ev) => ev.id !== id));
            showToast("Evento eliminato", "success");
        } catch { showToast("Errore", "error"); }
    };

    /* eventi: filtro+ordine */
    const [evQuery, setEvQuery] = useState("");
    const [evSort, setEvSort] = useState("date-desc");
    const eventsView = useMemo(() => {
        const q = evQuery.trim().toLowerCase();
        let list = [...events];
        if (q) {
            list = list.filter((ev) =>
                [ev.name, ev.dj, ev.place].filter(Boolean).some((s) => s.toLowerCase().includes(q))
            );
        }
        const [key, dir] = evSort.split("-");
        list.sort((a, b) => {
            let va, vb;
            if (key === "date") {
                va = eventDateTime(a)?.getTime() || 0;
                vb = eventDateTime(b)?.getTime() || 0;
            } else {
                va = (a[key] || "").toString().toLowerCase();
                vb = (b[key] || "").toString().toLowerCase();
            }
            return dir === "asc" ? va - vb : vb - va;
        });
        return list;
    }, [events, evQuery, evSort]);

    /* drawer */
    const nav = [
        { key: "create", label: "Crea/Modifica", icon: <AddCircleOutlineIcon /> },
        { key: "events", label: "Eventi", icon: <CalendarIcon /> },
        { key: "bookings", label: "Prenotazioni", icon: <ListAltIcon /> },
        { key: "gallery", label: "Gallery", icon: <PhotoLibraryIcon /> },
    ];

    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {nav.map((item) => (
                    <ListItem disablePadding key={item.key}>
                        <ListItemButton
                            onClick={() => { setSection(item.key); setMobileOpen(false); }}
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

    return (
        <MuiThemeProvider theme={appTheme}>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />

                {/* HEADER */}
                <AppBar
                    position="fixed"
                    sx={{
                        ...glass,
                        zIndex: (t) => t.zIndex.drawer + 1,
                        color: "#FFD54F",
                        background: "linear-gradient(90deg, #0b0b0d 0%, #171722 100%)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <Toolbar sx={{ gap: 1, justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {isMobile && (
                                <IconButton color="inherit" onClick={() => setMobileOpen(true)} aria-label="Apri menu">
                                    <MenuIcon />
                                </IconButton>
                            )}
                            <Typography variant="h6" noWrap>Admin</Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title="Apri cartella Drive">
                <span>
                  <IconButton
                      color="inherit"
                      onClick={() => driveFolderLink && window.open(driveFolderLink, "_blank", "noopener,noreferrer")}
                      disabled={!driveFolderLink}
                      aria-label="Drive"
                  >
                    <AddToDriveIcon />
                  </IconButton>
                </span>
                            </Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.2 }} />
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
                            borderRadius: "0 12px 12px 0",
                            backgroundImage: "linear-gradient(180deg, #121218, #171722)",
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* MAIN */}
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />

                    {/* FORM EVENTO */}
                    {section === "create" && (
                        <Paper sx={{ ...glass, p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 3, maxWidth: 1100, mx: "auto" }}>
                            {/* titolo centrato */}
                            <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
                                {editingId ? "Modifica evento" : "Crea nuovo evento"}
                            </Typography>

                            {/* Cover */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2, mb: 3, borderRadius: 2,
                                    borderColor: "rgba(255,255,255,0.1)",
                                    display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
                                    justifyContent: { xs: "center", md: "flex-start" },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: { xs: "100%", sm: 320 }, height: { xs: 180, sm: 160 },
                                        borderRadius: 2, overflow: "hidden", bgcolor: "#0f0f12",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <img
                                        src={formData.image || heroImg}
                                        alt="Anteprima evento"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Tooltip title="Scegli da Drive">
                                        <IconButton
                                            onClick={() => setDriveDialogOpen(true)}
                                            aria-label="Scegli da Drive"
                                            sx={{ color: "#FFD54F", border: "1px solid rgba(255,255,255,0.14)" }}
                                        >
                                            <AddToDriveIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Carica da dispositivo">
                                        <IconButton
                                            onClick={onPickFromDevice}
                                            aria-label="Carica da dispositivo"
                                            sx={{ color: "#FFD54F", border: "1px solid rgba(255,255,255,0.14)" }}
                                        >
                                            <CloudUploadIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={onDeviceFileChange}
                                    />
                                    {formData.image && (
                                        <Tooltip title="Rimuovi immagine">
                                            <IconButton
                                                onClick={() => setFormData((f) => ({ ...f, image: "" }))}
                                                aria-label="Rimuovi immagine"
                                                sx={{ color: "#FFD54F", border: "1px solid rgba(255,255,255,0.14)" }}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Grid: 1 col mobile / 2 col desktop */}
                            <Grid container spacing={2} component="form" onSubmit={handleSubmit}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        name="name" label="Nome evento" value={formData.name} onChange={handleChange}
                                        fullWidth required error={!!errors.name} helperText={errors.name} sx={{ mb: 2 }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><CelebrationIcon fontSize="small" /></InputAdornment> }}
                                    />
                                    <TextField
                                        name="dj" label="DJ" value={formData.dj} onChange={handleChange} fullWidth sx={{ mb: 2 }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><MusicNoteIcon fontSize="small" /></InputAdornment> }}
                                    />
                                    <TextField
                                        name="price" label="Prezzo" value={formData.price} onChange={handleChange} fullWidth sx={{ mb: 2 }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><EuroIcon fontSize="small" /></InputAdornment> }}
                                    />
                                    <TextField
                                        name="capacity" label="Capienza" value={formData.capacity} onChange={handleChange} fullWidth
                                        InputProps={{ startAdornment: <InputAdornment position="start"><GroupIcon fontSize="small" /></InputAdornment> }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                type="date" name="date" label="Data" InputLabelProps={{ shrink: true }} inputProps={{ min: todayISO() }}
                                                value={formData.date} onChange={handleChange} required fullWidth
                                                error={!!errors.date} helperText={errors.date}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon fontSize="small" /></InputAdornment> }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                type="time" name="time" label="Orario" InputLabelProps={{ shrink: true }}
                                                value={formData.time} onChange={handleChange} required fullWidth
                                                error={!!errors.time} helperText={errors.time}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" /></InputAdornment> }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <PlaceAutocomplete
                                                value={placeSelected}
                                                onChange={(val) => {
                                                    setPlaceSelected(val);
                                                    setFormData((f) => ({
                                                        ...f,
                                                        place: val?.label || "",
                                                        placeCoords: val ? { lat: val.lat ?? null, lon: val.lon ?? null } : null,
                                                    }));
                                                }}
                                                inputValue={placeInput}
                                                onInputChange={(v) => setPlaceInput(v)}
                                                error={!!errors.place}
                                                helperText={errors.place}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Descrizione: sezione dedicata full width */}
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "rgba(255,255,255,0.1)" }}>
                                        <TextField
                                            name="description" label="Descrizione" value={formData.description} onChange={handleChange}
                                            fullWidth multiline minRows={6}
                                        />
                                    </Paper>
                                </Grid>

                                {/* Sold out + azioni */}
                                <Grid item xs={12} md={6}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ height: "100%" }}>
                                        <Typography variant="body2">Sold Out</Typography>
                                        <Switch
                                            checked={formData.soldOut}
                                            onChange={(e) => setFormData((f) => ({ ...f, soldOut: e.target.checked }))}
                                            color="warning"
                                        />
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent={{ md: "flex-end" }}>
                                        <Button
                                            type="submit" variant="contained" color="primary"
                                            fullWidth={isMobile} sx={{ py: 1.2 }} disabled={saving}
                                        >
                                            {saving ? "Salvo..." : editingId ? "Salva modifiche" : "Crea evento"}
                                        </Button>
                                        <Button variant="text" fullWidth={isMobile} onClick={resetForm} sx={{ color: "#FFD54F", py: 1.2 }}>
                                            Annulla
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* EVENTI */}
                    {section === "events" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 3 }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.5}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                                sx={{ mb: 2 }}
                            >
                                <TextField
                                    size="small"
                                    placeholder="Cerca nome / DJ / luogo"
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
                                <FormControl size="small">
                                    <Select
                                        value={evSort}
                                        onChange={(e) => setEvSort(e.target.value)}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <SortIcon fontSize="small" />
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="date-desc">Data ↓</MenuItem>
                                        <MenuItem value="date-asc">Data ↑</MenuItem>
                                        <MenuItem value="name-asc">Nome A→Z</MenuItem>
                                        <MenuItem value="name-desc">Nome Z→A</MenuItem>
                                    </Select>
                                </FormControl>
                                <Chip size="small" label={`Totale: ${eventsView.length}`} />
                            </Stack>

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
                                        {eventsView.map((ev) => {
                                            const past = isPast(ev);
                                            return (
                                                <TableRow key={ev.id} hover sx={past ? { opacity: 0.55 } : {}}>
                                                    <TableCell>{ev.name}</TableCell>
                                                    <TableCell>{ev.dj || "—"}</TableCell>
                                                    <TableCell>{ev.place || "—"}</TableCell>
                                                    <TableCell>{ev.date}</TableCell>
                                                    <TableCell>{ev.time}</TableCell>
                                                    <TableCell>{ev.capacity || "-"}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={!!ev.soldOut}
                                                            onChange={(e) => !past && updateEvent(ev.id, { soldOut: e.target.checked }).then(() => {
                                                                setEvents((prev) =>
                                                                    prev.map((x) => (x.id === ev.id ? { ...x, soldOut: e.target.checked } : x))
                                                                );
                                                            })}
                                                            color="warning"
                                                            disabled={past}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <span>
                                <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleEdit(ev)}
                                    disabled={past}
                                >
                                  Modifica
                                </Button>
                              </span>
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
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {!eventsView.length && (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4, opacity: 0.7 }}>
                                                    Nessun evento.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* PRENOTAZIONI */}
                    {section === "bookings" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 3 }}>
                            <TableContainer sx={{ maxHeight: 520 }}>
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
                                        {bookings.map((b) => (
                                            <TableRow key={b.id} hover>
                                                <TableCell>{b.nome}</TableCell>
                                                <TableCell>{b.cognome}</TableCell>
                                                <TableCell>{b.email}</TableCell>
                                                <TableCell>{b.telefono}</TableCell>
                                                <TableCell>{b.quantity || 1}</TableCell>
                                            </TableRow>
                                        ))}
                                        {!bookings.length && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, opacity: 0.7 }}>
                                                    Nessuna prenotazione.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* GALLERY (link a Drive) */}
                    {section === "gallery" && (
                        <Paper sx={{ ...glass, p: 3, mb: 4, borderRadius: 3, maxWidth: 520, mx: "auto", textAlign: "center" }}>
                            <Typography variant="h5" gutterBottom>Gallery</Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                                Le immagini della Home sono lette dalla cartella Drive pubblica.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddToDriveIcon />}
                                onClick={() => driveFolderLink && window.open(driveFolderLink, "_blank", "noopener,noreferrer")}
                                sx={{ color: "#FFD54F", borderColor: "#FFD54F" }}
                                disabled={!driveFolderLink}
                            >
                                Apri cartella Drive
                            </Button>
                        </Paper>
                    )}
                </Box>
            </Box>

            {/* Conferma eliminazione */}
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
