// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getAuth } from "firebase-admin/auth";
import { db } from "./firebase.js";
import fetch from "node-fetch";
import { z } from "zod";

// Email + QR + JWT
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

/* ----------------- Fail-fast env ----------------- */
if (!process.env.JWT_SECRET) {
    console.error("❌ Manca JWT_SECRET nell'ambiente (.env del server)");
    process.exit(1);
}

/* ----------------- App base ----------------- */
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // consenti Postman / SSR (no Origin) e, se non configurato, permetti tutti
        if (!origin) return cb(null, true);
        if (!allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET","HEAD","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// ⬇️ fondamentale per preflight di PUT/DELETE
app.options("*", cors(corsOptions));

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
    })
);
const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ----------------- Utils ----------------- */
const now = () => new Date();

const pick = (obj, keys) =>
    Object.fromEntries(keys.map((k) => [k, obj?.[k]]).filter(([, v]) => v !== undefined));

const toCSV = (rows) => {
    if (!rows?.length) return "id\n";
    const headers = Array.from(
        rows.reduce((set, r) => {
            Object.keys(r).forEach((k) => set.add(k));
            return set;
        }, new Set())
    );
    const esc = (v) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")].concat(rows.map((r) => headers.map((h) => esc(r[h])).join(",")));
    return lines.join("\n");
};

/* ----------------- Mailer & helpers ----------------- */
const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL,
    API_BASE_URL, JWT_SECRET,
} = process.env;

const mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    logger: true,   // utile in debug; togli se non ti serve
    debug: true,    // utile in debug; togli se non ti serve
});

mailer.verify((err) => {
    if (err) console.error("❌ SMTP verify failed:", err.message);
    else console.log("✅ SMTP ready");
});

function bookingEmailHTML({ nome, cognome, eventName, quantity, verifyURL }) {
    return `
  <div style="font-family: Arial, sans-serif; color:#222">
    <h2>Conferma Prenotazione — ${eventName}</h2>
    <p>Ciao ${nome} ${cognome},</p>
    <p>La tua prenotazione è stata registrata.</p>
    <ul>
      <li><strong>Evento:</strong> ${eventName}</li>
      <li><strong>Biglietti:</strong> ${quantity}</li>
    </ul>
    <p>Mostra questo QR all'ingresso:</p>
    <img src="cid:qrimage" alt="QR Prenotazione" style="max-width:240px; width:100%;"/>
    <p style="margin-top:16px; font-size:12px; color:#666">
      Se il QR non si visualizza correttamente, puoi usare questo link:<br/>
      <a href="${verifyURL}" style="word-break:break-all;">${verifyURL}</a>
    </p>
  </div>`;
}

/* ----------------- Auth & RBAC ----------------- */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        const decoded = await getAuth().verifyIdToken(token);

        const rolesSet = new Set();
        if (Array.isArray(decoded.roles)) decoded.roles.forEach((r) => rolesSet.add(String(r)));
        if (decoded.role) rolesSet.add(String(decoded.role));
        if (decoded.admin) rolesSet.add("admin");
        if (decoded.editor) rolesSet.add("editor");
        if (decoded.staff) rolesSet.add("staff");

        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
            .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (decoded.email && ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
            rolesSet.add("admin");
        }

        req.user = { uid: decoded.uid, email: decoded.email, roles: Array.from(rolesSet) };
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    const r = req.user?.roles;
    const has = Array.isArray(r) ? roles.some((x) => r.includes(x)) : roles.includes(r);
    if (!has) return res.status(403).json({ error: "Forbidden" });
    next();
};

/* ----------------- Schemi Zod ----------------- */
const coordsSchema = z
    .object({ lat: z.number(), lon: z.number() })
    .strict()
    .nullable()
    .optional();

const imageSchema = z
    .string()
    .min(1)
    .refine((s) => /^https?:\/\/|^data:image\//i.test(s), "image must be http(s) URL or data: URI");

const eventSchemaCreate = z.object({
    name: z.string().min(2),
    dj: z.string().optional().nullable(),
    date: z.string().min(10),
    time: z.string().min(4),
    price: z.union([z.string(), z.number()]).optional().nullable(),
    capacity: z.union([z.string(), z.number()]).optional().nullable(),
    description: z.string().optional().nullable(),
    soldOut: z.boolean().optional().default(false),
    image: imageSchema.optional().nullable(),
    place: z.string().optional().nullable(),
    placeCoords: coordsSchema,
    placeId: z.string().optional().nullable(),
    status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
});

const eventSchemaUpdate = eventSchemaCreate.partial();

// SOLO quantity
const bookingSchema = z.object({
    nome: z.string().min(1),
    cognome: z.string().min(1),
    email: z.string().email(),
    telefono: z.string().min(3),
    eventId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).default(1),
    notes: z.string().optional(),
});

