import { v4 as uuid } from 'uuid';

export let mockEvents = [
  {
    id: '1',
    name: 'Wan Seend',
    dj: 'DJ Alpha',
    place: 'Roma',
    date: '2027-05-10',
    time: '21:00',
    price: '15',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '2',
    name: 'Night Beats',
    dj: 'DJ Beta',
    place: 'Milano',
    date: '2027-06-15',
    time: '22:30',
    price: '18',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '3',
    name: 'Electro Wave',
    dj: 'DJ Gamma',
    place: 'Torino',
    date: '2027-07-20',
    time: '20:00',
    price: '20',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '4',
    name: 'Bass Trip',
    dj: 'DJ Delta',
    place: 'Bologna',
    date: '2027-08-05',
    time: '23:00',
    price: '22',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '5',
    name: 'Sunset Vibes',
    dj: 'DJ Epsilon',
    place: 'Napoli',
    date: '2027-09-12',
    time: '19:00',
    price: '17',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '6',
    name: 'Moonlight Jam',
    dj: 'DJ Zeta',
    place: 'Firenze',
    date: '2027-10-03',
    time: '21:30',
    price: '19',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '7',
    name: 'Groove Town',
    dj: 'DJ Eta',
    place: 'Genova',
    date: '2027-11-18',
    time: '22:00',
    price: '16',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '8',
    name: 'Rave City',
    dj: 'DJ Theta',
    place: 'Verona',
    date: '2027-12-09',
    time: '20:30',
    price: '21',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    id: '9',
    name: 'Electro Fest',
    dj: 'DJ Iota',
    place: 'Bari',
    date: '2028-01-14',
    time: '22:00',
    price: '24',
    image: '',
    description: 'Lorem ipsum dolor sit amet.'
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
  const newEvent = { id: uuid(), ...data };
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
  const newBooking = { id: uuid(), ...data };
  mockBookings.push(newBooking);
  save();
  return newBooking;
};
