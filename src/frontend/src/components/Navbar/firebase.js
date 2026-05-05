// src/components/Navbar/firebase.js (or adjust your path accordingly)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // <-- CRITICAL EXTRA IMPORT

const firebaseConfig = {
  apiKey: "AIzaSyBwLIxW54YJYJlcCZE22ARPsCLaXAg6Bx4",
  authDomain: "legalease-9b01b.firebaseapp.com",
  projectId: "legalease-9b01b",
  storageBucket: "legalease-9b01b.firebasestorage.app",
  messagingSenderId: "312276511058",
  appId: "1:312276511058:web:52cfdab153ed5b3f55f28b",
  measurementId: "G-SNTQEV71D1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and EXPORT the authentication tools needed by components
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();