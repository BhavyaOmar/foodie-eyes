"use client";

import { useState } from "react";
import TopBar from "./components/TopBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";

type Place = {
  name: string;
  address?: string;
  rating?: number;
  website?: string;
  phone?: string;
  thumbnail?: string;
  categories?: string[];
  scraped_content?: string;
};

export default function Home() {
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
        setLocation(readable);
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err.message || "Unable to fetch location.");
        setIsLocating(false);
      }
    );
  };

  return (
    <main className="min-h-dvh bg-black">
      <TopBar 
        location={location} 
        isLocating={isLocating}
        onRequestLocation={requestLocation}
        onLocationChange={setLocation}
      />
      {!hasSearched && <MoodCards />}
      <SearchHero 
        location={location}
        isLocating={isLocating}
        locationError={locationError}
        onRequestLocation={requestLocation}
        onLocationChange={setLocation}
        onResultsChange={setResults}
        onSearchChange={setHasSearched}
        results={results}
        hasSearched={hasSearched}
      />
    </main>
  );
}
