"use client";

import { useState, useEffect } from "react";
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useUserAuth } from "@/app/context/AuthContext"; // Import the Context Hook

const MAX_BOOKMARKS = 10;

type BookmarkPlace = {
  name: string;
  address?: string;
  rating?: number;
  website?: string;
  phone?: string;
  thumbnail?: string;
  categories?: string[];
  famous_dishes?: string[];
  match_reason?: string;
  note?: string;
  tip?: string;
  link?: string;
  cid?: string;
  place_id?: string;
  savedAt: number;
};

// Helper function to remove undefined values
function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

// 1. Removed 'user' parameter. It now comes from Context directly.
export function useBookmarks() {
  const { user, loading: authLoading } = useUserAuth(); // 2. Get 'loading' state
  const [bookmarks, setBookmarks] = useState<BookmarkPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to real-time updates from Firestore
  useEffect(() => {
    // 3. THE FIX: Stop everything if Auth is still loading
    if (authLoading) {
      return; 
    }

    if (!user) {
      console.log('📍 useBookmarks: No user, resetting bookmarks');
      setBookmarks([]);
      setLoading(false);
      return;
    }

    console.log('🔥 useBookmarks: Setting up listener for user:', user.uid);
    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedBookmarks = data.bookmarks || [];
          console.log('📖 useBookmarks: Loaded', loadedBookmarks.length, 'bookmarks from Firestore');
          setBookmarks(loadedBookmarks);
        } else {
          console.log('📖 useBookmarks: No document found, starting fresh');
          setBookmarks([]);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching bookmarks:", err);
        // Only set error if it's NOT a permission error (which shouldn't happen now anyway)
        if (err.code !== 'permission-denied') {
            setError("Failed to load bookmarks");
        }
        setBookmarks([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]); // 4. Add authLoading to dependencies

  // Check if a place is bookmarked
  const isBookmarked = (placeName: string): boolean => {
    return bookmarks.some((b) => b.name === placeName);
  };

  // Add a bookmark
  const addBookmark = async (place: Omit<BookmarkPlace, 'savedAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      console.warn("Bookmark failed: User not authenticated");
      return { success: false, error: "Please sign in to save bookmarks" };
    }

    console.log("Adding bookmark for user:", user.uid, "Place:", place.name);

    // Check if already bookmarked
    if (isBookmarked(place.name)) {
      console.warn("Bookmark failed: Already bookmarked");
      return { success: false, error: "Already bookmarked" };
    }

    // Check limit
    if (bookmarks.length >= MAX_BOOKMARKS) {
      console.warn("Bookmark failed: Limit reached", bookmarks.length, ">=", MAX_BOOKMARKS);
      return { 
        success: false, 
        error: `You can only save up to ${MAX_BOOKMARKS} bookmarks. Please delete one to add another.` 
      };
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      // Clean the place object to remove undefined values
      const cleanedPlace = cleanObject({
        name: place.name,
        address: place.address,
        rating: place.rating,
        website: place.website,
        phone: place.phone,
        thumbnail: place.thumbnail,
        categories: place.categories,
        famous_dishes: place.famous_dishes,
        match_reason: place.match_reason,
        tip: place.tip,
        link: place.link,
        cid: place.cid,
        place_id: place.place_id,
        savedAt: Date.now()
      });

      const updatedBookmarks = [...bookmarks, cleanedPlace];
      
      console.log("Attempting to save bookmark. Current count:", bookmarks.length, "New count:", updatedBookmarks.length);

      await setDoc(userDocRef, {
        bookmarks: updatedBookmarks,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("✅ Bookmark saved successfully!");
      return { success: true };
    } catch (err: any) {
      console.error("❌ Error adding bookmark:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      
      const errorMessage = err?.message || err?.code || "Failed to save bookmark";
      
      if (err?.code === 'permission-denied') {
        return { success: false, error: "Permission denied. Please check Firestore rules." };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Remove a bookmark
  const removeBookmark = async (placeName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Please sign in" };
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedBookmarks = bookmarks.filter((b) => b.name !== placeName);

      await setDoc(userDocRef, {
        bookmarks: updatedBookmarks,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (err: any) {
      console.error("Error removing bookmark:", err);
      const errorMessage = err?.message || err?.code || "Failed to remove bookmark";
      
      if (err?.code === 'permission-denied') {
        return { success: false, error: "Permission denied. Please check Firestore rules." };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Toggle bookmark (add or remove)
  const toggleBookmark = async (place: Omit<BookmarkPlace, 'savedAt'>): Promise<{ success: boolean; error?: string }> => {
    if (isBookmarked(place.name)) {
      return await removeBookmark(place.name);
    } else {
      return await addBookmark(place);
    }
  };

  return {
    bookmarks,
    loading,
    error,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    maxBookmarks: MAX_BOOKMARKS
  };
}