/* ----------------- Audit helper ----------------- */
async function auditEventChange(eventId, user, action, before, after) {
    try {
        const diff = {};
        if (before && after) {
            const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
            keys.forEach((k) => {
                if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) diff[k] = { from: before[k], to: after[k] };
            });
        }
        await db.collection("events").doc(eventId).collection("audits").add({
            action, by: pick(user || {}, ["uid", "email"]), at: now(), diff,
        });
    } catch (e) {
        console.warn("Audit write failed:", e?.message);
    }
}

/* ----------------- EVENTI ----------------- */
app.get("/api/events", async (req, res) => {
    const { status } = req.query;
    try {
        let ref = db.collection("events");
        if (status && ["draft", "published", "archived"].includes(status)) {
            ref = ref.where("status", "==", status);
        }
        try {
            const snap = await ref.orderBy("date").orderBy("time").get();
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            return res.json(data);
        } catch (e) {
            if (String(e?.message || "").toLowerCase().includes("index")) {
                const snap = await ref.orderBy("date").get();
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                data.sort((a, b) => {
                    const da = `${a.date || ""}T${a.time || "00:00"}`;
                    const dbb = `${b.date || ""}T${b.time || "00:00"}`;
                    return da.localeCompare(dbb);
                });
                return res.json(data);
            }
            throw e;
        }
    } catch (err) {
        console.error("❌ /api/events:", err.message);
        res.status(500).json({ error: "Failed to load events" });
    }
});

app.post("/api/events", authenticate, requireRole("admin", "editor"), async (req, res) => {
    const parsed = eventSchemaCreate.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }
    const payload = parsed.data;
    const capacity = Number(payload.capacity || 0) || 0;
    const price = Number(payload.price || 0) || 0;

    try {
        const body = {
            ...payload,
            price,
            capacity,
            soldOut: !!payload.soldOut,
            bookingsCount: 0,
            createdAt: now(),
            updatedAt: now(),
            createdBy: pick(req.user, ["uid", "email"]),
            updatedBy: pick(req.user, ["uid", "email"]),
        };
        const docRef = await db.collection("events").add(body);
        await auditEventChange(docRef.id, req.user, "create", null, body);
        res.json({ id: docRef.id });
    } catch (err) {
        console.error("❌ /api/events POST:", err.message);
        res.status(500).json({ error: "Failed to create event" });
    }
});

app.put("/api/events/:id", authenticate, requireRole("admin", "editor"), async (req, res) => {
    const id = req.params.id;
    const parsed = eventSchemaUpdate.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }
    const payload = parsed.data;

    try {
        const ref = db.collection("events").doc(id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: "Event not found" });

        const before = snap.data();
        const patch = {
            ...payload,
            ...(payload.capacity !== undefined ? { capacity: Number(payload.capacity || 0) || 0 } : {}),
            ...(payload.price !== undefined ? { price: Number(payload.price || 0) || 0 } : {}),
            updatedAt: now(),
            updatedBy: pick(req.user, ["uid", "email"]),
        };

        if (patch.capacity !== undefined) {
            const current = before.bookingsCount || 0;
            patch.soldOut = current >= patch.capacity && patch.capacity > 0 ? true : !!patch.soldOut;
        }

        await ref.update(patch);
        const after = { ...before, ...patch };
        await auditEventChange(id, req.user, "update", before, after);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ /api/events PUT:", err.message);
        res.status(500).json({ error: "Failed to update event" });
    }
});

