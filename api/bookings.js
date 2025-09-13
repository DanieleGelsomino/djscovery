// Route shim so /api/bookings hits the Express app
const serverless = require("serverless-http");
const app = require("./app");

// Delegate to the shared Express app without altering the path
module.exports = serverless(app);
