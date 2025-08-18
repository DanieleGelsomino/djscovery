import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getAuth } from "firebase-admin/auth";
import { db } from "./firebase.js";
import fetch from "node-fetch";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !allowedOrigins ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- AUTH ---
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    await getAuth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// --- EVENTI ---
app.get("/api/events", async (_req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error("❌ /api/events:", err.message);
    res.status(500).json({ error: "Failed to load events" });
  }
});

app.post("/api/events", authenticate, async (req, res) => {
  const { name, date } = req.body;
  if (!name || !date) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const docRef = await db.collection("events").add(req.body);
    res.json({ id: docRef.id });
  } catch (err) {
    console.error("❌ /api/events POST:", err.message);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.put("/api/events/:id", authenticate, async (req, res) => {
  try {
    await db.collection("events").doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ /api/events PUT:", err.message);
    res.status(500).json({ error: "Failed to update event" });
  }
});

app.delete("/api/events/:id", authenticate, async (req, res) => {
  try {
    await db.collection("events").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ /api/events DELETE:", err.message);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// --- PRENOTAZIONI ---
app.get("/api/bookings", async (_req, res) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error("❌ /api/bookings:", err.message);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

app.post("/api/bookings", async (req, res) => {
  const { nome, cognome, email, telefono, eventId } = req.body;
  if (!nome || !cognome || !email || !telefono) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const doc = await db.collection("bookings").add({
      nome,
      cognome,
      email,
      telefono,
      eventId,
      createdAt: new Date(),
    });

    if (eventId) {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        if (eventData.capacity) {
          const count = (
            await db
              .collection("bookings")
              .where("eventId", "==", eventId)
              .get()
          ).size;
          if (count >= eventData.capacity) {
            await db
              .collection("events")
              .doc(eventId)
              .update({ soldOut: true });
          }
        }
      }
    }

    res.json({ id: doc.id });
  } catch (err) {
    console.error("❌ /api/bookings POST:", err.message);
    res.status(500).json({ error: "Failed to save booking" });
  }
});

// --- GALLERY ---
app.get("/api/gallery", async (_req, res) => {
  try {
    const snapshot = await db
      .collection("gallery")
      .orderBy("createdAt", "desc")
      .get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gallery:", err.message);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

app.post("/api/gallery", authenticate, async (req, res) => {
  const { src } = req.body;
  if (!src) return res.status(400).json({ error: "Missing src" });

  try {
    const docRef = await db.collection("gallery").add({
      src,
      createdAt: new Date(),
    });
    res.json({ id: docRef.id });
  } catch (err) {
    console.error("❌ /api/gallery POST:", err.message);
    res.status(500).json({ error: "Failed to save image" });
  }
});

app.delete("/api/gallery/:id", authenticate, async (req, res) => {
  try {
    await db.collection("gallery").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ /api/gallery DELETE:", err.message);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// --- NEWSLETTER ---
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  if (!apiKey || !listId) {
    return res.status(500).json({ error: "Brevo not configured" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Brevo API error:", errorText);
      return res.status(500).json({ error: "Failed to subscribe" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Brevo exception:", err.message);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// --- AVVIO SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
