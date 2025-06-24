import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./firebase.js";

const app = express();
app.use(cors());
app.use(express.json());

// Simple admin login
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  const expected = process.env.ADMIN_PASSWORD || "admin";
  if (password === expected) return res.json({ success: true });
  res.status(401).json({ error: "Unauthorized" });
});

// Get all events
app.get("/api/events", async (_req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// Get single event
app.get("/api/events/:id", async (req, res) => {
  try {
    const doc = await db.collection("events").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load event" });
  }
});

// Create a new event
app.post("/api/events", async (req, res) => {
  const { name, dj, date, place, time, price, image, description } = req.body;
  if (!name || !dj || !date || !place || !time || !image) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const doc = await db.collection("events").add({
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
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update an event
app.put("/api/events/:id", async (req, res) => {
  const { name, dj, date, place, time, price, image, description } = req.body;
  try {
    await db.collection("events").doc(req.params.id).update({
      name,
      dj,
      date,
      place,
      time,
      price,
      image,
      description,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete an event
app.delete("/api/events/:id", async (req, res) => {
  try {
    await db.collection("events").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.post("/api/bookings", async (req, res) => {
  const { nome, cognome, email, telefono } = req.body;
  if (!nome || !cognome || !email || !telefono) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    await db.collection("bookings").add({
      nome,
      cognome,
      email,
      telefono,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save booking" });
  }
});

// Retrieve all bookings
app.get("/api/bookings", async (_req, res) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// Retrieve gallery images
app.get("/api/gallery", async (req, res) => {
  try {
    const snapshot = await db
      .collection("gallery")
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

// Add an image to the gallery
app.post("/api/gallery", async (req, res) => {
  const { src } = req.body;
  if (!src) return res.status(400).json({ error: "Missing src" });
  try {
    const doc = await db
      .collection("gallery")
      .add({ src, createdAt: new Date() });
    res.json({ id: doc.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save image" });
  }
});

// Delete an image from the gallery
app.delete("/api/gallery/:id", async (req, res) => {
  try {
    await db.collection("gallery").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Get a single booking
app.get("/api/bookings/:id", async (req, res) => {
  try {
    const doc = await db.collection("bookings").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load booking" });
  }
});

// Delete a booking
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    await db.collection("bookings").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// Subscribe to newsletter via Brevo
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!apiKey || !listId) {
    return res.status(500).json({ error: "Brevo not configured" });
  }

  try {
    const resp = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [Number(listId)],
        updateEnabled: true,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Brevo error:", text);
      return res.status(500).json({ error: "Failed to subscribe" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
