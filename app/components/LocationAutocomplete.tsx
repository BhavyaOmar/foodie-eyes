"use client";
import { useState, useEffect, useRef } from "react";

interface LocationAutocompleteProps {
  value: string; // <--- 1. Accept value from parent
  onChange: (value: string) => void; // <--- 2. Send text updates to parent
  onLocationSelect: (location: { name: string; lat: number; lng: number }) => void;
}

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  onLocationSelect 
}: LocationAutocompleteProps) {
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldPreventOpen, setShouldPreventOpen] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3. Sync internal query with Parent Value
  // If parent says "New Delhi" (via GPS), we show "New Delhi"
  useEffect(() => {
    // Only search if the user typed this, not if it came from GPS logic
    // We can rely on 'shouldPreventOpen' or just check if suggestions are needed
  }, [value]);

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal); // Update parent immediately
    setShouldPreventOpen(false);

    // Debounce API Call
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (newVal.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${newVal}&countrycodes=in&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Location search failed", error);
      }
    }, 1000);
  };

  // Handle Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place: any) => {
    setShouldPreventOpen(true);
    setIsOpen(false);
    
    // Clean up the name (OpenStreetMap names are very long)
    // Example: "Connaught Place, New Delhi, Delhi, 110001, India" -> "Connaught Place"
    const shortName = place.display_name.split(",")[0]; 

    onChange(shortName); // Update Input Text
    
    // Send Full Data
    onLocationSelect({
      name: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        
        <input
          type="text"
          value={value} // <--- Controlled by Parent
          onChange={handleInputChange}
          placeholder="Enter location (e.g. Connaught Place)"
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-[var(--gold-400)] focus:outline-none transition-colors"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((place: any) => (
            <li
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-0 flex items-start gap-2"
            >
              <span className="mt-0.5 text-zinc-500">📍</span>
              <span className="line-clamp-2">{place.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}