// api/index.js - Vercel Serverless Function entry
const serverless = require("serverless-http");
const app = require("./app");

// Export the Express app as-is so routes keep their /api prefix
module.exports = serverless(app);
