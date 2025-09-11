// api/health.js — explicit health endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ ok: true });
};

// Explicit runtime for Vercel
module.exports.config = { runtime: "nodejs20.x" };
