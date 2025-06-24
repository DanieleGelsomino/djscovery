import {
  mockFetchEvents,
  mockSendBooking,
  mockFetchBookings,
  mockCreateEvent,
  mockDeleteEvent,
  mockFetchGallery,
  mockUploadGalleryImage,
  mockDeleteGalleryImage,
  mockSubscribeNewsletter,
} from "./mockApi";
import { withLoading } from "./loading";

const useMock = import.meta.env.VITE_MOCK !== "false";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const login = async (password) => {
  if (useMock) {
    if (password === (import.meta.env.VITE_ADMIN_PASSWORD || "admin"))
      return { success: true };
    throw new Error("Invalid password");
  }
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Invalid password");
    return res.json();
  });
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create event");
    return res.json();
  });
};

export const deleteEvent = async (id) => {
  if (useMock) return mockDeleteEvent(id);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/events/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete event");
    return res.json();
  });
};

export const fetchGallery = async () => {
  if (useMock) return mockFetchGallery();
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/gallery`);
    if (!res.ok) throw new Error("Failed to load gallery");
    return res.json();
  });
};

export const uploadGalleryImage = async (src) => {
  if (useMock) return mockUploadGalleryImage(src);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src }),
    });
    if (!res.ok) throw new Error("Failed to save image");
    return res.json();
  });
};

export const deleteGalleryImage = async (id) => {
  if (useMock) return mockDeleteGalleryImage(id);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/gallery/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete image");
    return res.json();
  });
};

export const subscribeNewsletter = async (email) => {
  if (useMock) return mockSubscribeNewsletter(email);
  return withLoading(async () => {
    const res = await fetch(`${API_BASE}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to subscribe");
    return res.json();
  });
};
