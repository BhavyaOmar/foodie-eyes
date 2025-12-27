"use client";
import { useState } from "react";

export default function SearchHero() {
  const [query, setQuery] = useState("");

  return (
    <section className="gold-sheen">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 pt-6 pb-4 sm:pt-10">
        <h1 className="text-xl sm:text-2xl font-semibold gold-gradient-text">
          What are you in the mood for?
        </h1>
        <div className="mt-3 sm:mt-4">
          <label className="sr-only" htmlFor="foodie-search">Search</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </span>
            <input
              id="foodie-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Spicy Biryani', 'Quiet Date Spot', or 'Comfort Food near me'..."
              className="w-full rounded-full input-sheen bg-black/50 border border-zinc-800/80 focus:border-[var(--gold-400)]/60 focus:ring-2 focus:ring-[var(--gold-300)] text-[15px] sm:text-base text-zinc-100 placeholder:text-zinc-500 pl-10 pr-4 py-2.5 sm:py-3 outline-none transition"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
