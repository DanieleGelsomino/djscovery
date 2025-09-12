// api/health.js — explicit health endpoint for Vercel
module.exports = (req, res) => {
  const hasGoogleKey = !!(process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY);
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  res.status(200).json({ ok: true, hasGoogleKey, hasServiceAccount });
};
