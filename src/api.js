import {
  mockFetchEvents,
  mockSendBooking,
  mockFetchBookings,
  mockCreateEvent,
  mockDeleteEvent,
  mockFetchGallery,
  mockUploadGalleryImage,
  mockDeleteGalleryImage,
} from './mockApi';

const useMock = import.meta.env.VITE_MOCK !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const fetchEvents = async () => {
  if (useMock) return mockFetchEvents();
  const res = await fetch(`${API_BASE}/api/events`);
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
};

export const sendBooking = async (data) => {
  if (useMock) return mockSendBooking(data);
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save booking');
  return res.json();
};

export const fetchBookings = async () => {
  if (useMock) return mockFetchBookings();
  const res = await fetch(`${API_BASE}/api/bookings`);
  if (!res.ok) throw new Error('Failed to load bookings');
  return res.json();
};

export const createEvent = async (data) => {
  if (useMock) return mockCreateEvent(data);
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
};

export const deleteEvent = async (id) => {
  if (useMock) return mockDeleteEvent(id);
  const res = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event');
  return res.json();
};

export const fetchGallery = async () => {
  if (useMock) return mockFetchGallery();
  const res = await fetch(`${API_BASE}/api/gallery`);
  if (!res.ok) throw new Error('Failed to load gallery');
  return res.json();
};

export const uploadGalleryImage = async (src) => {
  if (useMock) return mockUploadGalleryImage(src);
  const res = await fetch(`${API_BASE}/api/gallery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src }),
  });
  if (!res.ok) throw new Error('Failed to save image');
  return res.json();
};

export const deleteGalleryImage = async (id) => {
  if (useMock) return mockDeleteGalleryImage(id);
  const res = await fetch(`${API_BASE}/api/gallery/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete image');
  return res.json();
};
