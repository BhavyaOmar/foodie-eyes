"use client";
import { useState } from "react";

type Props = {
  onClose: () => void;
  onSignIn: () => void;
};

export default function AuthModal({ onClose, onSignIn }: Props) {
  const [email, setEmail] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSignIn();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to Foodie Eyes</h2>
          <p className="text-zinc-400 text-sm">Save your favorite places and personalize your experience</p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:border-[var(--gold-400)] focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--gold-400)] hover:bg-[var(--gold-500)] text-black font-semibold transition active:scale-95"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-950 text-zinc-500">or continue as guest</span>
          </div>
        </div>

        {/* Guest Option */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-medium transition"
        >
          Continue as Guest
        </button>

        {/* Footer */}
        <p className="mt-6 text-xs text-center text-zinc-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
