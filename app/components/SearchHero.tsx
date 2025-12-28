"use client";
import { useState } from "react";

export default function SearchHero() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const allergenList = ["Dairy", "Gluten", "Nuts", "Soy"];

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
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21l-3.8-3.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <input
              id="foodie-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Spicy Biryani', 'Quiet Date Spot', or 'Comfort Food near me'..."
              className="w-full rounded-full input-sheen bg-black/50 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 pl-10 pr-12 py-2.5 sm:py-3 outline-none transition"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 p-2"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showFilters && (
            <div className="absolute top-full mt-2 w-full bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-zinc-800/80 z-10">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100 mb-2">
                      Preferences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {["Veg", "Non veg", "Jain"].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => setPreferences(pref)}
                          className={`text-xs py-1 px-2.5 rounded-full border ${
                            preferences === pref
                              ? "bg-[var(--gold-400)] text-black border-[var(--gold-400)]"
                              : "border-zinc-700 text-zinc-300"
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100 mb-2">
                      Budget
                    </h3>
                    <input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter value in rupees"
                      className="w-full rounded-full input-sheen bg-black/50 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 px-4 py-2 outline-none transition"
                    />
                  </div>
                </div>
                <hr className="border-zinc-700" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">
                    Allergens
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allergenList.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => handleAllergenChange(allergen)}
                        className={`text-xs py-1 px-2.5 rounded-full border ${
                          allergens.includes(allergen)
                            ? "bg-[var(--gold-400)] text-black border-[var(--gold-400)]"
                            : "border-zinc-700 text-zinc-300"
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Other"
                      className="w-full rounded-full input-sheen bg-black/50 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 px-4 py-2 outline-none transition mt-2"
                    />
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