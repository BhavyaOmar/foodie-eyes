"use client";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import useSpeechRecognition from "@/app/hooks/useSpeechRecognition";
import { useUserAuth } from "@/app/context/AuthContext";
import { getSmallGreeting, getMainHeadline, getSearchPlaceholder } from "@/app/utils/dynamicText";

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
  note?: string;
  tip?: string;
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
  onBookmark: (place: Place) => void;
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
  const { user } = useUserAuth();
  
  // Dynamic Text States
  const [greeting, setGreeting] = useState("Hello!");
  const [headline, setHeadline] = useState("What are you in the mood for?");
  const [placeholderText, setPlaceholderText] = useState("Try 'Spicy Biryani', 'Date Night', or 'Comfort Food'...");

  const [query, setQuery] = useState(moodPrompt || "");
  const [showFilters, setShowFilters] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");
  
  // Filter States
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState(""); 
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState("");

  const allergenList = ["Dairy", "Gluten", "Nuts", "Soy"]; // Presets
  const filterRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optimistic Loading Steps
  const steps = [
    "Analyzing your mood...",
    "Scouting Google Maps...",
    "Reading menus & checking prices...",
    "Groq is picking the winners..."
  ];

  const { text, isListening, startListening, stopListening, hasSupport } = useSpeechRecognition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const isTouchDevice = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  // Auto-expand textarea height based on content
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (inputRef.current && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.max(inputRef.current.scrollHeight, 40)}px`;
    }
  };

  // 1. Initialize Dynamic Texts based on User & Time
  useEffect(() => {
    const userName = user?.displayName?.split(" ")[0] || "Foodie";
    setGreeting(getSmallGreeting(userName));
    setHeadline(getMainHeadline());
    setPlaceholderText(getSearchPlaceholder());
  }, [user]);

  // 2. Update query when mood prompt changes
  useEffect(() => {
    if (moodPrompt) {
      setQuery(moodPrompt);
      // Focus input and move caret to end for better mobile UX
      setTimeout(() => {
        if (inputRef.current) {
          try {
            inputRef.current.focus({ preventScroll: true } as any);
            const len = moodPrompt.length;
            (inputRef.current as HTMLTextAreaElement).setSelectionRange(len, len);
            // Trigger height adjustment
            const textarea = inputRef.current as HTMLTextAreaElement;
            textarea.style.height = "auto";
            textarea.style.height = `${Math.max(textarea.scrollHeight, 40)}px`;
          } catch {
            // ignore selection errors on some browsers
          }
        }
      }, 50);
    }
  }, [moodPrompt]);

  // 3. Sync Voice to Text
  useEffect(() => {
    if (text) setQuery(text);
  }, [text]);

  // 4. Cycle Loading Messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let stepIndex = 0;
      setLoadingStep(steps[0]);
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        setLoadingStep(steps[stepIndex]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 5. Handle outside clicks for filters
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

  // Toggle for both presets and custom items
  const handleAllergenChange = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen]
    );
  };

  // Logic to add custom input
  const handleAddCustomAllergen = () => {
    const val = customAllergen.trim();
    if (val && !allergens.includes(val)) {
      setAllergens((prev) => [...prev, val]);
      setCustomAllergen("");
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!location.trim()) {
      setError("Please enter a location before searching.");
      return;
    }
    
    // Abort previous requests
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      console.log("🔎 Searching", { contextualQuery, location });
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: contextualQuery,
          userLocation: location,
        }),
        signal: controller.signal
      });

      const data = await response.json();
      console.log("📥 /api/agent response", { status: response.status, ok: response.ok, data });

      // Handle 404 specifically
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
      console.log("📦 results", { count: newResults.length });
      onResultsChange(newResults);
      onSearchChange(true); 
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("❌ Search error", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
      setShowFilters(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        
        {/* DYNAMIC HEADER SECTION */}
        {!hasSearched && (
          <div className="mb-6 text-center sm:text-left">
            <p className="text-xs sm:text-sm font-semibold text-orange-600 uppercase tracking-wider mb-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {greeting}
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gold-gradient-text animate-in fade-in slide-in-from-bottom-3 duration-700">
              {headline}
            </h1>
          </div>
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

            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={moodPrompt ? "Tell us more about what you want..." : placeholderText}
              rows={1}
              className="w-full rounded-xl bg-white border border-[var(--border-subtle)] focus:border-[var(--gold-400)] text-xs sm:text-sm md:text-base text-slate-900 placeholder:text-slate-400 pl-12 pr-32 py-3 outline-none transition shadow-md min-h-[40px] max-h-[200px] resize-none overflow-hidden"
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
                  <button onClick={() => setPreferences("")} className="text-slate-500 hover:text-slate-800 transition">
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
                  <button onClick={() => setBudget("")} className="text-slate-500 hover:text-slate-800 transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              
              {allergens.map((allergen) => (
                <div key={allergen} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <span className="font-medium">No {allergen}</span>
                  <button onClick={() => handleAllergenChange(allergen)} className="text-red-500 hover:text-red-800 transition">
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
                  <button onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-slate-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
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
                      
                      {/* PRESET ALLERGENS */}
                      <div className="flex flex-wrap gap-2 mb-2">
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

                      {/* NEW: CUSTOM ALLERGEN INPUT */}
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={customAllergen}
                            onChange={(e) => setCustomAllergen(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCustomAllergen()}
                            placeholder="Other (e.g. Garlic)"
                            className="w-full bg-white border border-[var(--border-subtle)] rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:border-[var(--gold-400)] focus:outline-none transition-colors"
                          />
                          <button 
                            onClick={handleAddCustomAllergen}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg px-3 flex items-center justify-center transition-colors"
                          >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                               <line x1="12" y1="5" x2="12" y2="19"></line>
                               <line x1="5" y1="12" x2="19" y2="12"></line>
                             </svg>
                          </button>
                      </div>

                      {/* SHOW CUSTOM ALLERGENS SELECTED */}
                      {allergens.filter(a => !allergenList.includes(a)).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                             {allergens.filter(a => !allergenList.includes(a)).map(custom => (
                                <div key={custom} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 font-medium">
                                   {custom}
                                   <button onClick={() => handleAllergenChange(custom)} className="hover:text-red-900">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                         <line x1="18" y1="6" x2="6" y2="18" />
                                         <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                   </button>
                                </div>
                             ))}
                          </div>
                      )}

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
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <circle cx="12" cy="12" r="10" />
             <line x1="12" y1="8" x2="12" y2="12" />
             <line x1="12" y1="16" x2="12.01" y2="16" />
           </svg>
           {error}
        </div>
      )}
      
      {hasSearched && fallbackMessage && !loading && (
        <div className="mx-auto max-w-screen-lg px-4 mt-6 animate-in fade-in slide-in-from-top-2">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {place.rating}
                          </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookmark(place);
                        }}
                        className={`p-1.5 rounded transition ${
                          bookmarks.includes(place.name)
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

                {place.famous_dishes && place.famous_dishes.length > 0 && (
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--gold-400)]/10 border border-[var(--gold-400)]/20 text-xs font-medium text-[var(--gold-500)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                           <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                           <path d="M7 2v20" />
                           <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                      </svg>
                      <span className="truncate max-w-[200px]">
                        Must Try: <span className="text-[var(--gold-500)] font-bold">{place.famous_dishes[0]}</span>
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-1">{place.address || "Address not available"}</p>

                {place.tip && (
                  <p className="text-xs text-slate-600 mb-3 px-2.5 py-1.5 bg-amber-50 rounded-md border border-amber-200">💡 {place.tip}</p>
                )}
                
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