"use client";

import { useState, useEffect } from "react";
// 1. Remove manual auth imports
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/app/lib/firebase";

// 2. Import Global Auth Context
import { useUserAuth } from "@/app/context/AuthContext";

import TopBar from "./components/TopBar";
import LocationBar from "./components/LocationBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";
import Footer from "./components/Footer";
import DetailModal from "./components/DetailModal";
import AuthModal from "./components/AuthModal";
import { useHistory } from "./hooks/useHistory";
import { useBookmarks } from "./hooks/useBookmarks";
// import HistoryDrawer from "./components/HistoryDrawer"; // Unused import based on code

type Place = {
  name: string;
  address?: string;
  rating?: number;
  website?: string;
  phone?: string;
  thumbnail?: string;
  categories?: string[];
  scraped_content?: string;
  reviews?: string;
  reviewCount?: number;
  famous_dishes?: string[];
  match_reason?: string;
  note?: string;
  tip?: string;
};

export default function Home() {
  // 3. Use Global Auth (Fixes sync issues)
  const { user, loading } = useUserAuth();
  const isSignedIn = !!user;

  // 4. FIXED: Remove 'user' argument (It now uses Context internally)
  const { bookmarks, isBookmarked, toggleBookmark, maxBookmarks } = useBookmarks();
  
  const { history, addToHistory } = useHistory();
  // const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Unused
  
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [moodPrompt, setMoodPrompt] = useState("");

  // 5. Updated Effect: Load User Location ONLY when Auth is ready
  useEffect(() => {
    if (loading) return; // Wait for Firebase to finish checking

    if (user) {
      // User is logged in -> Load their specific location
      const userLocationKey = `foodieLocation-${user.uid}`;
      const savedLocation = localStorage.getItem(userLocationKey);
      if (savedLocation) {
        setLocation(savedLocation);
      } else {
        setLocation(""); 
      }
    } else {
      // User is logged out -> Clear location
      setLocation("");
    }
  }, [user, loading]);

  // Persist location to localStorage per user
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    if (user) {
      const userLocationKey = `foodieLocation-${user.uid}`;
      localStorage.setItem(userLocationKey, newLocation);
    }
  };

  // Handle bookmarking with Firebase
  const handleBookmark = async (place: Place) => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    
    setBookmarkError(null);
    const result = await toggleBookmark({
      name: place.name,
      address: place.address,
      rating: place.rating,
      website: place.website,
      phone: place.phone,
      thumbnail: place.thumbnail,
      categories: place.categories,
      famous_dishes: place.famous_dishes,
      match_reason: place.match_reason,
      tip: place.tip
    });

    if (!result.success && result.error) {
      setBookmarkError(result.error);
      // Auto-clear error after 3 seconds
      setTimeout(() => setBookmarkError(null), 3000);
    }
  };

  // Reset app to initial state
  const handleReset = () => {
    setResults([]);
    setHasSearched(false);
    setSelectedPlace(null);
    setMoodPrompt("");
    setBookmarkError(null);
    setShowAuthModal(false);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.address;
      return `${address.city || address.town || address.village}, ${address.state}`;
    } catch (err) {
      console.error("Reverse geocode failed:", err);
      return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location not supported on this device.");
      return;
    }
    setIsLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const readable = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        handleLocationChange(readable);
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err.message || "Unable to fetch location.");
        setIsLocating(false);
      }
    );
  };

  // Note: This function was defined but unused in your snippet
  // const handlePlaceSelect = (place: any) => {
  //    addToHistory(place);
  //    setSelectedPlace(place); 
  // };

  return (
    <main className="min-h-dvh bg-white text-slate-900 flex flex-col">
      <TopBar 
        location={location}
        onReset={handleReset}
      />
      <LocationBar
        location={location}
        isLocating={isLocating}
        onRequestLocation={requestLocation}
        onLocationChange={handleLocationChange}
      />
      <div className="gap-4">&nbsp;</div>
      {!hasSearched && <MoodCards onMoodSelect={setMoodPrompt} selectedMoodPrompt={moodPrompt} />}
      <div className="flex-1">
        <SearchHero 
          location={location}
          isLocating={isLocating}
          locationError={locationError}
          onRequestLocation={requestLocation}
          onLocationChange={handleLocationChange}
          onResultsChange={setResults}
          onSearchChange={setHasSearched}
          results={results}
          hasSearched={hasSearched}
          onPlaceSelect={(place) => {
             addToHistory(place);
             setSelectedPlace(place);
          }}
          bookmarks={bookmarks.map(b => b.name)}
          onBookmark={handleBookmark}
          moodPrompt={moodPrompt}
        />
      </div>
      <Footer />
      
      {/* Bookmark Error Toast */}
      {bookmarkError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-amber-50 border border-amber-300 rounded-lg shadow-xl px-4 py-3 flex items-center gap-2 max-w-md">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 font-medium">{bookmarkError}</p>
          </div>
        </div>
      )}
      
      {selectedPlace && (
        <DetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          isBookmarked={isBookmarked(selectedPlace.name)}
          onBookmark={() => handleBookmark(selectedPlace)}
          isSignedIn={isSignedIn}
        />
      )}
      
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </main>
  );
}