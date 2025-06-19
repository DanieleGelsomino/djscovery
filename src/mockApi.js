export let mockEvents = [
  {
    id: '1',
    place: 'Milano',
    date: '2024-05-10',
    time: '22:00',
    price: '20',
    image: '',
    description: 'Serata di prova'
  }
];

export let mockBookings = [
  {
    id: '1',
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario@example.com',
    telefono: '3331234567',
    quantity: 1
  }
];

const save = () => {
  localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
  localStorage.setItem('mockBookings', JSON.stringify(mockBookings));
};

export const loadMock = () => {
  const e = localStorage.getItem('mockEvents');
  if (e) mockEvents = JSON.parse(e);
  const b = localStorage.getItem('mockBookings');
  if (b) mockBookings = JSON.parse(b);
};

export const mockFetchEvents = async () => {
  loadMock();
  return mockEvents;
};

export const mockFetchBookings = async () => {
  loadMock();
  return mockBookings;
};

export const mockCreateEvent = async (data) => {
  loadMock();
  const newEvent = { id: Date.now().toString(), ...data };
  mockEvents.push(newEvent);
  save();
  return newEvent;
};

export const mockDeleteEvent = async (id) => {
  loadMock();
  mockEvents = mockEvents.filter((e) => e.id !== id);
  save();
  return { success: true };
};

export const mockSendBooking = async (data) => {
  loadMock();
  const newBooking = { id: Date.now().toString(), ...data };
  mockBookings.push(newBooking);
  save();
  return newBooking;
};
