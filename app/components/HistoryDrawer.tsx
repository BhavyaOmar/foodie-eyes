"use client";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  historyItems: any[];
  onSelect: (place: any) => void;
};

export default function HistoryDrawer({ isOpen, onClose, historyItems, onSelect }: Props) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Recently Viewed</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {historyItems.length === 0 ? (
              <div className="text-center text-slate-400 mt-10">
                <p>No history yet.</p>
                <p className="text-sm">Start exploring!</p>
              </div>
            ) : (
              historyItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => onSelect(item)}
                  className="group flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-[var(--gold-400)] hover:bg-slate-50 cursor-pointer transition-all"
                >
                  {/* Thumbnail Placeholder */}
                  <div className="w-12 h-12 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                    {item.thumbnail ? (
                       <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Food</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-[var(--gold-600)]">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.address}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">
                        {item.rating} ★
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}