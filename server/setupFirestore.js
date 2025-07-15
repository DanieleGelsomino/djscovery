// firebase.js
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account non trovato:", serviceAccountPath);
  throw new Error("Service account non trovato o path errato");
}

let serviceAccount = {};
try {
  const raw = fs.readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(raw);
  console.log("✅ Service account caricato correttamente");
} catch (err) {
  console.error("❌ Errore nel parsing del JSON:", err.message);
  throw err;
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

console.log("✅ Firebase inizializzato correttamente");

export const db = getFirestore();
