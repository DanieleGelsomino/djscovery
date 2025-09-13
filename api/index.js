const express = require('express');
const admin = require('firebase-admin');

let db = null;
function getDb() {
  if (db) return db;
  if (!admin.apps.length) {
    try {
      const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!svcRaw) throw new Error('missing_service_account');
      const svc = JSON.parse(svcRaw);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
    } catch (e) {
      const err = new Error('missing_service_account');
      err.code = 'missing_service_account';
      throw err;
    }
  }
  db = admin.firestore();
  return db;
}

const app = express();
app.get('/', (_req, res) => res.json({ ok: true }));

app.get('/events', async (req, res, next) => {
  try {
    const db = getDb();
    const snap = await db.collection('events').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    next(e);
  }
});

app.get('/bookings', async (req, res, next) => {
  try {
    const db = getDb();
    let ref = db.collection('bookings').orderBy('createdAt', 'desc');
    if (req.query.eventId) {
      ref = ref.where('eventId', '==', String(req.query.eventId));
    }
    const snap = await ref.get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, _next) => {
  console.error('[api] error', err);
  if (err.code === 'missing_service_account') {
    return res.status(500).json({ ok: false, error: 'missing_service_account' });
  }
  res.status(500).json({ ok: false, error: 'internal' });
});

module.exports = app;
