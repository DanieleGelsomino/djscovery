// api/app.js - Express app for Vercel Serverless Functions
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");

// Lazy Firestore getter: evita di inizializzare Admin/Firestore per /api/health
let adminInited = false;
function getDb() {
  if (!adminInited) {
    try { admin.app(); adminInited = true; } catch {
      const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!jsonStr) {
        const err = new Error("missing_service_account");
        err.code = "missing_service_account";
        throw err;
      }
      const svc = JSON.parse(jsonStr);
      admin.initializeApp({ credential: admin.credential.cert(svc), projectId: svc.project_id });
      adminInited = true;
    }
  }
  return admin.firestore();
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS: allow same-origin and preflight
app.use(cors({ origin: true }));
app.options("*", cors({ origin: true }));

// Basic hardening
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Rate limit
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 400 });
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const now = () => new Date();

// Health endpoints
app.get("/", (_req, res) => res.json({ ok: true, service: "vercel-api" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Events (minimal)
app.get("/api/events", async (req, res) => {
  const { status } = req.query || {};
  try {
    const db = getDb();
    let ref = db.collection("events");
    if (status && ["draft", "published", "archived"].includes(String(status))) {
      ref = ref.where("status", "==", String(status));
    }
    try {
      const snap = await ref.orderBy("date").orderBy("time").get();
      return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      if (String(e?.message || "").toLowerCase().includes("index")) {
        const snap = await ref.orderBy("date").get();
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => `${a.date || ""}T${a.time || "00:00"}`.localeCompare(`${b.date || ""}T${b.time || "00:00"}`));
        return res.json(data);
      }
      throw e;
    }
  } catch (err) {
    const msg = err?.message || err;
    const code = err?.code || "internal";
    if (code === "missing_service_account") return res.status(500).json({ error: code });
    console.error("/api/events error:", msg);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// Bookings (minimal)
app.get("/api/bookings", async (req, res) => {
  try {
    const db = getDb();
    const { eventId } = req.query || {};
    let ref = db.collection("bookings").orderBy("createdAt", "desc");
    if (eventId) ref = ref.where("eventId", "==", String(eventId));
    const snap = await ref.get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    if (e?.code === "missing_service_account") return res.status(500).json({ error: e.code });
    console.error("/api/bookings error:", e?.message || e);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

app.post("/api/bookings", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const { eventId, quantity = 1, nome, cognome, email, telefono } = req.body || {};
    if (!eventId) return res.status(400).json({ error: "missing_eventId" });
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const result = await db.runTransaction(async (t) => {
      const evRef = db.collection("events").doc(String(eventId));
      const evSnap = await t.get(evRef);
      if (!evSnap.exists) throw new Error("event_not_found");
      const ev = evSnap.data();
      if (ev.status !== "published") throw new Error("event_not_published");
      const cap = Number(ev.capacity || 0) || 0;
      const current = Number(ev.bookingsCount || 0) || 0;
      if (ev.soldOut) throw new Error("sold_out");
      if (cap > 0 && current + qty > cap) throw new Error("capacity_exceeded");

      const bkRef = db.collection("bookings").doc();
      t.set(bkRef, { eventId: String(eventId), quantity: qty, nome, cognome, email, telefono, createdAt: now(), status: "sent" });

      const newCount = current + qty;
      const newSoldOut = cap > 0 && newCount >= cap;
      t.update(evRef, { bookingsCount: newCount, soldOut: newSoldOut ? true : !!ev.soldOut, updatedAt: now() });
      return { id: bkRef.id, newCount, newSoldOut };
    });
    res.json({ id: result.id, bookingsCount: result.newCount, soldOut: result.newSoldOut });
  } catch (e) {
    const code = e?.message;
    if (e?.code === "missing_service_account") return res.status(500).json({ error: e.code });
    if (code === "event_not_found") return res.status(404).json({ error: code });
    if (code === "event_not_published") return res.status(409).json({ error: code });
    if (code === "capacity_exceeded" || code === "sold_out") return res.status(409).json({ error: code });
    console.error("/api/bookings POST:", e?.message || e);
    res.status(500).json({ error: "Failed to save booking" });
  }
});

// Gallery (Firestore-backed)
app.get("/api/gallery", async (_req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection("gallery").orderBy("createdAt", "desc").get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    if (e?.code === "missing_service_account") return res.status(500).json({ error: e.code });
    console.error("/api/gallery error:", e?.message || e);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

// Newsletter + Contact stubs
app.post("/api/newsletter/subscribe", publicLimiter, async (_req, res) => res.json({ ok: true }));
app.post("/api/contact", publicLimiter, async (_req, res) => res.json({ ok: true }));

// YouTube/Spotify stubs
app.get("/api/youtube/latest", publicLimiter, async (_req, res) => res.json({ items: [] }));
app.get("/api/youtube/latest-rss", publicLimiter, async (_req, res) => res.json({ items: [] }));
app.get("/api/spotify/latest-playlist", publicLimiter, async (_req, res) => res.json({ tracks: [] }));

module.exports = app;
