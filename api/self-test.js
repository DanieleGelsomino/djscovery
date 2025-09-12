// api/self-test.js — quick environment diagnostics
const serverless = require("serverless-http");
const app = require("./app");
module.exports = serverless(app);