app.delete("/api/events/:id", authenticate, requireRole("admin", "editor"), async (req, res) => {
    try {
        const id = req.params.id;
        const ref = db.collection("events").doc(id);
        const snap = await ref.get();
        const before = snap.exists ? snap.data() : null;

        await ref.delete();
        await auditEventChange(id, req.user, "delete", before, null);

        res.json({ success: true });
    } catch (err) {
        console.error("❌ /api/events DELETE:", err.message);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

// DELETE /api/events  (bulk)  (admin only)
// opzionale: ?status=draft|published|archived
app.delete("/api/events", authenticate, requireRole("admin"), async (req, res) => {
    try {
        const { status } = req.query;
        let ref = db.collection("events");
        if (status && ["draft","published","archived"].includes(status)) {
            ref = ref.where("status","==", status);
        }
        const snap = await ref.get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        res.json({ success: true, deleted: snap.size });
    } catch (e) {
        console.error("❌ DELETE /api/events (bulk):", e.message);
        res.status(500).json({ error: "Failed to bulk delete events" });
    }
});


app.post("/api/events/:id/duplicate", authenticate, requireRole("admin", "editor"), async (req, res) => {
    const id = req.params.id;
    try {
        const snap = await db.collection("events").doc(id).get();
        if (!snap.exists) return res.status(404).json({ error: "Event not found" });
        const ev = snap.data();
        const clone = {
            ...pick(ev, ["name", "dj", "price", "capacity", "description", "image", "place", "placeCoords", "placeId"]),
            date: "",
            time: "",
            status: "draft",
            soldOut: false,
            bookingsCount: 0,
            createdAt: now(),
            updatedAt: now(),
            createdBy: pick(req.user, ["uid", "email"]),
            updatedBy: pick(req.user, ["uid", "email"]),
        };
        const newRef = await db.collection("events").add(clone);
        await auditEventChange(newRef.id, req.user, "duplicate", null, clone);
        res.json({ id: newRef.id });
    } catch (err) {
        console.error("❌ /api/events duplicate:", err.message);
        res.status(500).json({ error: "Failed to duplicate event" });
    }
});

// ICS
app.get("/api/events/:id/ics", async (req, res) => {
    try {
        const snap = await db.collection("events").doc(req.params.id).get();
        if (!snap.exists) return res.status(404).send("Not found");
        const ev = snap.data();

        const uid = `event-${req.params.id}@yourapp`;
        const dt = new Date(`${ev.date}T${ev.time || "00:00"}:00Z`);
        const pad = (n) => String(n).padStart(2, "0");
        const toUtc = (d) =>
            `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
                d.getUTCHours()
            )}${pad(d.getUTCMinutes())}00Z`;

        const geo =
            ev.placeCoords?.lat && ev.placeCoords?.lon
                ? `\nGEO:${ev.placeCoords.lat};${ev.placeCoords.lon}`
                : "";

        const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//AdminPanel//IT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
SUMMARY:${ev.name || "Evento"}
DTSTAMP:${toUtc(new Date())}
DTSTART:${toUtc(dt)}
DTEND:${toUtc(dt)}
LOCATION:${(ev.place || "").replace(/\n/g, " ")}${geo}
DESCRIPTION:${(ev.description || "").replace(/\n/g, "\\n")}
END:VEVENT
END:VCALENDAR`.replace(/\r?\n/g, "\r\n");

        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="event-${req.params.id}.ics"`);
        res.send(ics);
    } catch (e) {
        console.error("❌ /api/events/:id/ics:", e.message);
        res.status(500).send("error");
    }
});

/* ----------------- PRENOTAZIONI ----------------- */
// GET /api/bookings
app.get("/api/bookings", async (req, res) => {
    try {
        const { eventId } = req.query;
        let ref = db.collection("bookings").orderBy("createdAt", "desc");
        if (eventId) ref = ref.where("eventId", "==", eventId);
        const snapshot = await ref.get();
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (err) {
        console.error("❌ /api/bookings:", err.message);
        res.status(500).json({ error: "Failed to load bookings" });
    }
});

// POST /api/bookings — salva, genera token/QR, invia email (QR inline CID)
app.post("/api/bookings", publicLimiter, async (req, res) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }
    const { eventId, quantity, ...rest } = parsed.data;

    try {
        // 1) transazione
        const result = await db.runTransaction(async (t) => {
            const evRef = db.collection("events").doc(eventId);
            const evSnap = await t.get(evRef);
            if (!evSnap.exists) throw new Error("event_not_found");
            const ev = evSnap.data();

            if (ev.status !== "published") throw new Error("event_not_published");
            const cap = Number(ev.capacity || 0) || 0;
            const current = Number(ev.bookingsCount || 0) || 0;

            if (ev.soldOut) throw new Error("sold_out");
            if (cap > 0 && current + quantity > cap) throw new Error("capacity_exceeded");

            const bookingRef = db.collection("bookings").doc();
            const payload = { ...rest, eventId, quantity, createdAt: now(), status: "pending" };
            t.set(bookingRef, payload);

            const newCount = current + quantity;
            const newSoldOut = cap > 0 && newCount >= cap;
            t.update(evRef, {
                bookingsCount: newCount,
                soldOut: newSoldOut ? true : ev.soldOut,
                updatedAt: now(),
            });

            return { bookingId: bookingRef.id, event: { id: evRef.id, ...ev }, newCount, newSoldOut };
        });

        // 2) token + QR
        const token = jwt.sign(
            { bid: result.bookingId, eid: eventId, qty: quantity },
            JWT_SECRET,
            { expiresIn: "180d" }
        );

        const verifyURL = `${API_BASE_URL || "http://localhost:3000"}/api/bookings/verify?token=${encodeURIComponent(token)}`;
        const qrDataURL = await QRCode.toDataURL(verifyURL, { errorCorrectionLevel: "M" });
        const qrBase64 = qrDataURL.split(",")[1];

        // dati per email
        const bookingDoc = await db.collection("bookings").doc(result.bookingId).get();
        const booking = bookingDoc.data();
        const eventName = result.event?.name || "Evento";

        // 3) invio email (QR inline con CID)
        try {
            const info = await mailer.sendMail({
                from: FROM_EMAIL,
                to: booking.email,
                replyTo: FROM_EMAIL,
                subject: `Conferma Prenotazione — ${eventName}`,
                text: `Ciao ${booking.nome} ${booking.cognome},
La tua prenotazione è stata registrata.
Evento: ${eventName}
Biglietti: ${quantity}
Verifica: ${verifyURL}`,
                html: bookingEmailHTML({
                    nome: booking.nome,
                    cognome: booking.cognome,
                    eventName,
                    quantity,
                    verifyURL,
                }),
                attachments: [
                    {
                        filename: "qrcode.png",
                        content: Buffer.from(qrBase64, "base64"),
                        cid: "qrimage",
                        contentType: "image/png",
                    },
                ],
            });
            console.log("📧 Email inviata:", info.messageId);

            await db.collection("bookings").doc(result.bookingId).update({
                status: "sent",
                token,
                emailSentAt: now(),
            });
        } catch (sendErr) {
            console.error("❌ Errore invio email:", sendErr?.response || sendErr?.message || sendErr);
            await db.collection("bookings").doc(result.bookingId).update({
                status: "pending_email",
                token,
                emailError: String(sendErr?.message || sendErr),
            });
        }

        return res.json({
            id: result.bookingId,
            bookingsCount: result.newCount,
            soldOut: result.newSoldOut,
        });
    } catch (err) {
        const code = err.message;
        if (code === "event_not_found") return res.status(404).json({ error: code });
        if (code === "event_not_published") return res.status(409).json({ error: code });
        if (code === "capacity_exceeded" || code === "sold_out")
            return res.status(409).json({ error: code });
        console.error("❌ /api/bookings POST:", err.message);
        res.status(500).json({ error: "Failed to save booking" });
    }
});

// PUT /api/bookings/:id  (admin|editor|staff)
app.put("/api/bookings/:id", authenticate, requireRole("admin","editor","staff"), async (req, res) => {
    const id = req.params.id;
    const parsed = bookingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }
    const patch = parsed.data;

    try {
        await db.runTransaction(async (t) => {
            const bkRef = db.collection("bookings").doc(id);
            const bkSnap = await t.get(bkRef);
            if (!bkSnap.exists) throw new Error("not_found");
            const before = bkSnap.data();

            const oldEventId = before.eventId;
            const newEventId = patch.eventId ?? oldEventId;
            const oldQ = Number(before.quantity || 1);
            const newQ = Number(patch.quantity ?? oldQ);

            // ---- LEGGI TUTTO PRIMA DI SCRIVERE ----
            const oldEvRef = oldEventId ? db.collection("events").doc(oldEventId) : null;
            const newEvRef = newEventId ? db.collection("events").doc(newEventId) : null;

            let oldEvSnap = null;
            let newEvSnap = null;

            if (oldEvRef) oldEvSnap = await t.get(oldEvRef);
            if (newEvRef && (!oldEvRef || newEvRef.id !== oldEvRef.id)) {
                newEvSnap = await t.get(newEvRef);
            } else {
                // stesso evento o uno dei due manca: riusa lo snap
                newEvSnap = oldEvSnap;
            }

            // ---- CALCOLA & SCRIVI DOPO LE LETTURE ----
            if (oldEventId === newEventId) {
                // stessa serata: variazione quantità
                if (oldEvRef && oldEvSnap?.exists && (newQ !== oldQ)) {
                    const ev = oldEvSnap.data();
                    const cap = Number(ev.capacity || 0) || 0;
                    const current = Number(ev.bookingsCount || 0) || 0;
                    const updatedCount = Math.max(0, current - oldQ + newQ);
                    if (cap > 0 && updatedCount > cap) throw new Error("capacity_exceeded");

                    t.update(oldEvRef, {
                        bookingsCount: updatedCount,
                        soldOut: cap > 0 && updatedCount >= cap,
                        updatedAt: now(),
                    });
                }
            } else {
                // evento cambiato
                // 1) ripristina vecchio
                if (oldEvRef && oldEvSnap?.exists) {
                    const ev = oldEvSnap.data();
                    const cap = Number(ev.capacity || 0) || 0;
                    const updatedCount = Math.max(0, Number(ev.bookingsCount || 0) - oldQ);
                    t.update(oldEvRef, {
                        bookingsCount: updatedCount,
                        soldOut: cap > 0 && updatedCount >= cap,
                        updatedAt: now(),
                    });
                }
                // 2) applica nuovo
                if (newEvRef && newEvSnap?.exists) {
                    const ev = newEvSnap.data();
                    const cap = Number(ev.capacity || 0) || 0;
                    const updatedCount = Number(ev.bookingsCount || 0) + newQ;
                    if (cap > 0 && updatedCount > cap) throw new Error("capacity_exceeded");
                    t.update(newEvRef, {
                        bookingsCount: updatedCount,
                        soldOut: cap > 0 && updatedCount >= cap,
                        updatedAt: now(),
                    });
                }
            }

            // 3) aggiorna la prenotazione
            t.update(bkRef, { ...patch });
        });

        res.json({ success: true });
    } catch (e) {
        if (e.message === "not_found") return res.status(404).json({ error: "booking_not_found" });
        if (e.message === "capacity_exceeded") return res.status(409).json({ error: "capacity_exceeded" });
        console.error("❌ PUT /api/bookings/:id:", e.message);
        res.status(500).json({ error: "Failed to update booking" });
    }
});


