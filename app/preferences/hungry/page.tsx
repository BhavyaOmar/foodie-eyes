"use client";
import { useState } from "react";
import Link from "next/link";

type Step = "mealType" | "filters" | "allergens";

export default function HungryFlow() {
  const [step, setStep] = useState<Step>("mealType");
  const [mealType, setMealType] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allergens, setAllergens] = useState<string[]>([]);

  const mealOptions = [
    { id: "full-meal", label: "Full Meal", emoji: "🍽️" },
    { id: "snacks", label: "Snacks", emoji: "🥨" },
    { id: "dessert", label: "Dessert", emoji: "🍰" },
    { id: "beverages", label: "Beverages", emoji: "☕" },
  ];

  const dietOptions = [
    { id: "veg", label: "Vegetarian" },
    { id: "non-veg", label: "Non-Vegetarian" },
    { id: "jain", label: "Jain" },
  ];

  const allergenOptions = [
    { id: "peanuts", label: "Peanuts" },
    { id: "tree-nuts", label: "Tree Nuts" },
    { id: "gluten", label: "Gluten" },
    { id: "dairy", label: "Dairy" },
    { id: "shellfish", label: "Shellfish" },
    { id: "eggs", label: "Eggs" },
  ];

  const handleMealSelect = (id: string) => {
    setMealType(id);
    setStep("filters");
  };

  const handleDietSelect = (id: string) => {
    setDietFilter(id);
    setStep("allergens");
  };

  const toggleAllergen = (id: string) => {
    setAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const query = new URLSearchParams({
      mealType: mealType || "",
      diet: dietFilter || "",
      allergens: allergens.join(","),
    });
    window.location.href = `/results?${query.toString()}`;
  };

  return (
    <main className="min-h-dvh bg-black">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/50 border-b border-zinc-800">
        <div className="mx-auto max-w-screen-sm sm:max-w-screen-md px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-zinc-400 hover:text-[var(--gold-300)] transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="gold-gradient-text text-lg font-semibold">
            What are you in the mood for?
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md px-4 py-6 sm:py-8">
        {/* Step 1: Meal Type */}
        {step === "mealType" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-4">
                What do you want to eat?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mealOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleMealSelect(option.id)}
                    className="group rounded-2xl p-[2px] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-300)]"
                  >
                    <div className="rounded-[1rem] card-surface bg-[var(--card-bg)] px-4 py-5 sm:py-6 text-center hover:bg-zinc-900/50 transition">
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <p className="text-[15px] sm:text-base font-medium text-zinc-100">
                        {option.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Diet Filters */}
        {step === "filters" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-4">
                Choose your diet preference
              </h2>
              <div className="space-y-2.5">
                {dietOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDietSelect(option.id)}
                    className={`w-full rounded-xl p-3 text-left transition-all duration-200 flex items-center gap-3 ${
                      dietFilter === option.id
                        ? "bg-[var(--gold-500)]/20 border-2 border-[var(--gold-300)]"
                        : "bg-zinc-900/40 border border-zinc-800 hover:border-[var(--gold-500)]/60"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition ${
                        dietFilter === option.id
                          ? "border-[var(--gold-300)] bg-[var(--gold-300)]"
                          : "border-zinc-600"
                      }`}
                    >
                      {dietFilter === option.id && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M2 5L4 7L8 3"
                            stroke="black"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[15px] sm:text-base text-zinc-100 font-medium">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Allergens */}
        {step === "allergens" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-2">
                Any allergens we should know?
              </h2>
              <p className="text-sm text-[var(--muted)] mb-4">
                {!isLoggedIn ? "Login to enable allergen filtering" : "Select your allergens to avoid"}
              </p>

              {!isLoggedIn ? (
                <div className="bg-zinc-900/50 border border-[var(--gold-500)]/40 rounded-2xl p-4 text-center mb-6">
                  <p className="text-sm text-zinc-300 mb-3">
                    Sign in to get personalized allergen preferences and safer food recommendations.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-[var(--gold-500)]/60 px-4 py-2 text-sm font-medium text-[var(--gold-300)] hover:border-[var(--gold-300)] transition"
                    onClick={() => setIsLoggedIn(true)} // Mock login
                  >
                    Sign in
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                  {allergenOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleAllergen(option.id)}
                      className={`rounded-xl p-3 text-center transition-all duration-200 text-[13px] sm:text-sm font-medium ${
                        allergens.includes(option.id)
                          ? "bg-[var(--gold-500)]/20 border-2 border-[var(--gold-300)] text-[var(--gold-300)]"
                          : "bg-zinc-900/40 border border-zinc-800 text-zinc-300 hover:border-[var(--gold-500)]/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep("filters")}
                className="flex-1 rounded-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-zinc-100 bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Submit Button - Visible in all steps after mealType */}
        {(step === "filters" || step === "allergens") && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-800">
            <button
              onClick={() =>
                step === "filters" ? setStep("mealType") : setStep("filters")
              }
              className="flex-1 rounded-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-zinc-100 bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition"
            >
              Back
            </button>
            {step === "allergens" && (
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-black bg-gradient-to-r from-[var(--gold-400)] to-[var(--gold-300)] hover:from-[var(--gold-300)] hover:to-[var(--gold-400)] transition font-semibold"
              >
                Find Food Spots Near Me
              </button>
            )}
            {step === "filters" && (
              <button
                onClick={() => setStep("allergens")}
                disabled={!dietFilter}
                className="flex-1 rounded-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-black bg-gradient-to-r from-[var(--gold-400)] to-[var(--gold-300)] hover:from-[var(--gold-300)] hover:to-[var(--gold-400)] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
