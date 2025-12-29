"use client";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import useSpeechRecognition from "@/app/hooks/useSpeechRecognition";
import LocationAutocomplete from "./LocationAutocomplete";

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

type Props = {
  location: string;
  isLocating: boolean;
  locationError?: string;
  onRequestLocation: () => void;
  onLocationChange: (value: string) => void;
  onResultsChange: (results: Place[]) => void;
  onSearchChange: (hasSearched: boolean) => void;
  results: Place[];
  hasSearched: boolean;
};

export default function SearchHero({ 
  location, 
  isLocating, 
  locationError, 
  onRequestLocation, 
  onLocationChange,
  onResultsChange,
  onSearchChange,
  results,
  hasSearched
}: Props) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(""); // <--- NEW: For the "Canvas" text

  const allergenList = ["Dairy", "Gluten", "Nuts", "Soy"];
  const filterRef = useRef<HTMLDivElement | null>(null);

  // The Optimistic Loading Steps
  const steps = [
    "🧠 Analyzing your mood...",
    "🌏 Scouting Google Maps for top spots...",
    "📜 Reading menus & checking prices...",
    "✨ Gemini is picking the winners..."
  ];

  const { text, isListening, startListening, stopListening, hasSupport } = useSpeechRecognition();

  // 1. Sync Voice to Text
  useEffect(() => {
    if (text) setQuery(text);
  }, [text]);

  // 2. Cycle Loading Messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let stepIndex = 0;
      setLoadingStep(steps[0]); // Reset to start
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        if (stepIndex < steps.length) {
            setLoadingStep(steps[stepIndex]);
        }
      }, 2500); // Change message every 2.5s
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 3. Handle outside clicks for filters
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilters]);

  const handleMicClick = () => {
    isListening ? stopListening() : startListening();
  };

  const handleAllergenChange = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen]
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // Validation
    if (!location.trim()) {
      setError("Please select a location first so we know where to search!");
      return;
    }
    
    setError("");
    setLoading(true);
    // Note: We don't clear results immediately so UI doesn't jump, 
    // or you can setResults([]) if you prefer a clean slate.
    onResultsChange([]); 

    const contextualQuery = [
      query.trim(),
      preferences ? `Preference: ${preferences}` : "",
      budget ? `Budget up to ₹${budget}` : "",
      allergens.length ? `Allergens to avoid: ${allergens.join(", ")}` : "",
    ].filter(Boolean).join(" | ");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: contextualQuery,
          userLocation: location,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Search failed");
      }

      const newResults = data.data ?? [];
      onResultsChange(newResults);
      onSearchChange(true); 
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setShowFilters(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      setShowFilters(false);
    }
  };

  return (
    <section className="gold-sheen relative z-20 pb-10">
      
      {/* FILTER BACKDROP */}
      {showFilters && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity" />
      )}

      <div className={`mx-auto ${hasSearched ? "max-w-screen-lg" : "max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg"} px-4 ${hasSearched ? "pt-4 sm:pt-6" : "pt-6 sm:pt-8"} relative z-40`}>
        
        {!hasSearched && (
          <h1 className="text-2xl sm:text-3xl font-bold gold-gradient-text text-center sm:text-left mb-6">
            What are you in the mood for?
          </h1>
        )}
        
        {/* === SEARCH INTERFACE === */}
        <div className="relative" ref={filterRef}>
          
          {/* 1. SEARCH INPUT */}
          <div className="relative group z-40">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-3.8-3.8" strokeLinecap="round" />
                <circle cx="10.5" cy="10.5" r="6.5" />
              </svg>
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try 'Spicy Biryani', 'Date Night', or 'Comfort Food'..."
              className="w-full rounded-xl input-sheen bg-black/60 border border-zinc-800 focus:border-[var(--gold-400)] text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 pl-12 pr-32 py-3 outline-none transition shadow-lg"
            />

            {/* Right Buttons */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              
              {/* Mic */}
              {hasSupport && (
                <button
                  onClick={handleMicClick}
                  className={`p-2 rounded-lg transition-all ${
                    isListening 
                      ? "text-red-500 bg-red-500/10 animate-pulse" 
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>
                   </svg>
                </button>
              )}

              {/* Filter */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? "text-[var(--gold-400)] bg-zinc-800" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
                </svg>
              </button>

              {/* Search Button (with Status Indicator) */}
              <button
                onClick={handleSearch}
                disabled={loading || !location.trim()}
                className={`ml-0.5 p-2 rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center ${
                  !location.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : loading ? "bg-zinc-800 w-auto px-3" : "bg-[var(--gold-400)] hover:bg-[var(--gold-500)] text-black"
                }`}
              >
                {loading ? (
                   <span className="text-xs font-bold text-[var(--gold-300)] animate-pulse">Thinking...</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 2. PROGRESS INDICATOR (The "Canvas" - Visible when loading) */}
          {loading && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-[var(--gold-400)]/30 rounded-xl shadow-2xl">
                
                {/* Animated Icon */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold-400)]/10">
                  <div className="absolute h-full w-full rounded-full border-2 border-[var(--gold-400)] border-t-transparent animate-spin"></div>
                  <span className="text-xs">🤖</span>
                </div>

                {/* Text Step */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 animate-pulse truncate">
                    {loadingStep}
                  </p>
                  {/* Fake Progress Bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full w-1/2 bg-[var(--gold-400)] animate-progress-indeterminate"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. LOCATION BAR (With Autocomplete) */}
          {/* We show this below search bar so user can set context */}
          <div className="mt-4 flex flex-col md:flex-row gap-3 items-start md:items-center bg-zinc-900/40 p-2 rounded-xl border border-zinc-800/50">
             <div className="flex-1 w-full">
               <LocationAutocomplete 
                 value={location} 
                 onChange={onLocationChange} 
                 onLocationSelect={(loc) => onLocationChange(loc.name)} 
               />
             </div>
             
             <div className="hidden md:block text-zinc-700">|</div>

             <button
               type="button"
               onClick={onRequestLocation}
               disabled={isLocating}
               className="w-full md:w-auto rounded-lg border border-[var(--gold-500)]/30 bg-[var(--gold-500)]/10 text-xs font-medium text-[var(--gold-300)] px-4 py-2 hover:bg-[var(--gold-500)]/20 transition flex items-center justify-center gap-2 whitespace-nowrap"
             >
               {isLocating ? (
                 <span className="animate-pulse">Detecting...</span>
               ) : (
                 <><span>📍</span> Use Current Location</>
               )}
             </button>
          </div>

          {/* 4. FILTER POPUP */}
          {showFilters && (
            <div className="absolute top-full mt-2 w-full z-50 animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-[#0a0a0a] backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-5 ring-1 ring-white/10">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Refine Search</h3>
                  <button onClick={() => setShowFilters(false)} className="text-zinc-500 hover:text-white">✕</button>
                </div>

                <div className="flex flex-col space-y-5">
                  {/* Preferences */}
                  <div>
                    <span className="text-xs text-zinc-500 mb-2 block font-medium">DIETARY</span>
                    <div className="flex flex-wrap gap-2">
                      {["Veg", "Non veg", "Jain"].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => setPreferences(pref === preferences ? "" : pref)}
                          className={`text-sm py-1.5 px-4 rounded-lg border transition-all duration-200 ${
                            preferences === pref
                              ? "bg-[var(--gold-400)] text-black border-[var(--gold-400)] font-bold shadow-[0_0_10px_rgba(255,170,0,0.3)]"
                              : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget & Allergens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-zinc-500 mb-2 block font-medium">BUDGET (₹)</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="Max price"
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2 pl-7 pr-3 text-sm text-white focus:border-[var(--gold-400)] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-zinc-500 mb-2 block font-medium">ALLERGENS</span>
                      <div className="flex flex-wrap gap-2">
                        {allergenList.map((allergen) => (
                          <button
                            key={allergen}
                            onClick={() => handleAllergenChange(allergen)}
                            className={`text-xs py-1.5 px-3 rounded-md border transition-all ${
                              allergens.includes(allergen)
                                ? "bg-red-500/20 text-red-200 border-red-500/50"
                                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {allergen}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/50 flex justify-end">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="bg-[var(--gold-400)] hover:bg-[var(--gold-500)] text-black font-semibold text-sm py-2 px-6 rounded-lg shadow-lg transition-transform active:scale-95"
                  >
                    Apply Filters
                  </button>
                </div>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* Error Messages */}
      {error ? (
        <div className="mx-auto max-w-screen-md px-4 mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex items-center gap-2">
          ⚠️ {error}
        </div>
      ) : null}

      {/* === RESULTS SECTION === */}
      {/* We are only rendering results if passed from props to keep this component focused on search */}
      {results.length > 0 && (
        <div className="mx-auto max-w-screen-lg px-4 mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-semibold text-zinc-300 px-1">Top Recommendations</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((place, idx) => (
              <div key={`${place.name}-${idx}`} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-[var(--gold-400)]/50 hover:bg-zinc-900/80 flex flex-col h-full">
                
                <div className="flex items-start justify-between gap-3 mb-2">
                   <h3 className="font-bold text-base text-zinc-100 line-clamp-1">{place.name}</h3>
                   {place.rating && (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-[var(--gold-400)] bg-[var(--gold-400)]/10 px-2 py-0.5 rounded-md">
                        ★ {place.rating}
                      </span>
                   )}
                </div>

                <p className="text-sm text-zinc-400 line-clamp-2 mb-3 flex-1">{place.address || "Address not available"}</p>
                
                {place.categories?.length ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {place.categories.slice(0,3).map(cat => (
                        <span key={cat} className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                ) : null}
                
                {/* Footer Links */}
                <div className="mt-auto pt-3 border-t border-zinc-800/50 flex items-center justify-between text-xs font-medium">
                    {place.phone ? <span className="text-zinc-500">{place.phone}</span> : <span></span>}
                    
                    {place.website && (
                      <a href={place.website} target="_blank" rel="noreferrer" className="text-[var(--gold-300)] hover:underline flex items-center gap-1">
                        Visit Website ↗
                      </a>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}