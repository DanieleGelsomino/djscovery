// api/[[...slug]].js - catch-all Vercel serverless function
const serverless = require("serverless-http");
const app = require("./app");

// Directly export the Express app without stripping the /api prefix
module.exports = serverless(app);
