"use client";
import { useState, useEffect, useRef } from "react";
import { useUserAuth } from "@/app/context/AuthContext"; // 1. Use Global Auth
import AuthModal from "./AuthModal";
import SideDrawer from "./SideDrawer";
import { MdBookmark } from "react-icons/md";
import Image from 'next/image';
import { useBookmarks } from "@/app/hooks/useBookmarks";

type TopBarProps = {
  location?: string;
  onReset?: () => void;
};

export default function TopBar({ location = "", onReset }: TopBarProps) {
  // 2. Get User & Loading from Context (No more manual listener needed!)
  const { user, loading, logOut } = useUserAuth(); 
  const [mounted, setMounted] = useState(false);
  
  // 3. FIXED: No argument needed here anymore
  const { bookmarks, removeBookmark } = useBookmarks();
  
  // Modals & Drawers State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Ref to close dropdown when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logOut(); // Use context logout
      setIsProfileMenuOpen(false);
      setIsLogoutConfirmOpen(false);
      // Reset the app state and reload page
      if (onReset) onReset();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
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
            <button 
              onClick={() => {
                if (onReset) onReset();
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/foodie-eyes.svg"
                alt="foodie-eyes"
                width={200}
                height={180}
                priority // Added for LCP
                className="w-24 h-auto sm:w-40 md:w-48 lg:w-56"
              />
            </button>

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
                      src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user.displayName?.split(" ")[0] || user.email}`} 
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

      {/* 2. Bookmarks Side Drawer */}
      <SideDrawer 
        title="Saved Bookmarks" 
        isOpen={isBookmarksOpen} 
        onClose={() => setIsBookmarksOpen(false)}
      >
        {bookmarks.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-4xl mb-2">🔖</p>
            <p>Your saved places will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark, index) => (
              <div 
                key={`${bookmark.name}-${index}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">
                      {bookmark.name}
                    </h3>
                    
                    {bookmark.address && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                        {bookmark.address}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      {bookmark.rating && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--gold-500)]">
                          ⭐ {bookmark.rating}
                        </span>
                      )}
                      
                      {bookmark.categories && bookmark.categories.length > 0 && (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {bookmark.categories[0]}
                        </span>
                      )}
                    </div>
                    
                    {bookmark.famous_dishes && bookmark.famous_dishes.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md w-fit">
                        <span>🍽️</span>
                        <span className="truncate">{bookmark.famous_dishes[0]}</span>
                      </div>
                    )}
                    
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const link = bookmark.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bookmark.name}${bookmark.address ? ` ${bookmark.address}` : ''}`)}`;
                          window.open(link, '_blank');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Maps
                      </button>
                      <button
                        onClick={() => {
                          const link = bookmark.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bookmark.name}${bookmark.address ? ` ${bookmark.address}` : ''}`)}`;
                          const text = `${bookmark.name}${bookmark.address ? `, ${bookmark.address}` : ''}`;
                          if (navigator.share) {
                            navigator.share({ title: bookmark.name, text, url: link }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(link);
                            alert('Link copied to clipboard');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 12a4 4 0 014-4h5a4 4 0 110 8H8a4 4 0 01-4-4zm5-6a3 3 0 100 6h5a3 3 0 100-6H9z"/>
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={async () => {
                      await removeBookmark(bookmark.name);
                    }}
                    className="shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove bookmark"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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