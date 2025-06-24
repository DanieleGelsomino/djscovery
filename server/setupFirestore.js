import { db } from './firebase.js';

async function setup() {
  const now = new Date();
  // Create sample event
  await db.collection('events').doc('sample').set({
    name: 'Sample Event',
    dj: 'DJ Test',
    date: '2025-01-01',
    place: 'Online',
    time: '00:00',
    price: '',
    image: '',
    description: 'Example document',
    capacity: 100,
    soldOut: false,
  });
  // Create sample booking
  await db.collection('bookings').doc('sample').set({
    nome: 'Example',
    cognome: 'User',
    email: 'example@example.com',
    telefono: '0000000000',
    eventId: 'sample',
    createdAt: now,
  });
  // Create sample gallery image
  await db.collection('gallery').doc('sample').set({
    src: 'https://example.com/image.jpg',
    createdAt: now,
  });
}

setup().then(() => {
  console.log('Firestore collections initialized');
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