// DELETE /api/bookings/:id  (admin|editor)
app.delete("/api/bookings/:id", authenticate, requireRole("admin","editor"), async (req, res) => {
    try {
        await db.runTransaction(async (t) => {
            const bkRef = db.collection("bookings").doc(req.params.id);
            const bkSnap = await t.get(bkRef);
            if (!bkSnap.exists) throw new Error("not_found");
            const b = bkSnap.data();

            // aggiorna evento
            if (b.eventId) {
                const evRef = db.collection("events").doc(b.eventId);
                const evSnap = await t.get(evRef);
                if (evSnap.exists) {
                    const ev = evSnap.data();
                    const cap = Number(ev.capacity || 0) || 0;
                    const updatedCount = Math.max(0, Number(ev.bookingsCount || 0) - (Number(b.quantity || 1)));
                    t.update(evRef, {
                        bookingsCount: updatedCount,
                        soldOut: cap > 0 && updatedCount >= cap ? true : false,
                        updatedAt: now(),
                    });
                }
            }

            t.delete(bkRef);
        });

        res.json({ success: true });
    } catch (e) {
        if (e.message === "not_found") return res.status(404).json({ error: "booking_not_found" });
        console.error("❌ DELETE /api/bookings/:id:", e.message);
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

// DELETE /api/bookings (bulk, opzionale eventId)  (admin only)
app.delete("/api/bookings", authenticate, requireRole("admin"), async (req, res) => {
    try {
        const { eventId } = req.query;
        let ref = db.collection("bookings");
        if (eventId) ref = ref.where("eventId", "==", eventId);
        const snap = await ref.get();

        const byEvent = {};
        snap.forEach(doc => {
            const b = doc.data();
            if (b.eventId) {
                byEvent[b.eventId] = (byEvent[b.eventId] || 0) + (Number(b.quantity || 1));
            }
        });

        // aggiorna eventi (bookingsCount & soldOut)
        const batch = db.batch();
        const evUpdates = Object.entries(byEvent);
        for (const [evId, minus] of evUpdates) {
            const evRef = db.collection("events").doc(evId);
            const evSnap = await evRef.get();
            if (evSnap.exists) {
                const ev = evSnap.data();
                const cap = Number(ev.capacity || 0) || 0;
                const updatedCount = Math.max(0, Number(ev.bookingsCount || 0) - minus);
                batch.update(evRef, {
                    bookingsCount: updatedCount,
                    soldOut: cap > 0 && updatedCount >= cap ? true : false,
                    updatedAt: now(),
                });
            }
        }

        // cancella bookings
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.json({ success: true, deleted: snap.size });
    } catch (e) {
        console.error("❌ DELETE /api/bookings (bulk):", e.message);
        res.status(500).json({ error: "Failed to bulk delete" });
    }
});


// GET /api/bookings/verify?token=...
app.get("/api/bookings/verify", async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ valid: false, reason: "missing_token" });

        const decoded = jwt.verify(String(token), process.env.JWT_SECRET);
        const { bid, eid, qty } = decoded;

        const doc = await db.collection("bookings").doc(bid).get();
        if (!doc.exists) return res.status(404).json({ valid: false, reason: "not_found" });

        const b = doc.data();

        // se vuoi vincolare al token "ufficiale" salvato
        if (b.token && b.token !== token) {
            return res.status(400).json({ valid: false, reason: "token_mismatch" });
        }

        const quantity = Number(b.quantity || qty || 1);
        const checkedInCount = Number(b.checkedInCount || 0);
        const remaining = Math.max(quantity - checkedInCount, 0);

        return res.json({
            valid: true,
            bookingId: bid,
            eventId: eid,
            quantity,
            checkedInCount,
            remaining,
            nome: b.nome,
            cognome: b.cognome,
            email: b.email,
            telefono: b.telefono,
            status: b.status || "sent",
            createdAt: b.createdAt,
        });
    } catch (err) {
        if (err?.name === "TokenExpiredError") {
            return res.status(401).json({ valid: false, reason: "expired" });
        }
        return res.status(400).json({ valid: false, reason: "invalid" });
    }
});

