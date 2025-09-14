// api/[[...slug]].js
const app = require("./app");

// Forza il runtime Node per questa Serverless Function
module.exports.config = { runtime: "nodejs20.x", maxDuration: 30 };

module.exports = (req, res) => {
  // Vercel passa req.url senza /api; le tue route lo includono
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url === "/" ? "" : req.url);
  }
  try {
    return app(req, res);
  } catch (e) {
    console.error("[catch-all] handler error:", e);
    res.statusCode = 500;
    res.end("handler_error");
  }
};
