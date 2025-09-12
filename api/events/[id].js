// Route shim so /api/events/:id hits the Express app
const serverless = require("serverless-http");
const app = require("../app");

// Maintain original /api prefix for nested event routes
module.exports = serverless(app, { basePath: "/api" });

