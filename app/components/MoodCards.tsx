"use client";
import Card from "./Card";

type Props = {
  onMoodSelect?: (mood: string) => void;
  selectedMoodPrompt?: string;
};

const items = [
  { 
    id: 1, 
    title: "Explore Local Gems", 
    prompt: "Show me authentic local cuisine, famous street food spots, and hidden gems in this area." 
  },
  { 
    id: 2, 
    title: "Quick & Tasty", 
    prompt: "Find highly-rated places nearby where I can get good food fast." 
  },
  { 
    id: 3, 
    title: "Budget Friendly", 
    prompt: "Find delicious and affordable food options that offer great value for money." 
  },
  { 
    id: 4, 
    title: "Trending & Top Rated", 
    prompt: "Show me the most popular restaurants and viral food spots in the city right now." 
  }
];
export default function MoodCards({ onMoodSelect, selectedMoodPrompt }: Props) {
  return (
    <section>
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              onClick={() => onMoodSelect?.(item.prompt)}
              isSelected={selectedMoodPrompt === item.prompt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
