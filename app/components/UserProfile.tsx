"use client";
import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "@/app/lib/firebase";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);

  // Listen for login state changes (automatically detects if user is logged in)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Function to handle Google Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // Function to handle Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex items-center gap-3">
      {user ? (
        // STATE: LOGGED IN
        <>
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs font-bold text-slate-700">{user.displayName}</span>
            <button 
              onClick={handleLogout}
              className="text-[10px] text-red-500 hover:underline"
            >
              Sign Out
            </button>
          </div>
          <img 
            src={user.photoURL || "https://ui-avatars.com/api/?name=User"} 
            alt="Profile" 
            className="w-9 h-9 rounded-full border-2 border-[var(--gold-400)] shadow-sm"
          />
        </>
      ) : (
        // STATE: LOGGED OUT
        <button 
          onClick={handleLogin}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-[var(--gold-400)] px-4 py-2 rounded-full shadow-sm transition-all active:scale-95"
        >
          {/* Google Icon SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-semibold text-slate-700">Sign In</span>
        </button>
      )}
    </div>
  );
}