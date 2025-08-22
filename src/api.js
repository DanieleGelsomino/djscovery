// src/api.js
import {
    mockFetchEvents,
    mockSendBooking,
    mockFetchBookings,
    mockCreateEvent,
    mockUpdateEvent,
    mockDeleteEvent,
    mockFetchGallery,
    mockUploadGalleryImage,
    mockDeleteGalleryImage,
    mockSubscribeNewsletter,
} from "./mockApi";
import { withLoading } from "./loading";

// ⬇️ Usa mock SOLO se esplicitamente "true"
const useMock = (import.meta.env.VITE_MOCK || "").toString().toLowerCase() === "true";

// ⬇️ Base URL backend; in dev fallback a http://localhost:3000
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Token bearer (Firebase ID token)
let authToken = null;

// Se hai salvato il token in localStorage, ripristinalo all'avvio
try {
    const saved = localStorage.getItem("adminToken");
    if (saved) authToken = saved;
} catch { /* no-op */ }

export const setAuthToken = (token) => {
    authToken = token || null;
    try {
        if (token) localStorage.setItem("adminToken", token);
        else localStorage.removeItem("adminToken");
    } catch { /* no-op */ }
};

// Helper: costruisce headers con Authorization se presente
const authHeaders = (extra = {}) => ({
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...extra,
});

// Helper: uniforma gli errori per compatibilità con err.response.status
async function handleResponse(res) {
    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    if (!res.ok) {
        const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
        // compat con AdminPanel.jsx che fa err?.response?.status
        err.response = { status: res.status, data };
        throw err;
    }
    return data;
}

/* =======================
   EVENTS
   ======================= */
export const fetchEvents = async () => {
    if (useMock) return mockFetchEvents();
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/events`);
        return handleResponse(res);
    });
};

export const createEvent = async (data) => {
    if (useMock) return mockCreateEvent(data);
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/events`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    });
};

export const updateEvent = async (id, data) => {
    if (useMock) return mockUpdateEvent(id, data);
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/events/${id}`, {
            method: "PUT",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    });
};

export const deleteEvent = async (id) => {
    if (useMock) return mockDeleteEvent(id);
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/events/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse(res);
    });
};

/* =======================
   BOOKINGS
   ======================= */
export const fetchBookings = async () => {
    if (useMock) return mockFetchBookings();
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/bookings`);
        return handleResponse(res);
    });
};

export const sendBooking = async (data) => {
    if (useMock) return mockSendBooking(data);
    return withLoading(async () => {
        // normalizziamo quantita -> quantity per sicurezza
        const body = {
            ...data,
            quantity: data?.quantity ?? data?.quantita ?? 1,
        };
        const res = await fetch(`${API_BASE}/api/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    });
};

// Verifica QR / token
export const verifyBooking = async (token) => {
    if (useMock) {
        return {
            valid: true, bookingId: "mock", eventId: "mock-event",
            quantity: 2, checkedInCount: 0, remaining: 2,
            nome: "Mario", cognome: "Rossi", email: "mario@example.com", telefono: "3331234567", status: "sent",
            createdAt: new Date().toISOString(),
        };
    }
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/bookings/verify?token=${encodeURIComponent(token)}`);
        return handleResponse(res);
    });
};

// Check-in automatico / manuale (protected)
export const checkInBooking = async (token, count = 1) => {
    if (useMock) {
        return { ok: true, quantity: 2, checkedInCount: Math.min(2, count), remaining: Math.max(0, 2 - count) };
    }
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/bookings/checkin`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ token, count }),
        });
        return handleResponse(res);
    });
};

// Undo (protected)
export const undoCheckIn = async (token, count = 1) => {
    if (useMock) {
        return { ok: true, quantity: 2, checkedInCount: Math.max(0, 2 - count), remaining: Math.max(0, 2 - (2 - count)) };
    }
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/bookings/checkin/undo`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ token, count }),
        });
        return handleResponse(res);
    });
};


// BOOKINGS admin
export const updateBooking = async (id, data) => {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

export const deleteBooking = async (id) => {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const deleteAllBookings = async (eventId=null) => {
    const url = new URL(`${API_BASE}/api/bookings`);
    if (eventId) url.searchParams.set("eventId", eventId);
    const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: authHeaders(),
    });
    return handleResponse(res);
};

// EVENTS bulk
export const deleteAllEvents = async (status=null) => {
    const url = new URL(`${API_BASE}/api/events`);
    if (status) url.searchParams.set("status", status);
    const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: authHeaders(),
    });
    return handleResponse(res);
};




/* =======================
   GALLERY
   ======================= */
export const fetchGallery = async () => {
    if (useMock) return mockFetchGallery();
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/gallery`);
        return handleResponse(res);
    });
};

export const uploadGalleryImage = async (src) => {
    if (useMock) return mockUploadGalleryImage(src);
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/gallery`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ src }),
        });
        return handleResponse(res);
    });
};

export const deleteGalleryImage = async (id) => {
    if (useMock) return mockDeleteGalleryImage(id);
    return withLoading(async () => {
        const res = await fetch(`${API_BASE}/api/gallery/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleResponse(res);
    });
};

/* =======================
   NEWSLETTER (Brevo)
   ======================= */
export async function subscribeNewsletter(
    email,
    { attributes = {}, consent = true, recaptchaToken = null, website = "" } = {}
) {
    if (useMock) return mockSubscribeNewsletter(email, { attributes, consent, recaptchaToken, website });

    const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, { // <-- FIX /api prefix
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, attributes, consent, recaptchaToken, website }),
    });
    const data = await handleResponse(res);
    if (!data?.ok) {
        const err = new Error(data?.error || "Subscription failed");
        err.response = { status: 400, data };
        throw err;
    }
    return data;
}

/* =======================
   UTIL (facoltativi)
   ======================= */
export const whoAmI = async () => {
    // utile per testare il bearer e ruoli (ritorna 401/403/200)
    const res = await fetch(`${API_BASE}/api/auth/whoami`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};
