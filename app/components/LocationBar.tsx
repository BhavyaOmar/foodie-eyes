"use client";
import LocationAutocomplete from "./LocationAutocomplete";

type Props = {
  location: string;
  isLocating: boolean;
  onRequestLocation: () => void;
  onLocationChange: (value: string) => void;
};

export default function LocationBar({
  location,
  isLocating,
  onRequestLocation,
  onLocationChange,
}: Props) {
  return (
    <div className="sticky top-[64px] z-30 bg-white/90 backdrop-blur border-b border-[var(--border-subtle)] shadow-sm">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <LocationAutocomplete
              value={location}
              onChange={onLocationChange}
              onLocationSelect={(loc) => onLocationChange(loc.name)}
            />
          </div>

          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocating}
            className="shrink-0 rounded-lg border border-[var(--gold-500)]/50 bg-[var(--gold-400)]/10 text-xs font-medium text-[var(--gold-500)] px-3 py-2 hover:bg-[var(--gold-400)]/20 transition disabled:opacity-60 whitespace-nowrap"
            title="Use current location"
          >
            {isLocating ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span className="material-symbols-outlined text-lg">my_location</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
