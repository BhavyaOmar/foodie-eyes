"use client";
import { useState } from "react";
import type React from "react";

type Place = {
  name: string;
  address?: string;
  rating?: number;
  website?: string;
  phone?: string;
  thumbnail?: string;
  categories?: string[];
  scraped_content?: string;
  reviews?: string;
  reviewCount?: number;
};

type Props = {
  place: Place;
  onClose: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  isSignedIn: boolean;
};

export default function DetailModal({
  place,
  onClose,
  isBookmarked,
  onBookmark,
  isSignedIn,
}: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}?place=${encodeURIComponent(place.name)}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareVia = (platform: string) => {
    const text = `Check out ${place.name} at ${place.address}`;
    const link = `${window.location.origin}?place=${encodeURIComponent(place.name)}`;
    const encodedText = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(link);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`,
      discord: `https://discord.com/channels/@me`,
      instagram: `https://instagram.com`,
      email: `mailto:?subject=Check out ${place.name}&body=${encodedText}\n\n${encodedLink}`,
      snapchat: `https://www.snapchat.com`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  // Official Brand SVGs for Socials
  const socialSvgIcons: Record<string, React.JSX.Element> = {
    whatsapp: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
         <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.66C14.25 3.66 16.31 4.51 17.87 6.07C19.42 7.63 20.28 9.69 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.56 20.16 9.11 19.79 7.85 19.07L7.55 18.9L4.43 19.71L5.26 16.66L5.08 16.37C4.27 15.06 3.84 13.5 3.84 11.91C3.84 7.37 7.54 3.66 12.05 3.66M9.59 7.32C9.37 7.32 9 7.41 8.81 7.62C8.62 7.83 8.07 8.35 8.07 9.4C8.07 10.45 8.84 11.47 9.05 11.75C9.26 12.03 10.62 14.18 12.76 15.05C14.54 15.77 14.9 15.63 15.29 15.59C15.68 15.55 16.5 15.09 16.67 14.61C16.84 14.13 16.84 13.72 16.79 13.64C16.74 13.56 16.6 13.51 16.31 13.37C16.01 13.23 14.56 12.51 14.29 12.41C14.02 12.31 13.82 12.26 13.63 12.54C13.44 12.82 12.89 13.47 12.72 13.67C12.56 13.87 12.39 13.9 12.09 13.75C11.8 13.6 10.85 13.29 9.73 12.29C8.83 11.49 8.23 10.5 8.08 10.24C7.93 9.98 8.07 9.84 8.21 9.7C8.34 9.57 8.5 9.36 8.65 9.19C8.8 9.02 8.85 8.9 8.95 8.7C9.05 8.5 9 8.33 8.94 8.2C8.87 8.07 8.32 6.71 8.1 6.16C7.88 5.62 7.66 5.7 7.49 5.7C7.33 5.7 7.14 5.7 6.95 5.7C6.76 5.7 6.45 5.77 6.24 6C6.02 6.23 5.41 6.8 5.41 7.95C5.41 9.11 6.25 10.23 6.46 10.51C6.67 10.8 8.23 13.26 10.68 14.26C13.13 15.26 13.13 14.93 13.6 14.88C14.06 14.83 15.09 14.31 15.3 13.72C15.51 13.13 15.51 12.62 15.45 12.51C15.38 12.41 15.19 12.35 14.89 12.2C14.6 12.05 13.14 11.33 12.88 11.23C12.61 11.13 12.41 11.08 12.22 11.36C12.03 11.64 11.48 12.29 11.31 12.49C11.15 12.69 10.98 12.72 10.68 12.57C10.39 12.42 9.44 12.11 8.32 11.11C7.42 10.31 6.82 9.32 6.67 9.06C6.52 8.8 6.66 8.66 6.8 8.52C6.93 8.39 7.09 8.18 7.24 8.01C7.39 7.84 7.44 7.72 7.54 7.52C7.64 7.32 7.59 7.15 7.53 7.02C7.46 6.89 6.91 5.53 6.69 4.98C6.47 4.44 6.25 4.52 6.08 4.52C5.92 4.52 5.73 4.52 5.54 4.52C5.35 4.52 5.04 4.59 4.83 4.82C4.61 5.05 4 5.62 4 6.77C4 7.93 4.84 9.05 5.05 9.33C5.26 9.62 6.82 12.08 9.27 13.08C11.72 14.08 11.72 13.75 12.19 13.7C12.65 13.65 13.68 13.13 13.89 12.54C14.1 11.95 14.1 11.44 14.04 11.33C13.97 11.23 13.78 11.17 13.48 11.02C13.19 10.87 11.73 10.15 11.47 10.05C11.2 9.95 11 9.9 10.81 10.18C10.62 10.46 10.07 11.11 9.9 11.31C9.74 11.51 9.57 11.54 9.27 11.39C8.98 11.24 8.03 10.93 6.91 9.93C6.01 9.13 5.41 8.14 5.26 7.88C5.11 7.62 5.25 7.48 5.39 7.34C5.52 7.21 5.68 7 5.83 6.83C5.98 6.66 6.03 6.54 6.13 6.34C6.23 6.14 6.18 5.97 6.12 5.84C6.05 5.71 5.5 4.35 5.28 3.8C5.06 3.26 4.84 3.34 4.67 3.34C4.51 3.34 4.32 3.34 4.13 3.34C3.94 3.34 3.63 3.41 3.42 3.64C3.2 3.87 2.59 4.44 2.59 5.59C2.59 6.75 3.43 7.87 3.64 8.15C3.85 8.44 5.41 10.9 7.86 11.9C10.31 12.9 10.31 12.57 10.78 12.52C11.24 12.47 12.27 11.95 12.48 11.36C12.69 10.77 12.69 10.26 12.63 10.15C12.56 10.05 12.37 9.99 12.07 9.84C11.78 9.69 10.32 8.97 10.06 8.87C9.79 8.77 9.59 8.72 9.4 9C9.21 9.28 8.66 9.93 8.49 10.13C8.33 10.33 8.16 10.36 7.86 10.21C7.57 10.06 6.62 9.75 5.5 8.75C4.6 7.95 4 6.96 3.85 6.7C3.7 6.44 3.84 6.3 3.98 6.16C4.11 6.03 4.27 5.82 4.42 5.65C4.57 5.48 4.62 5.36 4.72 5.16C4.82 4.96 4.77 4.79 4.71 4.66C4.64 4.53 4.09 3.17 3.87 2.62C3.65 2.08 3.43 2.16 3.26 2.16C3.1 2.16 2.91 2.16 2.72 2.16Z" />
      </svg>
    ),
    telegram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 9.47 15.79 12.94 15.42 14.51C15.27 15.17 15 15.39 14.78 15.41C14.31 15.45 13.95 15.12 13.5 14.83C12.8 14.38 12.4 14.1 11.72 13.66C10.94 13.15 11.45 12.87 11.89 12.43C12 12.31 13.93 10.46 13.97 10.29C13.97 10.27 13.98 10.19 13.93 10.15C13.89 10.11 13.82 10.12 13.77 10.13C13.7 10.15 12.64 10.83 10.6 12.15C10.3 12.34 10.03 12.43 9.71 12.42C9.36 12.41 8.69 12.23 8.19 12.07C7.58 11.88 7.1 11.78 7.14 11.43C7.16 11.25 7.41 11.06 7.9 10.86C10.32 9.81 11.94 9.13 12.76 8.79C14.61 8.05 14.99 7.92 15.24 7.92C15.3 7.92 15.43 7.93 15.51 8C15.58 8.06 15.67 8.21 15.69 8.38C15.7 8.45 15.7 8.56 15.69 8.65C15.68 8.69 15.66 8.75 15.64 8.8Z" /></svg>
    ),
    discord: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4.12C15 4.12 14.76 4.56 14.58 4.95C13 4.71 11.42 4.71 9.84 4.95C9.66 4.55 9.42 4.12 9.42 4.12C7.92 4.26 6.48 4.71 5.15 5.33C2.5 9.32 1.79 13.22 2.13 17.04C3.9 18.34 5.63 19.13 7.33 19.65C7.75 19.07 8.13 18.46 8.45 17.82C7.84 17.58 7.25 17.3 6.7 16.97C6.84 16.86 6.99 16.75 7.13 16.63C10.35 18.12 13.86 18.12 17.08 16.63C17.22 16.75 17.37 16.86 17.51 16.97C16.96 17.3 16.37 17.58 15.76 17.82C16.08 18.46 16.46 19.07 16.88 19.65C18.58 19.13 20.31 18.34 22.08 17.04C22.5 12.62 21.35 8.78 19.27 5.33ZM8.55 13.68C7.59 13.68 6.8 12.79 6.8 11.7C6.8 10.61 7.56 9.72 8.55 9.72C9.54 9.72 10.33 10.61 10.3 11.7C10.3 12.79 9.54 13.68 8.55 13.68ZM15.66 13.68C14.7 13.68 13.91 12.79 13.91 11.7C13.91 10.61 14.67 9.72 15.66 9.72C16.65 9.72 17.44 10.61 17.41 11.7C17.41 12.79 16.65 13.68 15.66 13.68Z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
      </svg>
    ),
    email: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
      </svg>
    ),
    snapchat: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C9 2 7.5 3.6 7.3 3.7C6.6 4.4 5.8 5.6 5.4 7.4C4.9 9.7 5.3 11.1 5.6 11.9C5.2 12.2 4.6 12.5 3.8 12.7C3.2 12.9 2.3 13.4 2.1 14.3C1.9 14.9 2.3 15.5 2.8 15.7C3.2 15.9 3.7 15.8 3.8 15.8C4.1 16 4.2 16.7 4.4 17.2C4.6 17.8 5.3 19 6.8 19C7.1 19 7.3 19.1 7.5 19.2C7.7 19.4 8.2 20.8 8.3 21C8.6 21.6 9.2 21.9 9.8 22H14.3C14.8 21.9 15.4 21.6 15.7 21C15.8 20.8 16.3 19.4 16.5 19.2C16.7 19.1 16.9 19 17.2 19C18.8 19 19.4 17.8 19.6 17.2C19.8 16.7 19.9 16 20.2 15.8C20.3 15.8 20.8 15.9 21.2 15.7C21.7 15.5 22.1 14.9 21.9 14.3C21.7 13.4 20.9 12.9 20.2 12.7C19.5 12.5 18.9 12.2 18.4 11.9C18.7 11.1 19.1 9.7 18.7 7.4C18.2 5.6 17.4 4.4 16.8 3.7C16.5 3.6 15 2 12 2M12 3.5C14.2 3.5 15.5 4.8 15.6 4.9C16.2 5.6 16.8 6.5 17.2 8C17.6 10 17.3 11.3 17 12.1C16.7 12.7 16.2 13 15.6 13.2C15.3 13.3 14.9 13.4 14.5 13.5C13.6 13.7 12.6 13.8 12 13.8C11.4 13.8 10.4 13.7 9.5 13.5C9.1 13.4 8.8 13.3 8.4 13.2C7.8 13 7.3 12.7 7 12.1C6.7 11.3 6.5 10 6.8 8C7.2 6.5 7.8 5.6 8.4 4.9C8.5 4.8 9.8 3.5 12 3.5M6.1 14C6.1 14 6.3 14 6.5 14.1C7 14.2 7.7 14.3 8.3 14.5C8.9 14.7 9.7 14.8 10.3 14.9C10.6 15 10.8 15 11.1 15H12.9C13.2 15 13.4 15 13.7 14.9C14.3 14.8 15.1 14.7 15.7 14.5C16.4 14.3 17 14.2 17.5 14.1C17.7 14 18 14 18 14C18.2 14.1 18.5 14.2 18.7 14.2C19.4 14.4 20.1 14.8 20.3 15.2C20.4 15.2 20.3 15.2 20.2 15.2C20.1 15.2 19.8 15.1 19.6 15C19.2 14.9 18.7 15 18.4 15.3C18.1 15.6 18.1 16.4 18 16.6C17.8 17.2 17.4 18.1 16.2 18C16.1 18 15.9 18 15.8 18.1C15.7 18.2 15.3 19.5 15.1 19.7C15.1 19.7 15 19.8 15 19.8C14.7 20.2 14.3 20.5 13.9 20.5H10C9.6 20.5 9.2 20.2 9 19.8C9 19.8 8.9 19.7 8.8 19.7C8.7 19.5 8.2 18.2 8.2 18.1C8 18 7.9 18 7.7 18C6.5 18.1 6.1 17.2 6 16.6C5.9 16.4 5.8 15.6 5.5 15.3C5.3 15 4.7 14.9 4.3 15C4.1 15.1 3.9 15.2 3.7 15.2C3.6 15.2 3.6 15.2 3.6 15.2C3.9 14.8 4.5 14.4 5.2 14.2C5.5 14.2 5.8 14.1 6.1 14Z" />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[var(--border-subtle)] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{place.name}</h2>
            {place.rating && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⭐</span>
                <span className="text-lg font-semibold text-[var(--gold-500)]">{place.rating}</span>
                {place.reviewCount && (
                  <span className="text-sm text-slate-500">({place.reviewCount} reviews)</span>
                )}
              </div>
            )}
          </div>

          {/* Address */}
          {place.address && (
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-[var(--gold-500)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p className="text-slate-700 leading-relaxed">{place.address}</p>
            </div>
          )}

          {/* Categories/Specialty */}
          {place.categories?.length ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Specialty</h3>
              <div className="flex flex-wrap gap-2">
                {place.categories.slice(0, 5).map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 text-sm rounded-full bg-orange-50 text-[var(--gold-500)] border border-[var(--gold-400)]/40"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Contact Info */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            {place.phone && (
              <div className="flex gap-3 items-center">
                <svg className="w-5 h-5 text-[var(--gold-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <a href={`tel:${place.phone}`} className="text-slate-700 hover:text-[var(--gold-500)] transition">
                  {place.phone}
                </a>
              </div>
            )}
            {place.website && (
              <div className="flex gap-3 items-center">
                <svg className="w-5 h-5 text-[var(--gold-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 hover:text-[var(--gold-500)] transition break-all"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {/* Why This Place */}
          {place.scraped_content && (
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Why this place</h3>
              <p className="text-slate-700 leading-6 text-sm whitespace-pre-line">{place.scraped_content}</p>
            </div>
          )}

          {/* Reviews */}
          {place.reviews && (
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Reviews</h3>
              <p className="text-slate-700 text-sm leading-6 whitespace-pre-line">{place.reviews}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap gap-3">
            
            {/* Bookmark Button */}
            <button
              onClick={onBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isBookmarked
                  ? "bg-orange-100 text-[var(--gold-500)] border border-orange-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isBookmarked ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3l-7 3Z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              )}
              {isBookmarked ? "Saved" : "Bookmark"}
            </button>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    showShareMenu 
                    ? "bg-[var(--gold-400)]/25 text-[var(--gold-500)] border border-[var(--gold-400)]/40" 
                    : "bg-[var(--gold-400)]/15 text-[var(--gold-500)] border border-[var(--gold-400)]/40 hover:bg-[var(--gold-400)]/25"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                Share
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white border border-[var(--border-subtle)] rounded-lg shadow-xl p-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-bottom-2">
                  
                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-100 rounded-md transition group"
                  >
                    {/* UPDATED: Copy Icon (Overlapping Rectangles) */}
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm font-medium text-slate-700">{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>

                  <div className="border-t border-[var(--border-subtle)] my-1.5" />

                  {/* Social Platforms with Brand SVGs */}
                  {["whatsapp", "telegram", "instagram", "discord", "email", "snapchat"].map(
                    (platform) => (
                      <button
                        key={platform}
                        onClick={() => shareVia(platform)}
                        className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-100 rounded-md transition group"
                      >
                        <span className="shrink-0 text-slate-500 group-hover:text-[var(--gold-500)] transition-colors">
                            {socialSvgIcons[platform]}
                        </span>
                        <span className="capitalize text-sm font-medium text-slate-700">{platform}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}