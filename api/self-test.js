// api/self-test.js — quick environment diagnostics
const serverless = require("serverless-http");
const app = require("./app");


// Directly expose the Express diagnostics without altering paths
module.exports = serverless(app);

