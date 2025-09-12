// Route shim so /api/events/:id hits the Express app
const serverless = require("serverless-http");
const app = require("../app");
module.exports = serverless(app);

