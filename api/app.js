// api/app.js - Express app for Vercel Serverless Functions
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

// Lazy Firestore getter: evita di inizializzare Admin/Firestore per /api/health
let adminInited = false;
let cachedDb = null;
function getDb() {
  if (!adminInited) {
    try {
      admin.app();
      adminInited = true;
    } catch {
      // Try several ways to obtain the service account JSON:
      // 1) FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
      // 2) FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded JSON)
      // 3) FIREBASE_SERVICE_ACCOUNT (path to file)
      // 4) GOOGLE_APPLICATION_CREDENTIALS (path to file)
      let svc = null;
      const tryParse = (raw) => {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      };

      const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null;
      const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || null;
      const pathEnv =
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        null;

      if (rawJson) {
        svc = tryParse(rawJson);
        if (!svc) {
          const err = new Error("invalid_service_account_json");
          err.code = "invalid_service_account_json";
          throw err;
        }
      } else if (rawB64) {
        const decoded = Buffer.from(rawB64, "base64").toString("utf8");
        svc = tryParse(decoded);
        if (!svc) {
          const err = new Error("invalid_service_account_base64");
          err.code = "invalid_service_account_base64";
          throw err;
        }
      } else if (pathEnv) {
        try {
          if (fs.existsSync(pathEnv)) {
            const fileRaw = fs.readFileSync(pathEnv, "utf8");
            svc = tryParse(fileRaw);
            if (!svc) {
              const err = new Error("invalid_service_account_file");
              err.code = "invalid_service_account_file";
              throw err;
            }
          } else {
            // path not available; fallthrough to applicationDefault
            svc = null;
          }
        } catch (e) {
          const err = new Error("invalid_service_account_file");
          err.code = "invalid_service_account_file";
          throw err;
        }
      }

      try {
        const projectId =
          process.env.FIREBASE_PROJECT_ID ||
          (svc && svc.project_id) ||
          undefined;
        if (svc) {
          admin.initializeApp({
            credential: admin.credential.cert(svc),
            ...(projectId ? { projectId } : {}),
          });
        } else if (pathEnv) {
          // If a path env was provided (FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS)
          // but we couldn't parse it earlier, throw explicit error.
          throw new Error("invalid_service_account_file");
        } else {
          // No service account provided: fail fast with clear error to avoid long timeouts in serverless
          const err = new Error("missing_service_account");
          err.code = "missing_service_account";
          throw err;
        }
        adminInited = true;
        try {
          const db = admin.firestore();
          // Prefer REST transport on serverless (faster cold start than gRPC)
          db.settings({ preferRest: true });
          cachedDb = db;
        } catch {}
      } catch (e) {
        // Bubble up known errors
        if (
          e?.code === "invalid_service_account_json" ||
          e?.code === "invalid_service_account_file" ||
          e?.code === "invalid_service_account_base64" ||
          e?.code === "missing_service_account"
        ) {
          throw e;
        }
        const err = new Error("missing_service_account");
        err.code = "missing_service_account";
        throw err;
      }
    }
  }
  if (!cachedDb) {
    const db = admin.firestore();
    try {
      db.settings({ preferRest: true });
    } catch {}
    cachedDb = db;
  }
  return cachedDb;
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Simple request logger to diagnose invocations in serverless env
app.use((req, res, next) => {
  try {
    console.log(`[api] ${req.method} ${req.originalUrl} - ip=${req.ip}`);
  } catch (e) {}
  next();
});

// CORS: allow same-origin and common methods/headers (no wildcard path for Express 5)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-password"],
  })
);

// Basic hardening
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimit.ipKeyGenerator,
});
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimit.ipKeyGenerator,
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
// Simple auth diagnostic
app.get("/api/auth/whoami", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });
  res.json({
    ok: true,
    uid: user.uid,
    email: user.email || null,
    admin: !!user.admin,
  });
});

