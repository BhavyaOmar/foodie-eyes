"use client";
import { useState, useEffect } from "react";
import useSpeechRecognition from "@/app/hooks/useSpeechRecognition";

export default function SearchHero() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const allergenList = ["Dairy", "Gluten", "Nuts", "Soy"];

  const { text, isListening, startListening, stopListening, hasSupport } = useSpeechRecognition();

  // Sync Voice Input to Search Box
  useEffect(() => {
    if (text) {
      setQuery(text);
    }
  }, [text]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAllergenChange = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((item) => item !== allergen)
        : [...prev, allergen]
    );
  };

  return (
    <section className="gold-sheen">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 pt-6 pb-4 sm:pt-10">
        <h1 className="text-xl sm:text-2xl font-semibold gold-gradient-text">
          What are you in the mood for?
        </h1>
        
        <div className="mt-3 sm:mt-4">
          <label className="sr-only" htmlFor="foodie-search">
            Search
          </label>
          
          <div className="relative group">
            {/* 1. Left Search Icon */}
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>

            {/* 2. Main Input */}
            <input
              id="foodie-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Spicy Biryani' or 'Quiet Cafe'..."
              // Increased padding-right (pr-24) to make room for Mic + Filter buttons
              className="w-full rounded-full input-sheen bg-black/50 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 pl-10 pr-24 py-2.5 sm:py-3 outline-none transition"
            />

            {/* 3. Action Buttons Container (Right Side) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              
              {/* MIC BUTTON (Google Material Icon) */}
              {hasSupport && (
                <button
                  onClick={handleMicClick}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isListening 
                      ? "text-red-500 bg-red-500/10 animate-pulse" 
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  }`}
                  aria-label="Voice Search"
                >
                   {/* Official Google Material 'Mic' Path */}
                   <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>
                   </svg>
                </button>
              )}

              {/* FILTER BUTTON */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors ${
                  showFilters ? "text-[var(--gold-400)] bg-zinc-800" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* 4. Dropdown Filters */}
            {showFilters && (
              <div className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-md rounded-xl p-4 border border-zinc-800 shadow-2xl z-20">
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {["Veg", "Non veg", "Jain"].map((pref) => (
                          <button
                            key={pref}
                            onClick={() => setPreferences(pref)}
                            className={`text-xs py-1.5 px-3 rounded-full border transition-all ${
                              preferences === pref
                                ? "bg-[var(--gold-400)] text-black border-[var(--gold-400)] font-medium"
                                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            {pref}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Budget (₹)</h3>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full rounded-lg bg-zinc-900/50 border border-zinc-700 focus:border-[var(--gold-400)] text-sm text-zinc-100 p-2 outline-none"
                      />
                    </div>
                  </div>
                  <hr className="border-zinc-800" />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Allergens</h3>
                    <div className="flex flex-wrap gap-2">
                      {allergenList.map((allergen) => (
                        <button
                          key={allergen}
                          onClick={() => handleAllergenChange(allergen)}
                          className={`text-xs py-1.5 px-3 rounded-full border transition-all ${
                            allergens.includes(allergen)
                              ? "bg-red-900/40 text-red-200 border-red-500"
                              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                          }`}
                        >
                          {allergen}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}