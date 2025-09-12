// Route shim so /api/events/:id hits the Express app
const serverless = require("serverless-http");
const app = require("../app");

// Forward to the Express app without stripping the /api prefix
module.exports = serverless(app);

