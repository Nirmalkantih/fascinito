import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration using environment variables
// Falls back to hardcoded values if env vars are not set (for local development)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFOjw6r-l6TWmSppqDER-9xUKCqSNtnGM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fascinito-fas.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fascinito-fas",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fascinito-fas.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "561159322004",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:561159322004:web:41f2cd575d2c94eb577781",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-88VBQJHE57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
