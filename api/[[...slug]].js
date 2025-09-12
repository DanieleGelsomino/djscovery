// api/[[...slug]].js - catch-all Vercel serverless function
const serverless = require("serverless-http");
const app = require("./app");

// Ensure Express routes retain their original /api prefix
module.exports = serverless(app, { basePath: "/api" });
