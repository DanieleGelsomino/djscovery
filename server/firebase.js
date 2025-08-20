import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.VITE_FIREBASE_SERVICE_ACCOUNT;

let credential;
let projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

if (serviceAccountPath && existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  credential = cert(serviceAccount);
  if (!projectId && serviceAccount.project_id) {
    projectId = serviceAccount.project_id;
  }
} else {
  credential = applicationDefault();
}

if (!projectId) {
  console.warn(
    'Firestore project ID not set. Specify FIREBASE_PROJECT_ID or provide a service account JSON with project_id.'
  );
}

initializeApp({
  credential,
  ...(projectId && { projectId }),
});

export const db = getFirestore();
