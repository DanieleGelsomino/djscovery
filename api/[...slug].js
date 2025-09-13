// api/[...slug].js - catch-all Vercel serverless function
// Using a non-optional catch-all ensures sub-routes like /api/bookings
// resolve to the shared Express app in production (Vercel)
const serverless = require("serverless-http");
const app = require("./app");

// Directly export the Express app without stripping the /api prefix
module.exports = serverless(app);
