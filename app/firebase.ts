import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBQmHyHM6PAe9sjojOUZHa-7GmlpOdMEBY",
  authDomain: "foodie-eye.firebaseapp.com",
  projectId: "foodie-eye",
  storageBucket: "foodie-eye.firebasestorage.app",
  messagingSenderId: "784792877624",
  appId: "1:784792877624:web:cf059ec302432d381c44cd",
  measurementId: "G-N15W2ZXFV5"
};

// 1. Initialize App (Singleton Pattern to prevent re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Export Auth & Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 3. Initialize Analytics (Safe for Next.js)
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}