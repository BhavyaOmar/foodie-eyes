import { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // 1. Detect User
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // 2. Real-time Listener: Fetch History when User changes
  useEffect(() => {
    if (!user) {
      setHistory([]); // Clear history if logged out
      return;
    }

    const historyRef = collection(db, "users", user.uid, "history");
    const q = query(historyRef, orderBy("viewedAt", "desc"), limit(20));

    // Real-time subscription (Updates UI instantly when history changes)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const places = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(places);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Function to Add to History
  const addToHistory = async (place: any) => {
    if (!user) return; // Only work if logged in

    try {
      // Use setDoc with a specific ID (place name) so we don't create duplicates.
      // If "Royal Biryani" is already there, it just updates the timestamp!
      const docId = place.name.replace(/\s+/g, '-').toLowerCase(); 
      const historyRef = doc(db, "users", user.uid, "history", docId);

      await setDoc(historyRef, {
        name: place.name,
        address: place.address || "No address",
        rating: place.rating || 0,
        thumbnail: place.thumbnail || null, // Ensure you have this field in your place data
        viewedAt: serverTimestamp() // Key for sorting
      }, { merge: true });

    } catch (error) {
      console.error("Failed to save history:", error);
    }
  };

  return { history, addToHistory };
}