// api/[...slug].js - catch-all Vercel serverless function
// Using a non-optional catch-all ensures sub-routes like /api/bookings
// resolve to the shared Express app in production (Vercel)
// Directly export the Express handler for Vercel's Node runtime
const serverless = require("serverless-http");
const app = require("./app");
module.exports = serverless(app);
