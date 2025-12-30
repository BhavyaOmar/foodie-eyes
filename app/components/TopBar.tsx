"use client";
import Link from "next/link";

type Props = {
  isSignedIn?: boolean;
  onSignIn?: () => void;
};

export default function TopBar({ isSignedIn = false, onSignIn }: Props) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/85 bg-white/90 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl px-4 py-4">
        {/* Top Row: Logo + Nav */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[var(--gold-300)] via-[var(--gold-400)] to-[var(--gold-500)]"/>
            <span className="gold-gradient-text text-base sm:text-lg font-semibold">Foodie Eyes</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#"
              className="hidden sm:inline-flex text-sm text-slate-700 hover:text-[var(--gold-500)] transition"
            >
              Log in
            </Link>
            <button
              onClick={onSignIn}
              className="inline-flex items-center rounded-full border border-[var(--gold-500)]/70 px-3 py-1.5 text-sm font-medium text-[var(--gold-500)] bg-white hover:bg-[var(--gold-500)] hover:text-white transition"
            >
              {isSignedIn ? "Account" : "Sign in"}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