// Consolidated self-test endpoint
app.get("/api/self-test", async (req, res) => {
  const out = { ok: true, tests: {} };
  // Google APIs
  try {
    const key = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || "";
    out.tests.googleKey = { ok: !!key };
  } catch (e) {
    out.tests.googleKey = { ok: false, error: e?.message || String(e) };
  }
  // Firestore
  try {
    const db = getDb();
    const snap = await db.collection("events").limit(1).get();
    out.tests.firestore = { ok: true, eventsCountSample: snap.size };
  } catch (e) {
    out.tests.firestore = {
      ok: false,
      error: e?.code || e?.message || String(e),
    };
  }
  // Drive (if folder id provided via query)
  try {
    const folderId = String(req.query.folderId || "");
    if (folderId) {
      const base = "https://www.googleapis.com/drive/v3/files";
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
        fields: "files(id)",
        includeItemsFromAllDrives: "true",
        supportsAllDrives: "true",
        pageSize: "1",
        key: process.env.GOOGLE_API_KEY || "",
      });
      const r = await fetch(`${base}?${params.toString()}`);
      out.tests.drive = { ok: r.ok, status: r.status };
    }
  } catch (e) {
    out.tests.drive = { ok: false, error: e?.message || String(e) };
  }
  // SMTP
  try {
    const mailer = buildTransport();
    out.tests.smtp = { ok: !!mailer };
  } catch (e) {
    out.tests.smtp = { ok: false, error: e?.message || String(e) };
  }
  res.json(out);
});
// Minimal diagnostics for Firestore connectivity
app.get("/api/diag", async (_req, res) => {
  try {
    const db = getDb();
    const appInfo = admin.app().options || {};
    const evSnap = await db.collection("events").limit(1).get();
    const bkSnap = await db.collection("bookings").limit(1).get();
    res.json({
      ok: true,
      projectId: appInfo.projectId || process.env.FIREBASE_PROJECT_ID || null,
      eventsSample: evSnap.size,
      bookingsSample: bkSnap.size,
    });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: e?.code || e?.message || String(e) });
  }
});

// ===== Auth helpers (Firebase ID token) =====
async function getAuthUser(req) {
  try {
    const hdr = String(
      req.headers["authorization"] || req.headers["Authorization"] || ""
    );
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const user = await admin.auth().verifyIdToken(token, true);
    return user || null;
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  // 1) Try Firebase ID token
  const user = await getAuthUser(req);
  if (user?.admin) {
    req.user = user;
    return next();
  }

  // 2) Fallback: x-admin-password header (for emergency/CLI)
  try {
    const pass = String(req.headers["x-admin-password"] || "");
    const expected = process.env.ADMIN_PASSWORD || "";
    if (expected && pass && pass === expected) {
      req.user = { uid: "pwd-admin", admin: true };
      return next();
    }
  } catch {}

  // 3) Respond with proper auth error
  if (!user) return res.status(401).json({ error: "unauthorized" });
  return res.status(403).json({ error: "forbidden" });
}

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
      if (
        String(e?.message || "")
          .toLowerCase()
          .includes("index")
      ) {
        const snap = await ref.orderBy("date").get();
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) =>
          `${a.date || ""}T${a.time || "00:00"}`.localeCompare(
            `${b.date || ""}T${b.time || "00:00"}`
          )
        );
        return res.json(data);
      }
      // be resilient: return empty list instead of 500
      return res.json([]);
    }
  } catch (err) {
    const msg = err?.message || err;
    const code = err?.code || "internal";
    if (code === "missing_service_account")
      return res.status(500).json({ error: code });
    console.error("/api/events error:", msg);
    // fallback empty list to avoid client hangs
    return res.json([]);
  }
});

// Get single event by id (public)
app.get("/api/events/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    const snap = await db.collection("events").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });
    return res.json({ id: snap.id, ...snap.data() });
  } catch (e) {
    if (e?.code === "missing_service_account")
      return res.status(500).json({ error: e.code });
    return res.status(500).json({ error: "failed" });
  }
});

