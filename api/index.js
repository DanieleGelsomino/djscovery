// api/index.js - Vercel Serverless Function entry
// Directly export the Express handler for Vercel's Node runtime
const app = require("./app");


// Export the Express app as-is so routes keep their /api prefix
module.exports = (req, res) => app(req, res);


