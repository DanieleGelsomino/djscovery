// api/index.js - Vercel Serverless Function entry
const serverless = require("serverless-http");
const app = require("./app");

module.exports = serverless(app);