// Create event (admin)
app.post("/api/events", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const data = req.body || {};
    const doc = {
      name: String(data.name || "").trim(),
      dj: String(data.dj || "").trim(),
      date: String(data.date || "").trim(),
      time: String(data.time || "").trim(),
      price: data.price ?? "",
      capacity: Number(data.capacity || 0) || 0,
      description: String(data.description || ""),
      soldOut: !!data.soldOut,
      image: String(data.image || ""),
      place: String(data.place || ""),
      placeCoords: data.placeCoords || null,
      placeId: data.placeId || null,
      status: ["draft", "published", "archived"].includes(String(data.status))
        ? String(data.status)
        : "draft",
      bookingsCount: Number(data.bookingsCount || 0) || 0,
      internalNotes: String(data.internalNotes || ""),
      updatedAt: now(),
      createdAt: now(),
    };
    const ref = await db.collection("events").add(doc);
    res.json({ id: ref.id, ...doc });
  } catch (e) {
    res.status(500).json({ error: "create_failed" });
  }
});

// Update event (admin)
app.put("/api/events/:id", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    const data = { ...req.body, updatedAt: now() };
    await db.collection("events").doc(id).set(data, { merge: true });
    const snap = await db.collection("events").doc(id).get();
    res.json({ id, ...(snap.data() || {}) });
  } catch {
    res.status(500).json({ error: "update_failed" });
  }
});

// Delete single event (admin)
app.delete("/api/events/:id", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    await db.collection("events").doc(id).delete();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "delete_failed" });
  }
});

// Bulk delete events by status (admin)
app.delete("/api/events", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const status = String(req.query.status || "");
    let q = db.collection("events");
    if (status) q = q.where("status", "==", status);
    const snap = await q.get();
    const batch = db.bulkWriter ? null : db.batch();
    let count = 0;
    for (const doc of snap.docs) {
      if (db.bulkWriter) {
        await db.collection("events").doc(doc.id).delete();
      } else {
        batch.delete(db.collection("events").doc(doc.id));
      }
      count++;
    }
    if (batch) await batch.commit();
    res.json({ ok: true, deleted: count });
  } catch {
    res.status(500).json({ error: "bulk_delete_failed" });
  }
});

// Bookings (minimal)
app.get("/api/bookings", async (req, res) => {
  try {
    const db = getDb();
    const { eventId } = req.query || {};
    let ref = db.collection("bookings");
    if (eventId) ref = ref.where("eventId", "==", String(eventId));
    try {
      const snap = await ref.orderBy("createdAt", "desc").get();
      return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      if (
        String(e?.message || "")
          .toLowerCase()
          .includes("index")
      ) {
        const snap = await ref.get();
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const ca = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const cb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return cb - ca;
        });
        return res.json(data);
      }
      throw e;
    }
  } catch (e) {
    if (e?.code === "missing_service_account")
      return res.status(500).json({ error: e.code });
    console.error("/api/bookings error:", e?.message || e);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// removed duplicate minimal POST /api/bookings - enhanced handler defined later with email/token

// Update booking (admin)
app.put("/api/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    const data = { ...req.body, lastUpdateAt: now() };
    await db.collection("bookings").doc(id).set(data, { merge: true });
    const snap = await db.collection("bookings").doc(id).get();
    res.json({ id, ...(snap.data() || {}) });
  } catch {
    res.status(500).json({ error: "update_failed" });
  }
});

// Delete single booking (admin)
app.delete("/api/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    await db.collection("bookings").doc(id).delete();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "delete_failed" });
  }
});

// Bulk delete bookings (admin)
app.delete("/api/bookings", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const eventId = String(req.query.eventId || "");
    let q = db.collection("bookings");
    if (eventId) q = q.where("eventId", "==", eventId);
    const snap = await q.get();
    const batch = db.bulkWriter ? null : db.batch();
    let count = 0;
    for (const doc of snap.docs) {
      if (db.bulkWriter) {
        await db.collection("bookings").doc(doc.id).delete();
      } else {
        batch.delete(db.collection("bookings").doc(doc.id));
      }
      count++;
    }
    if (batch) await batch.commit();
    res.json({ ok: true, deleted: count });
  } catch {
    res.status(500).json({ error: "bulk_delete_failed" });
  }
});

