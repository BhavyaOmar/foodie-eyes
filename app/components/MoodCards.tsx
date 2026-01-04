"use client";
import Card from "./Card";

type Props = {
  onMoodSelect?: (mood: string) => void;
  selectedMoodPrompt?: string;
};

const items = [
  { id: 1, title: "I am hungry", prompt: "Show me places where I can get good food quickly" },
  { id: 2, title: "I am in a new place and I wanna explore local cuisines", prompt: "Find popular local cuisine restaurants and street food" },
  { id: 3, title: "I want some budget friendly food", prompt: "Find affordable budget-friendly food options" },
  { id: 4, title: "I am travelling and looking for some food points in my route", prompt: "Find good food restaurants along the way" },
  { id: 5, title: "I wanna explore best street food options here", prompt: "Show me the best street food vendors and stalls" },
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
