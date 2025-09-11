// api/health.js — explicit health endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ ok: true });
};

