"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import TopBar from "./components/TopBar";
import LocationBar from "./components/LocationBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";
import Footer from "./components/Footer";
import DetailModal from "./components/DetailModal";
import AuthModal from "./components/AuthModal";
import { useHistory } from "./hooks/useHistory"; // <--- Import Hook
import HistoryDrawer from "./components/HistoryDrawer"; // <--- Import Drawer

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
  secret_tip?: string;
};

export default function Home() {
  const { history, addToHistory } = useHistory(); // <--- Initialize Hook
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [moodPrompt, setMoodPrompt] = useState("");

  // Track auth state and load user-specific data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsSignedIn(!!currentUser);

      // Load user-specific location if logged in
      if (currentUser) {
        const userLocationKey = `foodieLocation-${currentUser.uid}`;
        const savedLocation = localStorage.getItem(userLocationKey);
        if (savedLocation) {
          setLocation(savedLocation);
        } else {
          setLocation(""); // Clear location when switching users
        }
      } else {
        setLocation(""); // Clear location when logged out
      }

      // Load bookmarks (keeping them per user as well)
      if (currentUser) {
        const userBookmarksKey = `foodieBookmarks-${currentUser.uid}`;
        const savedBookmarks = localStorage.getItem(userBookmarksKey);
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        } else {
          setBookmarks([]);
        }
      } else {
        setBookmarks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist location to localStorage per user
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    if (user) {
      const userLocationKey = `foodieLocation-${user.uid}`;
      localStorage.setItem(userLocationKey, newLocation);
    }
  };

  // Handle bookmarking per user
  const handleBookmark = (placeName: string) => {
    if (!isSignedIn || !user) {
      setShowAuthModal(true);
      return;
    }
    
    const updated = bookmarks.includes(placeName)
      ? bookmarks.filter(b => b !== placeName)
      : [...bookmarks, placeName];
    
    setBookmarks(updated);
    const userBookmarksKey = `foodieBookmarks-${user.uid}`;
    localStorage.setItem(userBookmarksKey, JSON.stringify(updated));
  };

  const handleSignIn = () => {
    // User is automatically set via onAuthStateChanged hook
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
  const handlePlaceSelect = (place: any) => {
     // 1. Save to History (Fire & Forget)
     addToHistory(place);
     
     // 2. Open your details modal/view
     // setSelectedPlace(place); 
  };

  return (
    <main className="min-h-dvh bg-white text-slate-900 flex flex-col">
      <TopBar 
        location={location}
      />
      <LocationBar
        location={location}
        isLocating={isLocating}
        onRequestLocation={requestLocation}
        onLocationChange={handleLocationChange}
      />
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
          onPlaceSelect={setSelectedPlace}
          bookmarks={bookmarks}
          onBookmark={handleBookmark}
          moodPrompt={moodPrompt}
        />
      </div>
      <Footer />
      
      {selectedPlace && (
        <DetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          isBookmarked={bookmarks.includes(selectedPlace.name)}
          onBookmark={() => handleBookmark(selectedPlace.name)}
          isSignedIn={isSignedIn}
        />
      )}
      
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSignIn={handleSignIn}
        />
      )}
    </main>
  );
}