// Gallery (Firestore-backed)
app.get("/api/gallery", async (_req, res) => {
  try {
    const db = getDb();
    const snap = await db
      .collection("gallery")
      .orderBy("createdAt", "desc")
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    if (e?.code === "missing_service_account")
      return res.status(500).json({ error: e.code });
    console.error("/api/gallery error:", e?.message || e);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

// Add gallery image (admin)
app.post("/api/gallery", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { src = "", title = "" } = req.body || {};
    if (!src) return res.status(400).json({ error: "missing_src" });
    const doc = {
      src: String(src),
      title: String(title || ""),
      createdAt: now(),
    };
    const ref = await db.collection("gallery").add(doc);
    res.json({ id: ref.id, ...doc });
  } catch {
    res.status(500).json({ error: "create_failed" });
  }
});

// Delete gallery image (admin)
app.delete("/api/gallery/:id", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "missing_id" });
    await db.collection("gallery").doc(id).delete();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "delete_failed" });
  }
});

// Newsletter + Contact stubs
app.post("/api/newsletter/subscribe", publicLimiter, async (_req, res) =>
  res.json({ ok: true })
);
app.post("/api/contact", publicLimiter, async (_req, res) =>
  res.json({ ok: true })
);

// Cookie consent log (best-effort)
app.post("/api/consents", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    const ua = String(req.headers["user-agent"] || "");
    const prefs = req.body?.prefs || {};
    await db.collection("consents").add({ prefs, ip, ua, createdAt: now() });
    res.json({ ok: true });
  } catch {
    // do not fail if db missing
    res.json({ ok: true });
  }
});

// YouTube/Spotify stubs
app.get("/api/youtube/latest", publicLimiter, async (_req, res) =>
  res.json({ items: [] })
);
app.get("/api/youtube/latest-rss", publicLimiter, async (_req, res) =>
  res.json({ items: [] })
);
app.get("/api/spotify/latest-playlist", publicLimiter, async (_req, res) =>
  res.json({ tracks: [] })
);

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
    const apiKey =
      process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey || !handle) return res.json({ ids: [] });

    // Resolve channelId by handle
    const chRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(
        handle
      )}&key=${apiKey}`
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
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(
      channelId
    )}`;
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
const getGoogleApiKey = () =>
  process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || "";

async function getServiceAccountToken() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    const svc = JSON.parse(raw);
    const clientEmail = svc.client_email;
    const privateKey = svc.private_key;
    const tokenUri = svc.token_uri || "https://oauth2.googleapis.com/token";
    if (!clientEmail || !privateKey) return null;

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      iat,
      exp: iat + 3600,
    };
    const header = { alg: "RS256", typ: "JWT" };
    const b64 = (o) =>
      Buffer.from(JSON.stringify(o))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    const h = b64(header);
    const p = b64(payload);
    const data = `${h}.${p}`;
    const signer = require("crypto").createSign("RSA-SHA256");
    signer.update(data);
    const sig = signer
      .sign(privateKey)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const assertion = `${data}.${sig}`;

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const r = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.access_token || null;
  } catch {
    return null;
  }
}

