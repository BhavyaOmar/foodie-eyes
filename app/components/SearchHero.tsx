"use client";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import useSpeechRecognition from "@/app/hooks/useSpeechRecognition";

// --- TYPES ---
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
  onPlaceSelect: (place: Place) => void;
  bookmarks: string[];
  onBookmark: (placeName: string) => void;
  moodPrompt?: string;
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
  hasSearched,
  onPlaceSelect,
  bookmarks,
  onBookmark,
  moodPrompt
}: Props) {
  const [query, setQuery] = useState(moodPrompt || "");
  const [showFilters, setShowFilters] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");
  
  // Filter States
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState("");

  const allergenList = ["Dairy", "Gluten", "Nuts", "Soy"];
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Optimistic Loading Steps
  const steps = [
    "Analyzing your mood...",
    "Scouting Google Maps for top spots...",
    "Reading menus & checking prices...",
    "Gemini is picking the winners..."
  ];

  const { text, isListening, startListening, stopListening, hasSupport } = useSpeechRecognition();

  // 1. Update query when mood prompt changes
  useEffect(() => {
    if (moodPrompt) {
      setQuery(moodPrompt);
    }
  }, [moodPrompt]);

  // 2. Sync Voice to Text
  useEffect(() => {
    if (text) setQuery(text);
  }, [text]);

  // 3. Cycle Loading Messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let stepIndex = 0;
      setLoadingStep(steps[0]);
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        if (stepIndex < steps.length) {
            setLoadingStep(steps[stepIndex]);
        }
      }, 2500);
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
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAllergenChange = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen]
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setError("");
    setFallbackMessage("");
    setLoading(true);
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
          userLocation: location || "India",
        }),
      });

      const data = await response.json();

      // Handle 404 specifically: show fallback + similar items if provided
      if (response.status === 404) {
        const similar = data.similarItems || data.suggestions || [];
        setFallbackMessage(
          "The current food item seems to be unavailable. Here are some similar items you may like."
        );
        onResultsChange(Array.isArray(similar) ? similar : []);
        onSearchChange(true);
        return;
      }

      if (data.context && data.context.isFallback) {
         setFallbackMessage(
           data.context.message || "The current food item seems to be unavailable. Here are some similar items you may like."
         );
      }

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Search failed");
      }

      const newResults = data.data ?? [];
      onResultsChange(newResults);
      onSearchChange(true); 
      
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
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
      {showFilters}

      <div className={`mx-auto ${hasSearched ? "max-w-screen-lg" : "max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg"} px-4 ${hasSearched ? "pt-4 sm:pt-6" : "pt-6 sm:pt-8"} relative z-10`}>
        
        {!hasSearched && (
          <h1 className="text-2xl sm:text-3xl font-bold gold-gradient-text text-center sm:text-left mb-6">
            What are you in the mood for?
          </h1>
        )}

        {/* === SEARCH INTERFACE === */}
        <div className="relative" ref={filterRef}>
          
          {/* 1. SEARCH INPUT */}
          <div className="relative group z-40">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
              placeholder={moodPrompt ? "Tell us more about what you want..." : "Try 'Spicy Biryani', 'Date Night', or 'Comfort Food'..."}
              className="w-full rounded-xl bg-white border border-[var(--border-subtle)] focus:border-[var(--gold-400)] text-sm sm:text-base text-slate-900 placeholder:text-slate-400 pl-12 pr-32 py-3 outline-none transition shadow-md"
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
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
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
                  showFilters ? "text-[var(--gold-500)] bg-orange-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
                </svg>
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`ml-0.5 p-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center ${
                  loading ? "bg-slate-200 w-auto px-3" : "bg-[var(--gold-400)] hover:bg-[var(--gold-500)] text-white"
                }`}
              >
                {loading ? (
                   <span className="text-xs font-bold text-white animate-pulse">Thinking...</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 2. ACTIVE FILTER CHIPS */}
          {(preferences || budget || allergens.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {preferences && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--gold-400)]/10 border border-[var(--gold-400)]/30 text-sm text-slate-700">
                  <span className="font-medium">Dietary: {preferences}</span>
                  <button
                    onClick={() => setPreferences("")}
                    className="text-slate-500 hover:text-slate-800 transition"
                    title="Remove filter"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              
              {budget && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--gold-400)]/10 border border-[var(--gold-400)]/30 text-sm text-slate-700">
                  <span className="font-medium">Budget: ₹{budget}</span>
                  <button
                    onClick={() => setBudget("")}
                    className="text-slate-500 hover:text-slate-800 transition"
                    title="Remove filter"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              
              {allergens.map((allergen) => (
                <div
                  key={allergen}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
                >
                  <span className="font-medium">No {allergen}</span>
                  <button
                    onClick={() => handleAllergenChange(allergen)}
                    className="text-red-500 hover:text-red-800 transition"
                    title="Remove filter"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 3. PROGRESS INDICATOR */}
          {loading && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 p-3 bg-white border border-[var(--border-subtle)] rounded-xl shadow-lg">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold-400)]/15">
                  <div className="absolute h-full w-full rounded-full border-2 border-[var(--gold-400)] border-t-transparent animate-spin"></div>
                  <span className="text-xs"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 animate-pulse truncate">
                    {loadingStep}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-1/2 bg-[var(--gold-400)] animate-progress-indeterminate"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. FILTER POPUP */}
          {showFilters && (
            <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:top-24 sm:max-w-md z-100 animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-white border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 ring-1 ring-orange-100">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Refine Search</h3>
                  <button onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-slate-800">✕</button>
                </div>

                <div className="flex flex-col space-y-5">
                  <div>
                    <span className="text-xs text-slate-500 mb-2 block font-medium">DIETARY</span>
                    <div className="flex flex-wrap gap-2">
                      {["Veg", "Non veg", "Jain"].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => setPreferences(pref === preferences ? "" : pref)}
                          className={`text-sm py-1.5 px-4 rounded-lg border transition-all duration-200 ${
                            preferences === pref
                              ? "bg-[var(--gold-400)] text-white border-[var(--gold-400)] font-bold shadow-[0_0_10px_rgba(249,115,22,0.25)]"
                              : "border-[var(--border-subtle)] bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 mb-2 block font-medium">BUDGET (₹)</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="Max price"
                          className="w-full bg-white border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-sm text-slate-800 focus:border-[var(--gold-400)] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 mb-2 block font-medium">ALLERGENS</span>
                      <div className="flex flex-wrap gap-2">
                        {allergenList.map((allergen) => (
                          <button
                            key={allergen}
                            onClick={() => handleAllergenChange(allergen)}
                            className={`text-xs py-1.5 px-3 rounded-md border transition-all ${
                              allergens.includes(allergen)
                                ? "bg-red-500/10 text-red-600 border-red-500/40"
                                : "border-[var(--border-subtle)] bg-white text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {allergen}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex justify-end">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="bg-[var(--gold-400)] hover:bg-[var(--gold-500)] text-white font-semibold text-sm py-2 px-6 rounded-lg shadow-md transition-transform active:scale-95"
                  >
                    Apply Filters
                  </button>
                </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Error / Fallback Messages */}
      {error && (
        <div className="mx-auto max-w-screen-md px-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}
      
      {hasSearched && fallbackMessage && !loading && (
        <div className="mx-auto max-w-screen-lg px-4 mt-6 animate-in fade-in slide-in-from-top-2">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 items-start">
             <span className="text-xl">🤔</span>
             <div>
               <h3 className="text-orange-700 font-semibold text-sm">Not available</h3>
               <p className="text-orange-700/80 text-sm mt-0.5">{fallbackMessage}</p>
             </div>
          </div>
        </div>
      )}

      {/* === RESULTS SECTION === */}
      {results.length > 0 && (
        <div className="mx-auto max-w-screen-lg px-4 mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-semibold text-slate-800 px-1">Top Recommendations</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((place, idx) => {
              const uniqueId = `${place.name}-${idx}`;
              return (
              <div 
                key={uniqueId} 
                className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--gold-400)]/60 hover:bg-orange-50 flex flex-col h-full cursor-pointer hover:shadow-lg hover:shadow-orange-100"
                onClick={() => onPlaceSelect(place)}
              >
                
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1 flex-1">{place.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {place.rating && (
                         <span className="flex items-center gap-1 text-xs font-bold text-[var(--gold-500)] bg-[var(--gold-400)]/15 px-2 py-0.5 rounded-md">
                           ★ {place.rating}
                         </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookmark(uniqueId);
                        }}
                        className={`p-1.5 rounded transition ${
                          bookmarks.includes(uniqueId)
                            ? "bg-orange-100 text-[var(--gold-500)]"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                        title="Bookmark this place"
                      >
                         {bookmarks.includes(place.name) ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3l-7 3Z"/>
                            </svg>
                         ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                         )}
                      </button>
                    </div>
                </div>

                {/* UPDATED: Famous Dishes - Showing only the FIRST one as 'Must Try' */}
                {place.famous_dishes && place.famous_dishes.length > 0 && (
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--gold-400)]/10 border border-[var(--gold-400)]/20 text-xs font-medium text-[var(--gold-500)]">
                      <span>🍽️</span>
                      <span className="truncate max-w-[200px]">
                        Must Try: <span className="text-[var(--gold-500)] font-bold">{place.famous_dishes[0]}</span>
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-1">{place.address || "Address not available"}</p>
                
                {place.categories?.length ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {place.categories.slice(0,3).map(cat => (
                        <span key={cat} className="text-[10px] uppercase tracking-wider text-slate-500 border border-[var(--border-subtle)] px-2 py-0.5 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                ) : null}
                
                <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center">
                    <span className="flex-1 text-xs font-medium text-[var(--gold-500)] hover:text-[var(--gold-400)] transition cursor-pointer">
                      View Details
                    </span>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </section>
  );
}