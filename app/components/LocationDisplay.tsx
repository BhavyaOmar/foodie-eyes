"use client";

type Props = {
  location: string;
  onChangeClick: () => void;
};

export default function LocationDisplay({ location, onChangeClick }: Props) {
  const hasLocation = location.trim().length > 0;

  return (
    <div className="sticky top-[64px] z-30 bg-white/90 backdrop-blur border-b border-[var(--border-subtle)] shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-[var(--gold-500)]">location_on</span>
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-400">Location</div>
              <div className={`truncate text-xs sm:text-sm font-semibold ${hasLocation ? "text-slate-800" : "text-slate-500"}`}>
                {hasLocation ? location : "Add your location to get better picks"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangeClick}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[var(--gold-300)] hover:text-[var(--gold-500)] transition"
          >
            <span className="material-symbols-outlined text-[18px]">edit_location_alt</span>
            <span>{hasLocation ? "Change" : "Set"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
