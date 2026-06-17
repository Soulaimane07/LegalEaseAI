// TEMPLATE — copy this file to `firebase.js` (same folder) to run the app.
//   cp firebase.example.js firebase.js
// The real `firebase.js` is gitignored. These Firebase WEB config values are
// public (they ship in the browser bundle), so they are safe to share here.
// You can reuse this same Firebase project — sign in with your own Google
// account and you'll get your own isolated data.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCi78tc1SkvND_OESPOkj0XgzI24k6QVO4",
  authDomain: "legaleaseai-25401.firebaseapp.com",
  projectId: "legaleaseai-25401",
  storageBucket: "legaleaseai-25401.firebasestorage.app",
  messagingSenderId: "1017988324756",
  appId: "1:1017988324756:web:cedb281f00f58eff190381",
  measurementId: "G-4MFDJMMBVS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
