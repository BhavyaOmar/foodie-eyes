"use client";
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/50 border-b border-zinc-800">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl px-4 py-3 flex items-center justify-between">
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
    </header>
  );
}
