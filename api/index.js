// api/index.js - Vercel Serverless Function entry
const serverless = require("serverless-http");
const app = require("./app");

// Preserve /api prefix when routing through catch-all functions
module.exports = serverless(app, { basePath: "/api" });
