// api/[[...slug]].js
const app = require("./app");

// Forza runtime Node anche a livello file (oltre al vercel.json)
exports.config = { runtime: "nodejs20.x" };
module.exports.config = { runtime: "nodejs20.x" };

module.exports = (req, res) => {
  // Vercel passa req.url SENZA /api; le tue route usano /api/...
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url === "/" ? "" : req.url);
  }
  try {
    return app(req, res);
  } catch (e) {
    console.error("[catch-all] handler error:", e);
    res.statusCode = 500;
    return res.end("handler_error");
  }
};
