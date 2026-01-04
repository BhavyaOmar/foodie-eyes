"use client";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import AuthModal from "./AuthModal";
import SideDrawer from "./SideDrawer";
import { MdHistory, MdBookmark } from "react-icons/md";
// --- Mock Data Imports (Replace with your actual hooks later) ---
// import { useHistory } from "@/app/hooks/useHistory";
// import { useBookmarks } from "@/app/hooks/useBookmarks";

type TopBarProps = {
  location?: string;
};

export default function TopBar({ location = "" }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Modals & Drawers State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Ref to close dropdown when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileMenuOpen(false);
      setIsLogoutConfirmOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!mounted) return <header className="h-20 bg-white/90" />;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/85 bg-white/90 border-b border-[var(--border-subtle)]">
        <div className="mx-auto max-w-screen-xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* LOGO */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--gold-300)] via-[var(--gold-400)] to-[var(--gold-500)] shadow-sm"/>
              <span className="gold-gradient-text text-xl font-bold tracking-tight">Foodie Eyes</span>
            </div>

            {/* ACTION AREA */}
            <nav className="flex items-center gap-4 relative">
              {loading ? (
                <div className="h-10 w-28 bg-slate-100 rounded-full animate-pulse" />
              ) : user ? (
                // --- LOGGED IN STATE ---
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300" ref={menuRef}>
                  
                  {/* 1. AVATAR (Left) - Toggles Popup */}
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`relative p-0.5 rounded-full transition-all ${isProfileMenuOpen ? 'ring-2 ring-[var(--gold-400)]' : 'hover:ring-2 hover:ring-slate-200'}`}
                  >
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.email}`} 
                      alt="Profile" 
                      className="w-11 h-11 rounded-full border border-white shadow-md bg-slate-100 object-cover"
                    />
                  </button>

                  {/* 2. NAME & LOGOUT (Right) */}
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-sm font-bold text-slate-800 mb-0.5">
                      {user.displayName?.split(" ")[0] || "Foodie"}
                    </span>
                    <button 
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      className="text-[10px] text-slate-400 font-medium hover:text-red-500 hover:underline transition-colors"
                    >
                      Log out
                    </button>
                  </div>

                  {/* 3. PROFILE POPUP (Google Style) */}
                  {isProfileMenuOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in zoom-in-95 duration-100 origin-top-right">
                      {/* Popup Header */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center">
                        <span className="font-bold text-slate-800 text-lg">{user.displayName}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                        {location && (
                          <span className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <span>📍</span>
                            {location}
                          </span>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={() => { setIsHistoryOpen(true); setIsProfileMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[var(--gold-600)] rounded-xl transition-colors text-left"
                        >
                          <MdHistory size={24} color="black" />
        <span>History</span>
                        </button>
                        
                        <button 
                          onClick={() => { setIsBookmarksOpen(true); setIsProfileMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[var(--gold-600)] rounded-xl transition-colors text-left"
                        >
                          <MdBookmark size={24} color="orange" />
        <span>Saved</span>
                        </button>
                      </div>

                      {/* Popup Footer */}
                      <div className="p-2 border-t border-slate-100">
                        <button 
                          onClick={() => setIsLogoutConfirmOpen(true)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                // --- LOGGED OUT STATE ---
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Get Started
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* --- DRAWERS & MODALS --- */}

      {/* 1. Login Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* 2. History Side Drawer */}
      <SideDrawer 
        title="Recently Viewed" 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
      >
        {/* Placeholder Content */}
        <div className="text-center text-slate-400 mt-10">
           <p className="text-4xl mb-2">📜</p>
           <p>Your browsing history will appear here.</p>
           {/* You will map through your historyItems here later */}
        </div>
      </SideDrawer>

      {/* 3. Bookmarks Side Drawer */}
      <SideDrawer 
        title="Saved Bookmarks" 
        isOpen={isBookmarksOpen} 
        onClose={() => setIsBookmarksOpen(false)}
      >
        {/* Placeholder Content */}
        <div className="text-center text-slate-400 mt-10">
           <p className="text-4xl mb-2">🔖</p>
           <p>Your saved places will appear here.</p>
           {/* You will map through your savedPlaces here later */}
        </div>
      </SideDrawer>

      {/* 4. Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-3 border-b border-slate-100">
              <h2 className="text-center text-lg font-bold text-slate-900">Confirm Logout</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Are you sure you want to log out? Your saved locations and bookmarks will still be available when you log back in.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors active:scale-95"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}