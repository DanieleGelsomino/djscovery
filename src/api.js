import {
  mockFetchEvents,
  mockSendBooking,
  mockFetchBookings,
  mockCreateEvent,
  mockDeleteEvent,
} from './mockApi';

const useMock = import.meta.env.VITE_MOCK !== 'false';

export const fetchEvents = async () => {
  if (useMock) return mockFetchEvents();
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
};

export const sendBooking = async (data) => {
  if (useMock) return mockSendBooking(data);
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save booking');
  return res.json();
};

export const fetchBookings = async () => {
  if (useMock) return mockFetchBookings();
  const res = await fetch('/api/bookings');
  if (!res.ok) throw new Error('Failed to load bookings');
  return res.json();
};

export const createEvent = async (data) => {
  if (useMock) return mockCreateEvent(data);
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
};

export const deleteEvent = async (id) => {
  if (useMock) return mockDeleteEvent(id);
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event');
  return res.json();
};
