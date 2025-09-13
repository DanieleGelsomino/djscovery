// Route shim so /api/bookings hits the Express app
// Directly export the Express handler for Vercel's Node runtime
const app = require("./app");

// Delegate to the shared Express app without altering the path
module.exports = (req, res) => app(req, res);