// POST /api/bookings/checkin
// body: { token: string, count?: number }
// roles: admin | editor | staff
app.post("/api/bookings/checkin", authenticate, requireRole("admin","editor","staff"), async (req, res) => {
    try {
        const { token, count = 1 } = req.body || {};
        if (!token) return res.status(400).json({ ok: false, error: "missing_token" });

        const n = Math.max(1, parseInt(count, 10) || 1);
        const decoded = jwt.verify(String(token), process.env.JWT_SECRET);
        const { bid } = decoded;

        const result = await db.runTransaction(async (t) => {
            const ref = db.collection("bookings").doc(bid);
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

            t.update(ref, {
                checkedInCount: newCount,
                lastCheckInAt: new Date(),
                lastCheckInBy: req.user ? { uid: req.user.uid, email: req.user.email } : null,
                firstCheckInAt: b.firstCheckInAt || new Date(),
            });

            // audit movimento
            try {
                const auditRef = ref.collection("checkins").doc();
                t.set(auditRef, {
                    at: new Date(),
                    by: req.user ? { uid: req.user.uid, email: req.user.email } : null,
                    count: n,
                    from: checkedInCount,
                    to: newCount,
                });
            } catch {}

            return { quantity, newCount };
        });

        const remaining = Math.max(result.quantity - result.newCount, 0);
        res.json({ ok: true, quantity: result.quantity, checkedInCount: result.newCount, remaining });
    } catch (e) {
        const code = e?.message;
        if (code === "not_found") return res.status(404).json({ ok: false, error: code });
        if (code === "token_mismatch") return res.status(400).json({ ok: false, error: code });
        if (code === "already_fully_checked_in") return res.status(409).json({ ok: false, error: code });
        if (code === "exceeds_quantity") return res.status(409).json({ ok: false, error: code, remaining: e?.remaining ?? 0 });
        if (e?.name === "TokenExpiredError") return res.status(401).json({ ok: false, error: "expired" });
        return res.status(400).json({ ok: false, error: "invalid" });
    }
});



