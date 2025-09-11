const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2"); // Gen2
const { app } = require("./app");

// Regione e limiti
setGlobalOptions({ region: "europe-west8", maxInstances: 10 });

// Export single Express app as an HTTPS Function
exports.api = onRequest(app);
