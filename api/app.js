// api/app.js - Express app for Vercel Serverless Functions
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");

// Lazy Firestore getter: evita di inizializzare Admin/Firestore per /api/health
let adminInited = false;
let cachedDb = null;
function getDb() {
  if (!adminInited) {
    try {
      admin.app();
      adminInited = true;
    } catch {
      const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!jsonStr) {
        const err = new Error("missing_service_account");
        err.code = "missing_service_account";
        throw err;
      }
      let svc;
      try {
        svc = JSON.parse(jsonStr);
      } catch (e) {
        const err = new Error("invalid_service_account_json");
        err.code = "invalid_service_account_json";
        throw err;
      }
      admin.initializeApp({ credential: admin.credential.cert(svc), projectId: svc.project_id });
      adminInited = true;
      try {
        const db = admin.firestore();
        // Prefer REST transport on serverless (faster cold start than gRPC)
        db.settings({ preferRest: true });
        cachedDb = db;
      } catch {}
    }
  }
  if (!cachedDb) {
    const db = admin.firestore();
    try { db.settings({ preferRest: true }); } catch {}
    cachedDb = db;
  }
  return cachedDb;
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS: allow same-origin and common methods/headers (no wildcard path for Express 5)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Basic hardening
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Rate limit
const clientIp = (req) =>
  (req.headers["x-forwarded-for"]?.split(",")[0].trim()) ||
  req.headers["x-real-ip"] ||
  req.socket?.remoteAddress ||
  req.ip ||
  "unknown";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
});
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
});
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const now = () => new Date();

// Health endpoints
app.get("/", (_req, res) => res.json({ ok: true, service: "vercel-api" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
// Minimal diagnostics for Firestore connectivity
app.get("/api/diag", async (_req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection("events").limit(1).get();
    res.json({ ok: true, projectId: process.env.GOOGLE_CLOUD_PROJECT || null, eventsCountSample: snap.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.code || e?.message || String(e) });
  }
});

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

/* ===== YouTube helpers ===== */
const fetchWithTimeout = async (url, opts = {}, ms = 8000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    return r;
  } finally {
    clearTimeout(id);
  }
};

// GET /api/youtube/latest?handle=@name&max=4
app.get("/api/youtube/latest", publicLimiter, async (req, res) => {
  try {
    const handle = String(req.query.handle || "");
    const max = Math.max(1, Math.min(10, parseInt(req.query.max, 10) || 4));
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey || !handle) return res.json({ ids: [] });

    // Resolve channelId by handle
    const chRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`
    );
    if (!chRes.ok) return res.json({ ids: [] });
    const chJson = await chRes.json();
    const channelId = chJson?.items?.[0]?.id;
    if (!channelId) return res.json({ ids: [] });

    const listRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${max}`
    );
    if (!listRes.ok) return res.json({ ids: [] });
    const listJson = await listRes.json();
    const ids = (listJson?.items || [])
      .filter((it) => it?.id?.videoId)
      .map((it) => it.id.videoId);
    res.json({ ids });
  } catch (e) {
    res.json({ ids: [] });
  }
});

// GET /api/youtube/latest-rss?channelId=UC...&max=4
app.get("/api/youtube/latest-rss", publicLimiter, async (req, res) => {
  try {
    const channelId = String(req.query.channelId || "");
    const max = Math.max(1, Math.min(10, parseInt(req.query.max, 10) || 4));
    if (!channelId) return res.json({ ids: [] });
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const r = await fetchWithTimeout(rssUrl, {}, 8000);
    if (!r.ok) return res.json({ ids: [] });
    const text = await r.text();
    // Extract <yt:videoId>VIDEO</yt:videoId>
    const ids = Array.from(text.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g))
      .map((m) => m[1])
      .slice(0, max);
    res.json({ ids });
  } catch (e) {
    res.json({ ids: [] });
  }
});

/* ===== Google Drive endpoints (for Admin picker) ===== */
const getGoogleApiKey = () => process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || "";

// List images in a Drive folder (supports shared drives)
app.get("/api/drive/list", publicLimiter, async (req, res) => {
  try {
    const folderId = String(req.query.folderId || "");
    const apiKey = getGoogleApiKey();
    if (!folderId || !apiKey) return res.json([]);
    const base = "https://www.googleapis.com/drive/v3/files";
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime,thumbnailLink)",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
      pageSize: "200",
      key: apiKey,
    });
    const r = await fetchWithTimeout(`${base}?${params.toString()}`, {}, 10000);
    if (!r.ok) return res.json([]);
    const j = await r.json();
    const files = Array.isArray(j?.files) ? j.files : [];
    const images = files
      .filter((f) => String(f?.mimeType || "").startsWith("image/") || f?.mimeType === "application/vnd.google-apps.shortcut")
      .map((f) => {
        const id = f.id;
        return {
          id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          thumbnail: f.thumbnailLink || null,
          src: `https://lh3.googleusercontent.com/d/${id}=w1280`,
          fallbackSrc: `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(apiKey)}`,
        };
      });
    res.json(images);
  } catch (e) {
    res.json([]);
  }
});

// Proxy a Drive file (useful for HEIC fallback)
app.get("/api/drive/file/:id", publicLimiter, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const apiKey = getGoogleApiKey();
    if (!id || !apiKey) return res.status(400).send("missing");
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(apiKey)}`;
    const r = await fetchWithTimeout(url, {}, 15000);
    if (!r.ok) return res.status(r.status).send("error");
    // Pipe headers and body
    for (const [k, v] of r.headers) {
      if (k.toLowerCase().startsWith("content-")) res.setHeader(k, v);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(500).send("error");
  }
});

module.exports = app;
