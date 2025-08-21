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

const useMock = import.meta.env.VITE_MOCK !== "false";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const fetchEvents = async () => {
  if (useMock) return mockFetchEvents();
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/events`);
    if (!res.ok) throw new Error("Failed to load events");
    return res.json();
  });
};

export const sendBooking = async (data) => {
  if (useMock) return mockSendBooking(data);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save booking");
    return res.json();
  });
};

export const fetchBookings = async () => {
  if (useMock) return mockFetchBookings();
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/bookings`);
    if (!res.ok) throw new Error("Failed to load bookings");
    return res.json();
  });
};

export const createEvent = async (data) => {
  if (useMock) return mockCreateEvent(data);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create event");
    return res.json();
  });
};

export const updateEvent = async (id, data) => {
  if (useMock) return mockUpdateEvent(id, data);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update event");
    return res.json();
  });
};

export const deleteEvent = async (id) => {
  if (useMock) return mockDeleteEvent(id);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/events/${id}`, {
      method: "DELETE",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!res.ok) throw new Error("Failed to delete event");
    return res.json();
  });
};


export async function subscribeNewsletter(email, {
    attributes = {},
    consent = true,
    recaptchaToken = null,
    website = ""  // honeypot (lasciare vuoto)
} = {}) {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, attributes, consent, recaptchaToken, website }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Subscription failed");
    }
    return data;
}

