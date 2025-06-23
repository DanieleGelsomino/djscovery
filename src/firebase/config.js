// Firebase configuration and initialization
// Replace the placeholders with your Firebase project credentials.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqtP0z6qos7M55gPn_WqCjlgApHhSrC28",
  authDomain: '"djscovery-47610.firebaseapp.com',
  projectId: "djscovery-47610",
  storageBucket: "djscovery-47610.firebasestorage.app",
  messagingSenderId: "547949192479",
  appId: "1:547949192479:web:4231be05c2cf2e548d7c2a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
