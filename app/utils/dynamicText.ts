
export function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function getSmallGreeting(name: string = "Foodie") {
  const time = getTimeContext();
  const greetings = {
    morning: `Good Morning, ${name}! ☀️`,
    afternoon: `Good Afternoon, ${name}! 🌤️`,
    evening: `Good Evening, ${name}! 🌙`,
    night: `Late Night Cravings? 🦉`
  };
  return greetings[time];
}

export function getMainHeadline() {
  const headlines = [
    "What are you in the mood for?",
    "Let's find something delicious.",
    "Ready for a flavor adventure?",
    "Discover your next favorite spot.",
    "Time to treat your tastebuds."
  ];
  // Pick a random one
  return headlines[Math.floor(Math.random() * headlines.length)];
}

export function getSearchPlaceholder() {
  const time = getTimeContext();
  
  const placeholders = {
    morning: [
      "Try 'Best Coffee nearby'...",
      "Search for 'English Breakfast'...",
      "Try 'Pancakes' or 'Waffles'..."
    ],
    afternoon: [
      "Try 'Spicy Ramen'...",
      "Search for 'Best Thali nearby'...",
      "Try 'Healthy Salad' or 'Sushi'..."
    ],
    evening: [
      "Try 'Romantic Dinner spots'...",
      "Search for 'Street Food'...",
      "Try 'Live Music Cafe'..."
    ],
    night: [
      "Search for 'Midnight Pizza'...",
      "Try 'Dessert' or 'Ice Cream'...",
      "Search for '24/7 delivery'..."
    ]
  };

  const options = placeholders[time];
  return options[Math.floor(Math.random() * options.length)];
}