// List images in a Drive folder (supports shared drives)
app.get("/api/drive/list", publicLimiter, async (req, res) => {
  try {
    const folderId = String(req.query.folderId || "");
    if (!folderId) return res.json([]);

    const apiKey = getGoogleApiKey();
    const saToken = await getServiceAccountToken();

    const base = "https://www.googleapis.com/drive/v3/files";
    const common = {
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,shortcutDetails)",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
      pageSize: "200",
    };

    async function fetchAll(q) {
      const out = [];
      let pageToken;
      do {
        const params = new URLSearchParams({ ...common, q });
        if (!saToken && apiKey) params.set("key", apiKey);
        if (pageToken) params.set("pageToken", pageToken);
        const r = await fetchWithTimeout(
          `${base}?${params.toString()}`,
          saToken ? { headers: { Authorization: `Bearer ${saToken}` } } : {},
          15000
        );
        if (!r.ok) return out;
        const j = await r.json();
        (j.files || []).forEach((f) => out.push(f));
        pageToken = j.nextPageToken;
      } while (pageToken);
      return out;
    }

    const qImages = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    const qShort  = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.shortcut'`;

    const [filesImages, filesShortcuts] = await Promise.all([
      fetchAll(qImages),
      fetchAll(qShort),
    ]);
    const files = [...filesImages, ...filesShortcuts];

    const images = files
      .map((f) => {
        const isShortcut = f.mimeType === "application/vnd.google-apps.shortcut";
        const id = isShortcut ? f?.shortcutDetails?.targetId : f.id;
        const mt = isShortcut ? f?.shortcutDetails?.targetMimeType : f.mimeType;
        if (!id || !(String(mt || "").startsWith("image/"))) return null;
        return {
          id,
          name: f.name,
          mimeType: mt,
          modifiedTime: f.modifiedTime,
          thumbnail: f.thumbnailLink || null,
          src: `https://lh3.googleusercontent.com/d/${id}=w1280`,
          fallbackSrc: `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(apiKey)}`,
        };
      })
      .filter(Boolean);

    // de-dup per id
    const seen = new Set();
    const deduped = images.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
    res.json(deduped);
  } catch (e) {
    res.json([]);
  }
});

// Proxy a Drive file (useful for HEIC fallback)
app.get("/api/drive/file/:id", publicLimiter, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).send("missing");
    const apiKey = getGoogleApiKey();
    const sa = await getServiceAccountToken();

    // Prefer Service Account if available (works for private files shared with SA)
    const baseUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      id
    )}?alt=media`;
    let r = null;
    if (sa) {
      r = await fetchWithTimeout(
        baseUrl,
        { headers: { Authorization: `Bearer ${sa}` } },
        15000
      );
    } else if (apiKey) {
      r = await fetchWithTimeout(
        `${baseUrl}&key=${encodeURIComponent(apiKey)}`,
        {},
        15000
      );
    } else {
      return res.status(500).send("no_credentials");
    }

    if (!r.ok) {
      // Fallback: if first try failed, try the other method once
      if (sa && apiKey) {
        const r2 = await fetchWithTimeout(
          `${baseUrl}&key=${encodeURIComponent(apiKey)}`,
          {},
          15000
        );
        if (!r2.ok) return res.status(r2.status).send("error");
        r = r2;
      } else if (!sa) {
        const sa2 = await getServiceAccountToken();
        if (sa2) {
          const r3 = await fetchWithTimeout(
            baseUrl,
            { headers: { Authorization: `Bearer ${sa2}` } },
            15000
          );
          if (!r3.ok) return res.status(r3.status).send("error");
          r = r3;
        } else {
          return res.status(r.status).send("error");
        }
      } else {
        return res.status(r.status).send("error");
      }
    }
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

// Global error handler: return JSON for unexpected errors (avoids HTML responses)
// Note: placed after module.exports so it is defined but will be included when file is loaded
app.use((err, req, res, _next) => {
  try {
    console.error("[api][error]", err && (err.stack || err.message || err));
  } catch (e) {}
  if (res.headersSent) return;
  res
    .status(500)
    .json({ ok: false, error: String(err?.message || err || "internal") });
});

/* ===================== EMAIL / QR / VERIFY / CHECK-IN ===================== */

// Mail transporter (configure via Vercel env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL)
function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const secure = port === 465; // TLS on 465
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function apiBaseUrl(req) {
  return (
    (process.env.API_BASE_URL &&
      process.env.API_BASE_URL.replace(/\/+$/, "")) ||
    `https://${req.headers["x-forwarded-host"] || req.headers.host}`
  );
}

function signBookingToken(payload) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.sign(payload, secret, { expiresIn: "180d" });
}

function verifyBookingToken(token) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.verify(token, secret);
}

