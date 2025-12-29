"use client";
import Link from "next/link";
import LocationAutocomplete from "./LocationAutocomplete";

type Props = {
  location: string;
  isLocating: boolean;
  onRequestLocation: () => void;
  onLocationChange: (value: string) => void;
};

export default function TopBar({ location, isLocating, onRequestLocation, onLocationChange }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/50 border-b border-zinc-800">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl px-4 py-4">
        {/* Top Row: Logo + Nav */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--gold-300)] via-[var(--gold-400)] to-[var(--gold-500)]"/>
            <span className="gold-gradient-text text-base sm:text-lg font-semibold">Foodie Eyes</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#"
              className="hidden sm:inline-flex text-sm text-zinc-200 hover:text-[var(--gold-300)] transition"
            >
              Log in
            </Link>
            <Link
              href="#"
              className="inline-flex items-center rounded-full border border-[var(--gold-500)]/60 px-3 py-1.5 text-sm font-medium text-[var(--gold-300)] hover:border-[var(--gold-300)] hover:text-[var(--gold-300)] transition"
            >
              Sign in
            </Link>
          </nav>
        </div>

        {/* Location Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <LocationAutocomplete 
              onLocationSelect={(loc) => {
                onLocationChange(loc.name);
              }}
            />
          </div>
          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocating}
            className="shrink-0 rounded-lg border border-[var(--gold-500)]/30 bg-[var(--gold-500)]/10 text-xs font-medium text-[var(--gold-300)] px-3 py-2 hover:bg-[var(--gold-500)]/20 transition disabled:opacity-60"
            title="Use current location"
          >
            {isLocating ? "..." : "📍"}
          </button>
        </div>
      </div>
    </header>
  );
}
