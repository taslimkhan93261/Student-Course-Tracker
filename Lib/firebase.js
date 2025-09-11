import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth"; // ✅ Auth import karein
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmdK9IVkSxayZiWBECIpin8k5LAHZDDE",
  authDomain: "coursedetails-28a4a.firebaseapp.com",
  projectId: "coursedetails-28a4a",
  storageBucket: "coursedetails-28a4a.appspot.com",
  messagingSenderId: "575408589552",
  appId: "1:575408589552:web:REPLACE_WITH_REAL_APP_ID",
};

// Initialize app safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export auth and db
export const auth = getAuth(app);
export const db = getFirestore(app);