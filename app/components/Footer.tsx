"use client";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border-subtle)]">

        {/* Divider */}
        <div className="border-t border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row items-center justify-between h-10">
            <p className="text-center w-full text-xs text-slate-500">© 2024 Foodie Eyes. All rights reserved.</p>
            </div>
        </div>

    </footer>
  );
}
