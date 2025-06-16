import express from 'express';
import cors from 'cors';
import { db } from './firebase.js';

const app = express();
app.use(cors());
app.use(express.json());

const events = [
  {
    id: 1,
    date: '2024-07-01',
    place: 'Roma',
    time: '21:00',
    price: 25,
    image: 'https://source.unsplash.com/400x300/?concert',
    description: "Serata di apertura dell'estate con DJ Alpha.",
  },
  {
    id: 2,
    date: '2024-08-15',
    place: 'Milano',
    time: '22:00',
    price: 30,
    image: 'https://source.unsplash.com/400x300/?party',
    description: 'Ferragosto in musica con i migliori DJ italiani.',
  },
  {
    id: 3,
    date: '2024-09-10',
    place: 'Napoli',
    time: '20:00',
    price: 20,
    image: 'https://source.unsplash.com/400x300/?dj',
    description: 'Chiusura della stagione estiva sul lungomare.',
  },
];

app.get('/api/events', (req, res) => {
  res.json(events);
});

app.post('/api/bookings', async (req, res) => {
  const { nome, cognome, email, telefono } = req.body;
  if (!nome || !cognome || !email || !telefono) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await db.collection('bookings').add({
      nome,
      cognome,
      email,
      telefono,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
