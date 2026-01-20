"use client";
import LocationAutocomplete from "./LocationAutocomplete";

type LocationModalProps = {
  isOpen: boolean;
  locationDraft: string;
  isLocating: boolean;
  error?: string;
  onClose: () => void;
  onUseCurrent: () => void;
  onDraftChange: (value: string) => void;
  onConfirm: () => void;
};

export default function LocationModal({
  isOpen,
  locationDraft,
  isLocating,
  error,
  onClose,
  onUseCurrent,
  onDraftChange,
  onConfirm,
}: LocationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm px-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Set your location</h2>
            <p className="text-sm text-slate-500">Personalize recommendations by telling us where you are.</p>
          </div>

          <div className="space-y-3">
            <LocationAutocomplete
              value={locationDraft}
              onChange={onDraftChange}
              onLocationSelect={(loc) => onDraftChange(loc.name)}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={onUseCurrent}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--gold-400)]/60 bg-[var(--gold-400)]/10 px-3 py-2 text-sm font-semibold text-[var(--gold-500)] hover:bg-[var(--gold-400)]/20 transition disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">my_location</span>
                {isLocating ? "Locating..." : "Use current location"}
              </button>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!locationDraft.trim()}
                  className="rounded-lg bg-[var(--gold-400)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--gold-500)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Set location
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="material-symbols-outlined text-base">error</span>
                <span className="leading-snug">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
