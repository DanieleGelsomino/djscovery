// api/self-test.js — quick environment diagnostics
const serverless = require("serverless-http");
const app = require("./app");

// Use basePath so diagnostics reach Express endpoints correctly
module.exports = serverless(app, { basePath: "/api" });

