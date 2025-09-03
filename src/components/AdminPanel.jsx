import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { formatDate } from "./admin/eventUtils";
import {
    fetchBookings,
    createEvent,
    fetchEvents,
    updateEvent,
    deleteEvent,
    setAuthToken,
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
import EuroIcon from "@mui/icons-material/Euro";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MapIcon from "@mui/icons-material/Map";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import IosShareIcon from "@mui/icons-material/IosShare";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";




import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import PlaceAutocomplete from "./admin/PlaceAutocomplete";
import DriveImagePickerDialog from "./admin/DriveImagePickerDialog";
import MobileEventCard from "./admin/MobileEventCard";
import MobileBookingCard from "./admin/MobileBookingCard";
import CheckInBox from "./admin/CheckInBox";
import { isPast, eventDateTime } from "./admin/eventUtils";



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

// ======= GEOAPIFY Autocomplete (OSM) =======


/* =========================================
   Dialog selezione copertina da Drive — griglia responsive (ottimizzata + HEIC)
   ========================================= */


/* ------------ MOBILE CARDS ------------ */

/* ---------- Helpers ---------- */
const roles = { admin: "admin", editor: "editor", staff: "staff" };
const canDeleteEvent = (role) => role === roles.admin;
const canEditEvent = (role) => role === roles.admin || role === roles.editor;

/* --------------- MAIN --------------- */
const AdminPanel = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
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
            showToast(t("admin.toast.auto_soldout"), "info");
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
                                                <TableCell>{t("admin.events.columns.soldOut")}</TableCell>
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
                                                        <TableCell>{formatDate(ev.date)}</TableCell>
                                                        <TableCell>{ev.time}</TableCell>
                                                        <TableCell>{ev.capacity || "-"}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                size="small"
                                                                label={t(`admin.events.statuses.${status}`)}
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
                                                        helperText={errors.price || (formData.soldOut ? t("admin.form.soldOut_hint") : "")}
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
                                                            <Typography variant="body2">{t("admin.form.soldOut")}</Typography>
                                                            <Switch
                                                                checked={formData.soldOut}
                                                                onChange={(_, checked) =>
                                                                    setFormData((f) => ({ ...f, soldOut: checked }))
                                                                }
                                                                color="warning"
                                                            />
                                                        </Stack>
                                                        <FormHelperText>
                                                            {t("admin.form.soldOut_hint")}
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
                                                    {ev.name} — {formatDate(ev.date)}
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

export default AdminPanel;
