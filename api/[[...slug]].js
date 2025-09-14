// api/[[...slug]].js
const app = require("./app");

module.exports = (req, res) => {
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
