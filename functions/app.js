// functions/app.js (CommonJS)
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const admin = require("firebase-admin");

// Initialize Admin SDK once in Functions environment
try {
  admin.app();
} catch {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS: with Firebase Hosting rewrites we are same-origin, but allow fallback
app.use(cors({ origin: true }));
app.options("*", cors({ origin: true }));

app.use(
  helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })
);

// Public and global rate limiters
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 400 });
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const now = () => new Date();
const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj?.[k]]).filter(([,v]) => v !== undefined));

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.json({ ok: true, service: "functions-api" }));

/* ===== EVENTS (minimal) ===== */
app.get("/api/events", async (req, res) => {
  const { status } = req.query || {};
  try {
    let ref = db.collection("events");
    if (status && ["draft","published","archived"].includes(String(status))) {
      ref = ref.where("status","==", status);
    }
    // Try with composite, fallback to single order
    try {
      const snap = await ref.orderBy("date").orderBy("time").get();
      return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("index")) {
        const snap = await ref.orderBy("date").get();
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => `${a.date||""}T${a.time||"00:00"}`.localeCompare(`${b.date||""}T${b.time||"00:00"}`));
        return res.json(data);
      }
      throw e;
    }
  } catch (err) {
    console.error("/api/events error:", err?.message || err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

/* ===== BOOKINGS (minimal) ===== */
app.get("/api/bookings", async (req, res) => {
  try {
    const { eventId } = req.query || {};
    let ref = db.collection("bookings").orderBy("createdAt", "desc");
    if (eventId) ref = ref.where("eventId","==", String(eventId));
    const snap = await ref.get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error("/api/bookings error:", e?.message || e);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// body: { eventId, nome, cognome, email, telefono, quantity }
app.post("/api/bookings", publicLimiter, async (req, res) => {
  try {
    const { eventId, quantity = 1, ...rest } = req.body || {};
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
      const payload = {
        ...pick(rest, ["nome","cognome","email","telefono"]),
        eventId: String(eventId),
        quantity: qty,
        createdAt: now(),
        status: "sent", // minimal flow, email skip
      };
      t.set(bkRef, payload);

      const newCount = current + qty;
      const newSoldOut = cap > 0 && newCount >= cap;
      t.update(evRef, { bookingsCount: newCount, soldOut: newSoldOut ? true : !!ev.soldOut, updatedAt: now() });

      return { id: bkRef.id, newCount, newSoldOut };
    });

    res.json({ id: result.id, bookingsCount: result.newCount, soldOut: result.newSoldOut });
  } catch (e) {
    const code = e?.message;
    if (code === "event_not_found") return res.status(404).json({ error: code });
    if (code === "event_not_published") return res.status(409).json({ error: code });
    if (code === "capacity_exceeded" || code === "sold_out") return res.status(409).json({ error: code });
    console.error("/api/bookings POST:", e?.message || e);
    res.status(500).json({ error: "Failed to save booking" });
  }
});

/* ===== GALLERY (Firestore-backed) ===== */
app.get("/api/gallery", async (_req, res) => {
  try {
    const snap = await db.collection("gallery").orderBy("createdAt", "desc").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error("/api/gallery error:", e?.message || e);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

/* ===== Newsletter + Contact (stubs, return ok) ===== */
app.post("/api/newsletter/subscribe", publicLimiter, async (_req, res) => {
  res.json({ ok: true, mode: "single_opt_in" });
});

app.post("/api/contact", publicLimiter, async (_req, res) => res.json({ ok: true }));

/* ===== YouTube/Spotify minimal stubs to avoid frontend errors ===== */
app.get("/api/youtube/latest", publicLimiter, async (_req, res) => res.json({ items: [] }));
app.get("/api/youtube/latest-rss", publicLimiter, async (_req, res) => res.json({ items: [] }));
app.get("/api/spotify/latest-playlist", publicLimiter, async (_req, res) => res.json({ tracks: [] }));

module.exports = { app };
