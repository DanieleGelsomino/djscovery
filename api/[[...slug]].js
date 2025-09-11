// api/[[...slug]].js - catch-all Vercel serverless function
const serverless = require("serverless-http");
const app = require("./app");

module.exports = serverless(app);

// Pin Vercel runtime explicitly to avoid legacy builder issues
module.exports.config = { runtime: "nodejs20.x" };
