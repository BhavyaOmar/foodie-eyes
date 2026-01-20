"use client";

import { useState, useEffect } from "react";
// 2. Import Global Auth Context
import { useUserAuth } from "@/app/context/AuthContext";

import TopBar from "./components/TopBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";
import Footer from "./components/Footer";
import DetailModal from "./components/DetailModal";
import AuthModal from "./components/AuthModal";
import LocationDisplay from "./components/LocationDisplay";
import LocationModal from "./components/LocationModal";
import { useHistory } from "./hooks/useHistory";
import { useBookmarks } from "./hooks/useBookmarks";

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
  link?: string;
  cid?: string;
  place_id?: string;
};

export default function Home() {
  // 3. Use Global Auth
  const { user, loading } = useUserAuth();
  const isSignedIn = !!user;

  // 4. Bookmarks
  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  
  const { addToHistory } = useHistory();
  
  const [location, setLocation] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [hasAutoPromptedLocation, setHasAutoPromptedLocation] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [moodPrompt, setMoodPrompt] = useState("");

  // 5. Load User Location
  useEffect(() => {
    if (loading) return; 

    if (user) {
      const userLocationKey = `foodieLocation-${user.uid}`;
      const savedLocation = localStorage.getItem(userLocationKey);
      if (savedLocation) {
        setLocation(savedLocation);
        setDraftLocation(savedLocation);
      } else {
        setLocation("");
        setDraftLocation("");
      }
    } else {
      setLocation("");
      setDraftLocation("");
    }
  }, [user, loading]);

  // Reset prompt so new users are asked
  useEffect(() => {
    setHasAutoPromptedLocation(false);
  }, [user?.uid]);

  // Auto prompt for location when missing
  useEffect(() => {
    if (loading) return;
    if (location.trim()) {
      setIsLocationModalOpen(false);
      return;
    }
    if (!hasAutoPromptedLocation) {
      setIsLocationModalOpen(true);
      setHasAutoPromptedLocation(true);
    }
  }, [loading, location, hasAutoPromptedLocation]);

  const persistLocation = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLocation(trimmed);
    setDraftLocation(trimmed);
    if (user) {
      const userLocationKey = `foodieLocation-${user.uid}`;
      localStorage.setItem(userLocationKey, trimmed);
    }
  };

  const handleLocationChange = (newLocation: string) => {
    persistLocation(newLocation);
  };

  const handleLocationConfirm = () => {
    if (!draftLocation.trim()) {
      setLocationError("Please enter a location.");
      return;
    }
    setLocationError("");
    persistLocation(draftLocation);
    setIsLocationModalOpen(false);
  };

  const handleOpenLocationModal = () => {
    setLocationError("");
    setDraftLocation(location);
    setIsLocationModalOpen(true);
  };

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
      tip: place.tip,
      link: place.link,
      cid: place.cid,
      place_id: place.place_id
    });

    if (!result.success && result.error) {
      setBookmarkError(result.error);
      setTimeout(() => setBookmarkError(null), 3000);
    }
  };

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
        setDraftLocation(readable);
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
        location={location}
        onReset={handleReset}
      />
      <LocationDisplay location={location} onChangeClick={handleOpenLocationModal} />
      <div className="h-3" />
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
      
      {/* --- MODALS SECTION --- */}

      {/* 1. Location Modal (Independent) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        locationDraft={draftLocation}
        isLocating={isLocating}
        error={locationError}
        onClose={() => setIsLocationModalOpen(false)}
        onUseCurrent={requestLocation}
        onDraftChange={(value) => {
          setLocationError("");
          setDraftLocation(value);
        }}
        onConfirm={handleLocationConfirm}
      />

      {/* 2. Detail Modal (Only when a place is selected) */}
      {selectedPlace && (
        <DetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          isBookmarked={isBookmarked(selectedPlace.name)}
          onBookmark={() => handleBookmark(selectedPlace)}
          isSignedIn={isSignedIn}
        />
      )}
      
      {/* 3. Auth Modal (Independent) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </main>
  );
}