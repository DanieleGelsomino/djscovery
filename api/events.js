// Route shim so /api/events hits the Express app
const serverless = require("serverless-http");
const app = require("./app");

// Keep Express paths consistent when invoked via /api/events*
module.exports = serverless(app, { basePath: "/api" });

