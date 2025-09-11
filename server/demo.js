// Lightweight demo backend with in-memory JSON persistence
// No external credentials required. Suitable for client demo.
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = process.env.DEMO_DATA_PATH || path.join(process.cwd(), 'server', 'demo-data.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function initData() {
  return {
    events: [
      {
        id: '1',
        name: 'Wan Seend',
        dj: 'DJ Alpha',
        place: 'Roma',
        date: '2027-05-10',
        time: '21:00',
        price: '15',
        image: '',
        description: 'Lorem ipsum dolor sit amet.',
        capacity: 100,
        soldOut: false,
        status: 'published',
      },
      {
        id: '2',
        name: 'Night Beats',
        dj: 'DJ Beta',
        place: 'Milano',
        date: '2027-06-15',
        time: '22:30',
        price: '18',
        image: '',
        description: 'Lorem ipsum dolor sit amet.',
        capacity: 100,
        soldOut: false,
        status: 'published',
      },
      {
        id: '3',
        name: 'Electro Wave',
        dj: 'DJ Gamma',
        place: 'Torino',
        date: '2027-07-20',
        time: '20:00',
        price: '20',
        image: '',
        description: 'Lorem ipsum dolor sit amet.',
        capacity: 100,
        soldOut: false,
        status: 'published',
      },
    ],
    bookings: [],
    gallery: [],
    subscribers: [],
  };
}

function load() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      const d = initData();
      fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));
      return d;
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('demo-data load failed, reinitializing:', e?.message);
    const d = initData();
    try { fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2)); } catch {}
    return d;
  }
}

function save(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('demo-data save failed:', e?.message);
  }
}

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

/* ---------- EVENTS ---------- */
app.get('/api/events', (req, res) => {
  const { status } = req.query || {};
  const db = load();
  let list = db.events || [];
  if (status && ['draft', 'published', 'archived'].includes(String(status))) {
    list = list.filter((e) => (e.status || 'published') === status);
  }
  res.json(list);
});

/* ---------- BOOKINGS ---------- */
app.post('/api/bookings', (req, res) => {
  const { nome, cognome, email, telefono, eventId, quantity = 1, notes } = req.body || {};
  if (!nome || !cognome || !email || !telefono || !eventId) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const q = Math.max(1, parseInt(quantity, 10) || 1);

  const db = load();
  const id = String(Date.now());
  const booking = { id, nome, cognome, email, telefono, eventId, quantity: q, notes: notes || '' };
  db.bookings.push(booking);

  // Update event counters
  const idx = db.events.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    const ev = db.events[idx];
    const capacity = Number(ev.capacity || 0) || 0;
    const current = (db.bookings || []).filter((b) => b.eventId === eventId).reduce((sum, b) => sum + (Number(b.quantity || 1) || 1), 0);
    ev.bookingsCount = current;
    ev.soldOut = capacity > 0 && current >= capacity ? true : !!ev.soldOut;
    db.events[idx] = ev;
  }

  save(db);
  res.json({ id });
});

/* ---------- GALLERY ---------- */
app.get('/api/gallery', (_req, res) => {
  const db = load();
  res.json(db.gallery || []);
});

/* ---------- NEWSLETTER ---------- */
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'missing_email' });
  const db = load();
  const exists = (db.subscribers || []).some((s) => String(s.email).toLowerCase() === String(email).toLowerCase());
  if (!exists) db.subscribers.push({ id: String(Date.now()), email });
  save(db);
  res.json({ ok: true, mode: 'single_opt_in' });
});

/* ---------- CONTACT ---------- */
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ ok: false, error: 'missing_fields' });
  // In demo we just accept it.
  res.json({ ok: true });
});

/* ---------- Spotify helper (optional) ---------- */
app.get('/api/spotify/latest-playlist', (_req, res) => {
  // Return a safe public playlist id to embed in the widget
  const id = process.env.SPOTIFY_FALLBACK_PLAYLIST_ID || '1pSy9kzEtp4El0Op5CV8pf';
  res.json({ id, name: 'Spotify Playlist', url: `https://open.spotify.com/playlist/${id}`, embedUrl: `https://open.spotify.com/embed/playlist/${id}` });
});

app.listen(PORT, () => {
  console.log(`✅ Demo API running at http://localhost:${PORT}`);
});
