"use client";
import Card from "./Card";

const items = [
  { id: 1, title: "I am hungry", href: "/preferences/hungry" },
  { id: 2, title: "I am in a new place and I wanna explore local cuisines", href: "/preferences/explore" },
  { id: 3, title: "I want some budget friendly food", href: "/preferences/budget" },
  { id: 4, title: "I am travelling and looking for some food points in my route", href: "/preferences/travel" },
  { id: 5, title: "I wanna explore best street food options here", href: "/preferences/streetfood" },
];

export default function MoodCards() {
  return (
    <section>
      <div className="mx-auto max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg px-4 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              href={item.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