// POST /api/bookings/checkin/undo
// body: { token: string, count?: number }
// roles: admin | editor | staff
app.post("/api/bookings/checkin/undo", authenticate, requireRole("admin","editor","staff"), async (req, res) => {
    try {
        const { token, count = 1 } = req.body || {};
        if (!token) return res.status(400).json({ ok: false, error: "missing_token" });

        const n = Math.max(1, parseInt(count, 10) || 1);
        const decoded = jwt.verify(String(token), process.env.JWT_SECRET);
        const { bid } = decoded;

        const result = await db.runTransaction(async (t) => {
            const ref = db.collection("bookings").doc(bid);
            const snap = await t.get(ref);
            if (!snap.exists) throw new Error("not_found");

            const b = snap.data();
            if (b.token && b.token !== token) throw new Error("token_mismatch");

            const checkedInCount = Number(b.checkedInCount || 0);
            if (checkedInCount <= 0) throw new Error("nothing_to_undo");

            const dec = Math.min(n, checkedInCount);
            const newCount = checkedInCount - dec;

            t.update(ref, {
                checkedInCount: newCount,
                lastUndoAt: new Date(),
                lastUndoBy: req.user ? { uid: req.user.uid, email: req.user.email } : null,
            });

            // audit movimento negativo
            try {
                const auditRef = ref.collection("checkins").doc();
                t.set(auditRef, {
                    at: new Date(),
                    by: req.user ? { uid: req.user.uid, email: req.user.email } : null,
                    count: -dec,
                    from: checkedInCount,
                    to: newCount,
                });
            } catch {}

            const quantity = Number(b.quantity || 1);
            return { quantity, newCount };
        });

        const remaining = Math.max(result.quantity - result.newCount, 0);
        res.json({ ok: true, quantity: result.quantity, checkedInCount: result.newCount, remaining });
    } catch (e) {
        const code = e?.message;
        if (code === "not_found") return res.status(404).json({ ok: false, error: code });
        if (code === "token_mismatch") return res.status(400).json({ ok: false, error: code });
        if (code === "nothing_to_undo") return res.status(409).json({ ok: false, error: code });
        if (e?.name === "TokenExpiredError") return res.status(401).json({ ok: false, error: "expired" });
        return res.status(400).json({ ok: false, error: "invalid" });
    }
});



