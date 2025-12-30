"use client";

import { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import LocationBar from "./components/LocationBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";
import Footer from "./components/Footer";
import DetailModal from "./components/DetailModal";
import AuthModal from "./components/AuthModal";

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
};

export default function Home() {
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Load location and bookmarks from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("foodieLocation");
    const savedBookmarks = localStorage.getItem("foodieBookmarks");
    const savedAuth = localStorage.getItem("foodieAuth");
    
    if (savedLocation) setLocation(savedLocation);
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    if (savedAuth) setIsSignedIn(true);
  }, []);

  // Persist location to localStorage
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    localStorage.setItem("foodieLocation", newLocation);
  };

  // Handle bookmarking
  const handleBookmark = (placeName: string) => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    
    const updated = bookmarks.includes(placeName)
      ? bookmarks.filter(b => b !== placeName)
      : [...bookmarks, placeName];
    
    setBookmarks(updated);
    localStorage.setItem("foodieBookmarks", JSON.stringify(updated));
  };

  const handleSignIn = () => {
    setIsSignedIn(true);
    localStorage.setItem("foodieAuth", "true");
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

  return (
    <main className="min-h-dvh bg-white text-slate-900 flex flex-col">
      <TopBar 
        isSignedIn={isSignedIn}
        onSignIn={() => setShowAuthModal(true)}
      />
      <LocationBar
        location={location}
        isLocating={isLocating}
        onRequestLocation={requestLocation}
        onLocationChange={handleLocationChange}
      />
      {!hasSearched && <MoodCards />}
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
