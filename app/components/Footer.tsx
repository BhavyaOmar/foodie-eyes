"use client";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border-subtle)]">
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded bg-gradient-to-br from-[var(--gold-300)] via-[var(--gold-400)] to-[var(--gold-500)]" />
              <span className="gold-gradient-text text-sm font-semibold">Foodie Eyes</span>
            </div>
            <p className="text-xs text-slate-500">Discover amazing food places near you</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Browse Places
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  My Bookmarks
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Trending
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-600 hover:text-[var(--gold-500)] transition">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-subtle)] pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2024 Foodie Eyes. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-500 hover:text-[var(--gold-500)] transition">
                <span className="material-symbols-outlined text-base">public</span>
              </a>
              <a href="#" className="text-slate-500 hover:text-[var(--gold-500)] transition">
                <span className="material-symbols-outlined text-base">language</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
