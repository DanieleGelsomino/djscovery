import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Saves booking details to the "bookings" collection
export const saveBooking = async ({ nome, cognome, email, telefono }) => {
  await addDoc(collection(db, 'bookings'), {
    nome,
    cognome,
    email,
    telefono,
    createdAt: Timestamp.now(),
  });
};
