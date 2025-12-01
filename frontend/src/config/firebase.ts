import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// ⚠️ IMPORTANT: Replace these values with your actual Firebase project configuration
// 📍 Get these from: Firebase Console → Project Settings → Your apps → Web app
// 📚 See FIREBASE_QUICK_START.md for detailed instructions

const firebaseConfig = {
  apiKey: "AIzaSyAFOjw6r-l6TWmSppqDER-9xUKCqSNtnGM",
  authDomain: "fascinito-fas.firebaseapp.com",
  projectId: "fascinito-fas",
  storageBucket: "fascinito-fas.firebasestorage.app",
  messagingSenderId: "561159322004",
  appId: "1:561159322004:web:41f2cd575d2c94eb577781",
  measurementId: "G-88VBQJHE57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
