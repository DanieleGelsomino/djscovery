// api/[[...slug]].js  (usa optional catch-all)
const app = require("./app");

module.exports = (req, res) => {
  // Vercel monta questa function su /api, quindi req.url arriva come "/events", "/bookings", ...
  // Le tue route invece sono "/api/events", "/api/bookings", ...
  if (!req.url.startsWith("/api")) {
    // Gestisce sia "/api" (root) che sottopercorsi
    req.url = "/api" + (req.url === "/" ? "" : req.url);
  }
  return app(req, res);
};