// Enhance existing booking endpoint: send confirmation mail with QR
// We redefine handler to keep previous logic and append email+token
app.post("/api/bookings", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const {
      eventId,
      quantity = 1,
      nome,
      cognome,
      email,
      telefono,
    } = req.body || {};
    if (!eventId || !email)
      return res.status(400).json({ error: "missing_fields" });
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
        eventId: String(eventId),
        quantity: qty,
        nome,
        cognome,
        email,
        telefono,
        createdAt: now(),
        status: "pending",
      };
      t.set(bkRef, payload);

      const newCount = current + qty;
      const newSoldOut = cap > 0 && newCount >= cap;
      t.update(evRef, {
        bookingsCount: newCount,
        soldOut: newSoldOut ? true : !!ev.soldOut,
        updatedAt: now(),
      });
      return {
        id: bkRef.id,
        event: { id: evRef.id, ...ev },
        newCount,
        newSoldOut,
      };
    });

    // create token and send mail
    const token = signBookingToken({ bid: result.id, eid: eventId, qty });
    const verifyURL = `${apiBaseUrl(
      req
    )}/api/bookings/verify?token=${encodeURIComponent(token)}`;
    let sent = false;
    try {
      const mailer = buildTransport();
      if (mailer) {
        const qrDataURL = await QRCode.toDataURL(verifyURL, {
          errorCorrectionLevel: "M",
        });
        const qrBase64 = qrDataURL.split(",")[1];
        await mailer.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: `Conferma Prenotazione — ${result.event?.name || "Evento"}`,
          html: `<div style="font-family:sans-serif">Ciao ${nome || ""} ${
            cognome || ""
          },<br/>prenotazione registrata per <b>${
            result.event?.name || "Evento"
          }</b>.<br/>Biglietti: <b>${qty}</b><br/><a href="${verifyURL}">Apri verifica</a><br/><br/><img src="cid:qrimage" width="180" height="180"/></div>`,
          attachments: [
            {
              filename: "qrcode.png",
              content: Buffer.from(qrBase64, "base64"),
              cid: "qrimage",
              contentType: "image/png",
            },
          ],
        });
        sent = true;
      }
    } catch (e) {
      // do not fail booking if email fails
    }

    await db
      .collection("bookings")
      .doc(result.id)
      .set(
        {
          token,
          status: sent ? "sent" : "pending_email",
          emailSentAt: sent ? now() : null,
          lastUpdateAt: now(),
        },
        { merge: true }
      );

    res.json({
      id: result.id,
      bookingsCount: result.newCount,
      soldOut: result.newSoldOut,
    });
  } catch (e) {
    const code = e?.message;
    if (code === "event_not_found")
      return res.status(404).json({ error: code });
    if (code === "event_not_published")
      return res.status(409).json({ error: code });
    if (code === "capacity_exceeded" || code === "sold_out")
      return res.status(409).json({ error: code });
    res.status(500).json({ error: "Failed to save booking" });
  }
});

// Verify booking by token
app.get("/api/bookings/verify", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const token = String(req.query.token || "");
    if (!token)
      return res.status(400).json({ ok: false, error: "missing_token" });
    const decoded = verifyBookingToken(token);
    const { bid, eid } = decoded || {};
    const ref = db.collection("bookings").doc(String(bid));
    const snap = await ref.get();
    if (!snap.exists)
      return res.status(404).json({ ok: false, error: "not_found" });
    const b = snap.data() || {};
    // token mismatch protection if stored
    if (b.token && b.token !== token)
      return res.status(400).json({ ok: false, error: "token_mismatch" });
    const quantity = Number(b.quantity || 1);
    const checkedInCount = Number(b.checkedInCount || 0);
    const remaining = Math.max(quantity - checkedInCount, 0);
    return res.json({
      ok: true,
      bookingId: bid,
      eventId: eid,
      quantity,
      checkedInCount,
      remaining,
      nome: b.nome,
      cognome: b.cognome,
      email: b.email,
      telefono: b.telefono,
      status: b.status,
    });
  } catch (e) {
    if (e?.name === "TokenExpiredError")
      return res.status(401).json({ ok: false, error: "expired" });
    return res.status(400).json({ ok: false, error: "invalid" });
  }
});

