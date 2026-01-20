"use client";
import Image from "next/image";

type Props = {
  onMoodSelect?: (mood: string) => void;
  selectedMoodPrompt?: string;
};

const categories = [
  { 
    id: "biryani", 
    title: "Biryani", 
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=200&q=80",
    prompt: "Best authentic Biryani places nearby" 
  },
  { 
    id: "pizza", 
    title: "Pizza", 
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80", 
    prompt: "Authentic Italian Pizza and woodfired pizza" 
  },
  { 
    id: "burger", 
    title: "Burger", 
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80", 
    prompt: "Juicy gourmet burgers and fries" 
  },
  { 
    id: "north-indian", 
    title: "North Indian", 
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=200&q=80", 
    prompt: "North Indian curry naan and butter chicken" 
  },
  { 
    id: "rolls", 
    title: "Rolls", 
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=200&q=80", 
    prompt: "Kathi rolls and wraps street food" 
  },
  { 
    id: "chinese", 
    title: "Chinese", 
    // UPDATED: Reliable Noodles/Chowmein image
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80", 
    prompt: "Best Chowmein Manchurian and Chinese noodles" 
  },
  { 
    id: "dessert", 
    title: "Dessert", 
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=200&q=80", 
    prompt: "Desserts ice cream and cakes" 
  },
  { 
    id: "coffee", 
    title: "Coffee", 
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=200&q=80", 
    prompt: "Cozy cafe with good coffee and ambiance" 
  },
  { 
    id: "south-indian", 
    title: "South Indian", 
    // UPDATED: Reliable Dosa image
    image: "/south.jpg", 
    prompt: "South Indian dosa idli and sambar" 
  }
];

export default function MoodCards({ onMoodSelect, selectedMoodPrompt }: Props) {
  return (
    <section className="w-full max-w-screen-xl mx-auto mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 px-4 py-4 justify-items-center">
        {categories.map((item) => {
          const isSelected = selectedMoodPrompt === item.prompt;
          
          return (
            <button
              key={item.id}
              onClick={() => onMoodSelect?.(item.prompt)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group transition-all active:scale-95"
            >
              {/* Image Circle */}
              <div 
                className={`relative w-16 sm:w-20 h-16 sm:h-20 rounded-full overflow-hidden border-2 shadow-sm transition-all duration-300 group-hover:shadow-md ${
                  isSelected 
                    ? "border-orange-500 ring-2 ring-orange-200 ring-offset-2" 
                    : "border-slate-100 group-hover:border-orange-200"
                }`}
              >
                <Image 
                  src={item.image} 
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 64px, 80px"
                />
                
                {/* Dark Overlay on Hover for visual pop */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
              
              {/* Label */}
              <span className={`text-[10px] sm:text-xs font-semibold tracking-wide transition-colors ${
                isSelected ? "text-orange-600" : "text-slate-600 group-hover:text-orange-600"
              }`}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}