/* ----------------- EXPORT CSV ----------------- */
app.get(
    "/api/export/events.csv",
    authenticate,
    requireRole("admin", "editor", "staff"),
    async (req, res) => {
        try {
            const { status } = req.query;
            let ref = db.collection("events");
            if (status && ["draft", "published", "archived"].includes(status)) {
                ref = ref.where("status", "==", status);
            }
            const snap = await ref.get();
            const rows = snap.docs.map((d) => {
                const e = d.data();
                return {
                    id: d.id,
                    name: e.name,
                    date: e.date,
                    time: e.time,
                    price: e.price,
                    capacity: e.capacity,
                    bookingsCount: e.bookingsCount || 0,
                    soldOut: e.soldOut ? 1 : 0,
                    status: e.status,
                    place: e.place,
                    placeId: e.placeId,
                    createdAt: e.createdAt?.toDate ? e.createdAt.toDate().toISOString() : e.createdAt,
                    updatedAt: e.updatedAt?.toDate ? e.updatedAt.toDate().toISOString() : e.updatedAt,
                };
            });
            const csv = toCSV(rows);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="events.csv"`);
            res.send(csv);
        } catch (e) {
            console.error("❌ export events:", e.message);
            res.status(500).json({ error: "Failed to export" });
        }
    }
);

app.get(
    "/api/export/bookings.csv",
    authenticate,
    requireRole("admin", "editor", "staff"),
    async (req, res) => {
        try {
            const { eventId } = req.query;
            let ref = db.collection("bookings").orderBy("createdAt", "desc");
            if (eventId) ref = ref.where("eventId", "==", eventId);
            const snap = await ref.get();
            const rows = snap.docs.map((d) => {
                const b = d.data();
                return {
                    id: d.id,
                    eventId: b.eventId,
                    nome: b.nome,
                    cognome: b.cognome,
                    email: b.email,
                    telefono: b.telefono,
                    quantity: b.quantity || 1,
                    createdAt: b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : b.createdAt,
                };
            });
            const csv = toCSV(rows);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="bookings.csv"`);
            res.send(csv);
        } catch (e) {
            console.error("❌ export bookings:", e.message);
            res.status(500).json({ error: "Failed to export" });
        }
    }
);

