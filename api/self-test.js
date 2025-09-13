// api/self-test.js — quick environment diagnostics
// Directly export the Express handler for Vercel's Node runtime
const app = require("./app");


// Directly expose the Express diagnostics without altering paths
module.exports = (req, res) => app(req, res);

