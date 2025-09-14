const app = require("./app");
module.exports.config = { runtime: "nodejs20.x", maxDuration: 30 };
module.exports = (req, res) => app(req, res);
