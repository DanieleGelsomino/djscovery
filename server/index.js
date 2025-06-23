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
  const { name, dj, date, place, time, price, image, description } = req.body;
  if (!name || !dj || !date || !place || !time || !image) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const doc = await db.collection('events').add({
      name,
      dj,
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

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.collection('events').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
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

// Retrieve gallery images
app.get('/api/gallery', async (req, res) => {
  try {
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// Add an image to the gallery
app.post('/api/gallery', async (req, res) => {
  const { src } = req.body;
  if (!src) return res.status(400).json({ error: 'Missing src' });
  try {
    const doc = await db.collection('gallery').add({ src, createdAt: new Date() });
    res.json({ id: doc.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Delete an image from the gallery
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    await db.collection('gallery').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
