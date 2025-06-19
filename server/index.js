import express from 'express';
import cors from 'cors';
import { db } from './firebase.js';

const app = express();
app.use(cors());
app.use(express.json());

// Get events from Firestore
app.get('/api/events', async (req, res) => {
  try {
    const snapshot = await db.collection('events').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  const { date, place, time, price, image, description } = req.body;
  if (!date || !place || !time || !price || !image || !description) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const doc = await db.collection('events').add({
      date,
      place,
      time,
      price,
      image,
      description,
    });
    res.json({ id: doc.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
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

// Retrieve all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