/* ----------------- GALLERY ----------------- */
app.get("/api/gallery", async (_req, res) => {
    try {
        const snapshot = await db.collection("gallery").orderBy("createdAt", "desc").get();
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (err) {
        console.error("❌ /api/gallery:", err.message);
        res.status(500).json({ error: "Failed to load gallery" });
    }
});

app.post(
    "/api/gallery",
    authenticate,
    requireRole("admin", "editor"),
    async (req, res) => {
        const { src } = req.body || {};
        if (!src) return res.status(400).json({ error: "Missing src" });
        try {
            const docRef = await db.collection("gallery").add({ src, createdAt: now() });
            res.json({ id: docRef.id });
        } catch (err) {
            console.error("❌ /api/gallery POST:", err.message);
            res.status(500).json({ error: "Failed to save image" });
        }
    }
);

app.delete(
    "/api/gallery/:id",
    authenticate,
    requireRole("admin", "editor"),
    async (req, res) => {
        try {
            await db.collection("gallery").doc(req.params.id).delete();
            res.json({ success: true });
        } catch (err) {
            console.error("❌ /api/gallery DELETE:", err.message);
            res.status(500).json({ error: "Failed to delete image" });
        }
    }
);

/* ----------------- NEWSLETTER (Brevo API v3) ----------------- */
async function brevoSubscribeHandler(req, res) {
    const {
        BREVO_API_KEY,
        BREVO_LIST_ID,
        BREVO_USE_DOI = "true",
        BREVO_DOI_TEMPLATE_ID,
        BREVO_REDIRECT_URL,
        RECAPTCHA_SECRET_KEY,
        RECAPTCHA_MIN_SCORE = "0.5",
    } = process.env;

    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
        return res.status(500).json({ ok: false, error: "Brevo not configured" });
    }

    const { email, attributes = {}, website, consent = true, recaptchaToken } = req.body || {};
    if (website) return res.json({ ok: true, skipped: "honeypot" });
    const isEmail = typeof email === "string" && /\S+@\S+\.\S+/.test(email.trim());
    if (!isEmail) return res.status(400).json({ ok: false, error: "Invalid email" });

    if (RECAPTCHA_SECRET_KEY && recaptchaToken) {
        try {
            const params = new URLSearchParams();
            params.append("secret", RECAPTCHA_SECRET_KEY);
            params.append("response", recaptchaToken);
            const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                body: params,
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            const score = Number(verifyData.score ?? 0);
            if (!verifyData.success || score < Number(RECAPTCHA_MIN_SCORE)) {
                return res.status(400).json({ ok: false, error: "recaptcha_failed", details: verifyData });
            }
        } catch (e) {
            console.warn("reCAPTCHA error:", e?.message);
        }
    }

    const headers = { "api-key": BREVO_API_KEY, "Content-Type": "application/json" };
    const nowIso = new Date().toISOString();
    const extendedAttributes = {
        CONSENT: !!consent,
        CONSENT_TS: nowIso,
        SOURCE: "website",
        LOCALE: req.headers["accept-language"]?.toString().split(",")[0] || "it",
        UA: req.headers["user-agent"] || "",
        ...attributes,
    };

    const isDOI = String(BREVO_USE_DOI).toLowerCase() === "true";
    let url, payload;

    if (isDOI) {
        if (!BREVO_DOI_TEMPLATE_ID || !BREVO_REDIRECT_URL) {
            return res.status(500).json({ ok: false, error: "DOI not configured" });
        }
        url = "https://api.brevo.com/v3/contacts/doubleOptinConfirmation";
        payload = {
            email,
            templateId: Number(BREVO_DOI_TEMPLATE_ID),
            includeListIds: [Number(BREVO_LIST_ID)],
            redirectionUrl: BREVO_REDIRECT_URL,
            attributes: extendedAttributes,
        };
    } else {
        url = "https://api.brevo.com/v3/contacts";
        payload = {
            email,
            updateEnabled: true,
            listIds: [Number(BREVO_LIST_ID)],
            attributes: extendedAttributes,
        };
    }

    try {
        const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            console.error("❌ Brevo error:", r.status, data);
            return res.status(r.status).json({ ok: false, error: data?.message || "brevo_error", details: data });
        }
        return res.json({ ok: true, mode: isDOI ? "double_opt_in" : "single_opt_in" });
    } catch (err) {
        console.error("❌ Brevo exception:", err?.message);
        return res.status(500).json({ ok: false, error: "Failed to subscribe" });
    }
}

app.post("/api/newsletter", publicLimiter, brevoSubscribeHandler);
app.post("/api/newsletter/subscribe", publicLimiter, brevoSubscribeHandler);

// Contatti: invia email a staff
app.post("/api/contact", publicLimiter, async (req, res) => {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: "missing_fields" });
    }
    try {
        await mailer.sendMail({
            from: FROM_EMAIL,
            to: process.env.CONTACT_EMAIL || "djscovery.channel@gmail.com",
            replyTo: email,
            subject: `Nuovo contatto dal sito - ${name}`,
            text: `Nome: ${name}\nEmail: ${email}\n\n${message}`,
        });
        res.json({ ok: true });
    } catch (err) {
        console.error("Errore invio contatto:", err?.message || err);
        res.status(500).json({ ok: false, error: "email_failed" });
    }
});

/* ----------------- Health & Debug ----------------- */
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/api/auth/whoami", authenticate, (req, res) => res.json({ user: req.user }));

/* ----------------- Error handler ----------------- */
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err?.message);
    res.status(500).json({ error: "Server error" });
});

/* ----------------- Start ----------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
