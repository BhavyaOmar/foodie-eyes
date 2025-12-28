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

  useEffect(() => {
    if (text) setQuery(text);
  }, [text]);

  const handleMicClick = () => {
    isListening ? stopListening() : startListening();
  };

  const handleAllergenChange = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen]
    );
  };

  // --- NEW: Handle Search Action ---
  const handleSearch = () => {
    if (!query.trim()) return;
    console.log("Searching for:", query, { preferences, budget, allergens });
    // TODO: Call your /api/agent here
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      setShowFilters(false); // Close filters on search
    }
  };

  return (
    <section className="gold-sheen relative z-20">
      
      {/* 1. BACKDROP (Closes filter when clicking outside) */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" 
          onClick={() => setShowFilters(false)}
        />
      )}

      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 pt-6 pb-4 sm:pt-10 relative z-40">
        <h1 className="text-xl sm:text-2xl font-semibold gold-gradient-text text-center sm:text-left">
          What are you in the mood for?
        </h1>
        
        <div className="mt-3 sm:mt-4 relative">
          
          {/* SEARCH BAR CONTAINER */}
          <div className="relative group z-40">
            {/* Left Search Icon */}
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-3.8-3.8" strokeLinecap="round" />
                <circle cx="10.5" cy="10.5" r="6.5" />
              </svg>
            </span>

            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown} // Listen for Enter key
              placeholder="Try 'Spicy Biryani' or 'Quiet Cafe'..."
              // Increased padding (pr-36) to make room for 3 buttons
              className="w-full rounded-full input-sheen bg-black/60 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 pl-10 pr-36 py-3 outline-none transition shadow-lg"
            />

            {/* Right Actions Container */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              
              {/* 1. MIC BUTTON */}
              {hasSupport && (
                <button
                  onClick={handleMicClick}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isListening 
                      ? "text-red-500 bg-red-500/10 animate-pulse" 
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  }`}
                  title="Voice Search"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z"/>
                   </svg>
                </button>
              )}

              {/* 2. FILTER BUTTON */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors ${
                  showFilters ? "text-[var(--gold-400)] bg-zinc-800" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
                title="Filters"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
                </svg>
              </button>

              {/* 3. SEND/SEARCH BUTTON (New) */}
              <button
                onClick={handleSearch}
                className="bg-[var(--gold-400)] text-black p-2 rounded-full hover:bg-[var(--gold-500)] transition-transform active:scale-95 shadow-lg"
                title="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* THE POPUP (Now Above) */}
          {showFilters && (
            <div className="absolute bottom-full mb-3 w-full sm:w-[105%] sm:-left-[2.5%] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-[#0a0a0a] backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-5 ring-1 ring-white/10">
                
                {/* Header */}
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

                {/* Apply Button */}
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
    </section>
  );
}