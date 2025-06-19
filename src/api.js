export const fetchEvents = async () => {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
};

export const sendBooking = async (data) => {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save booking');
  return res.json();
};

export const fetchBookings = async () => {
  const res = await fetch('/api/bookings');
  if (!res.ok) throw new Error('Failed to load bookings');
  return res.json();
};

export const createEvent = async (data) => {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
};