// Check-in by token (increment)
app.post("/api/bookings/checkin", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const { token, count = 1 } = req.body || {};
    if (!token)
      return res.status(400).json({ ok: false, error: "missing_token" });
    const n = Math.max(1, parseInt(count, 10) || 1);
    const decoded = verifyBookingToken(String(token));
    const { bid } = decoded || {};
    const result = await db.runTransaction(async (t) => {
      const ref = db.collection("bookings").doc(String(bid));
      const snap = await t.get(ref);
      if (!snap.exists) throw new Error("not_found");
      const b = snap.data();
      if (b.token && b.token !== token) throw new Error("token_mismatch");
      const quantity = Number(b.quantity || 1);
      const checkedInCount = Number(b.checkedInCount || 0);
      const remaining = Math.max(quantity - checkedInCount, 0);
      if (remaining <= 0) throw new Error("already_fully_checked_in");
      if (n > remaining) {
        const err = new Error("exceeds_quantity");
        err.remaining = remaining;
        throw err;
      }
      const newCount = checkedInCount + n;
      t.update(ref, { checkedInCount: newCount, lastCheckInAt: now() });
      return { quantity, newCount };
    });
    const remaining = Math.max(result.quantity - result.newCount, 0);
    res.json({
      ok: true,
      quantity: result.quantity,
      checkedInCount: result.newCount,
      remaining,
    });
  } catch (e) {
    const code = e?.message;
    if (code === "not_found")
      return res.status(404).json({ ok: false, error: code });
    if (code === "token_mismatch")
      return res.status(400).json({ ok: false, error: code });
    if (code === "already_fully_checked_in")
      return res.status(409).json({ ok: false, error: code });
    if (code === "exceeds_quantity")
      return res
        .status(409)
        .json({ ok: false, error: code, remaining: e?.remaining ?? 0 });
    if (e?.name === "TokenExpiredError")
      return res.status(401).json({ ok: false, error: "expired" });
    return res.status(400).json({ ok: false, error: "invalid" });
  }
});

// Undo last check-in (decrement)
app.post("/api/bookings/checkin/undo", publicLimiter, async (req, res) => {
  try {
    const db = getDb();
    const { token, count = 1 } = req.body || {};
    if (!token)
      return res.status(400).json({ ok: false, error: "missing_token" });
    const n = Math.max(1, parseInt(count, 10) || 1);
    const decoded = verifyBookingToken(String(token));
    const { bid } = decoded || {};
    const result = await db.runTransaction(async (t) => {
      const ref = db.collection("bookings").doc(String(bid));
      const snap = await t.get(ref);
      if (!snap.exists) throw new Error("not_found");
      const b = snap.data();
      if (b.token && b.token !== token) throw new Error("token_mismatch");
      const checkedInCount = Number(b.checkedInCount || 0);
      if (checkedInCount <= 0) throw new Error("nothing_to_undo");
      const dec = Math.min(n, checkedInCount);
      const newCount = checkedInCount - dec;
      t.update(ref, { checkedInCount: newCount, lastUndoAt: now() });
      const quantity = Number(b.quantity || 1);
      return { quantity, newCount };
    });
    const remaining = Math.max(result.quantity - result.newCount, 0);
    res.json({
      ok: true,
      quantity: result.quantity,
      checkedInCount: result.newCount,
      remaining,
    });
  } catch (e) {
    const code = e?.message;
    if (code === "not_found")
      return res.status(404).json({ ok: false, error: code });
    if (code === "token_mismatch")
      return res.status(400).json({ ok: false, error: code });
    if (code === "nothing_to_undo")
      return res.status(409).json({ ok: false, error: code });
    if (e?.name === "TokenExpiredError")
      return res.status(401).json({ ok: false, error: "expired" });
    return res.status(400).json({ ok: false, error: "invalid" });
  }
});
