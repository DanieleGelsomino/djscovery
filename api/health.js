// api/health.js — explicit health endpoint for Vercel
module.exports = (req, res) => {
  const hasGoogleKey = !!(process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY);
  const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasServiceAccountB64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const hasServiceAccountPath = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null;
  res.status(200).json({ ok: true, hasGoogleKey, hasServiceAccountJson, hasServiceAccountB64, hasServiceAccountPath, projectId });
};
