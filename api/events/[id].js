// Route shim so /api/events/:id hits the Express app
// Directly export the Express handler for Vercel's Node runtime
const app = require("../app");


// Forward to the Express app without stripping the /api prefix
module.exports = (req, res) => app(req, res);


