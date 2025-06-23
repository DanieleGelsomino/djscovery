import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;

let credential;
if (serviceAccountPath) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  credential = cert(serviceAccount);
} else {
  credential = applicationDefault();
}

initializeApp({
  credential,
});

export const db = getFirestore();
