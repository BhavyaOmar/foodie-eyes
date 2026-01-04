"use client";
import { useState } from "react";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "@/app/lib/firebase"; 

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  // 1. New State for Name
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        // 1. Create the account
        const res = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Update the profile with the Name immediately
        if (res.user) {
          await updateProfile(res.user, { displayName: name });
          
          // Force reload so the TopBar sees the new name instantly
          await res.user.reload();
        }
      } else {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", "").replace("auth/", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] p-6 relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          ✕
        </button>

        <h2 className="text-xl font-bold text-center text-slate-800 mb-1">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        
        {/* Google Button */}
        <button 
          onClick={handleGoogle}
          className="w-full mt-6 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-all"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide text-slate-400 bg-white px-2">Or</div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* 2. NAME INPUT (Only Visible on Sign Up) */}
          {isSignUp && (
            <input 
              type="text" 
              placeholder="Name" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--gold-400)] transition-all animate-in slide-in-from-top-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--gold-400)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--gold-400)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-70"
          >
            {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Log In")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(""); // Clear errors when switching
            }} 
            className="text-[var(--gold-600)] font-semibold hover:underline"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}