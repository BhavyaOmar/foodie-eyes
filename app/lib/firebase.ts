import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQmHyHM6PAe9sjojOUZHa-7GmlpOdMEBY",
  authDomain: "foodie-eye.firebaseapp.com",
  projectId: "foodie-eye",
  storageBucket: "foodie-eye.firebasestorage.app",
  messagingSenderId: "784792877624",
  appId: "1:784792877624:web:cf059ec302432d381c44cd",
  measurementId: "G-N15W2ZXFV5"
};

// Singleton pattern: Initialize app only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the tools we need elsewhere
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();