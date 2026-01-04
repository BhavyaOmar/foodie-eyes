import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeWithGroq } from "@/app/lib/groq"; 

// 0. SAFETY CHECK
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("❌ Missing GOOGLE_API_KEY in .env.local");
}

// 1. INITIALIZE OUTSIDE (Global Scope)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Global JSON Model for structured tasks
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  generationConfig: { 
    responseMimeType: "application/json",
    temperature: 0 
  } 
});

// --- Tool 1: Refines User Search (The Interpreter) ---
export async function refineQuery(userPrompt: string, locationContext: string) {
  const prompt = `
    ACT AS: A Google Maps Search Expert.
    
    USER INPUT: "${userPrompt}"
    USER LOCATION CONTEXT: "${locationContext}"

    TASK:
    1. Interpret the user's intent.
    2. Convert it into a 2-3 word Keyword Search for Google Maps.
    
    ⚠️ CRITICAL RULES FOR GOOGLE MAPS:
    - DO NOT use sentences.
    - DO NOT use words like "vibes", "atmosphere", "somewhere", "find me".
    - DO NOT include negative filters (Maps ignores "not").
    - USE STANDARD CATEGORIES (e.g., "Fine Dining", "Street Food", "Cafe").
    
    EXAMPLES:
    - Input: "Spicy street food vibes with AC" -> Output: "Chaats & Fast Food"
    - Input: "Romantic date spot" -> Output: "Romantic Restaurants"
    - Input: "Cheap food" -> Output: "Cheap Eats"

    OUTPUT JSON FORMAT:
    {
      "searchQuery": "String (Keywords + Location)", 
      "locationString": "${locationContext}"
    }
  `;

  try {
    // DIRECT CALL (No Retry Loop)
    const result = await model.generateContent(prompt);
    
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("🌏GEMINI SEARCH GENERATED: ", text);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    
    // --- SMART FALLBACK LOGIC ---
    let fallbackQuery = userPrompt;

    // Detect if it's a long sentence (bad for Maps) vs Keywords (good)
    if (userPrompt.split(" ").length > 3) {
      // Simple keyword extraction fallback
      if (userPrompt.toLowerCase().includes("spicy")) fallbackQuery = "Spicy Restaurants";
      else if (userPrompt.toLowerCase().includes("street")) fallbackQuery = "Street Food";
      else if (userPrompt.toLowerCase().includes("date")) fallbackQuery = "Romantic Restaurants";
      else if (userPrompt.toLowerCase().includes("coffee")) fallbackQuery = "Cafe";
      else fallbackQuery = "Top Rated Restaurants"; // Ultimate safety net
    }
    
    console.log(`⚠️ AI Failed. Using Smart Fallback: "${fallbackQuery}"`);

    return { 
      searchQuery: `${fallbackQuery} in ${locationContext}`, 
      locationString: locationContext 
    };
  }
}

// --- Tool 2: Analyzes Results (The "Chain of Survival") ---
export async function analyzePlaces(places: any[], userMood: string) {
  const prompt = `
    ACT AS: A Food Critic and Local Guide.
    
    USER MOOD/QUERY: "${userMood}"
    
    DATA: ${JSON.stringify(places)}
    
    TASK: 
    1. Analyze the 'scraped_content' and 'reviews'.
    2. Identify the Top 1-3 dishes.
    
    ⚠️ RULES:
    - Prioritize finding "famous_dishes" in the 'scraped_content'.
    - IF 'scraped_content' is empty, look at 'categories' to infer generic dishes (e.g., "Italian" -> ["Pizza", "Pasta"]).
    - DO NOT return an empty list if you can infer safe recommendations from the category.
    - Return "secret_tip" only if found in text, otherwise null.
    
    OUTPUT JSON FORMAT:
    {
      "recommendations": [
        {
          "name": "Place Name",
          "rating": 4.5,
          "address": "Address string",
          "phone": "Phone or null",
          "website": "URL or null",
          "thumbnail": "URL or null",
          "categories": ["Tag1", "Tag2"],
          "match_reason": "Why it fits the mood (1 sentence)",
          "famous_dishes": ["Dish 1", "Dish 2"], 
          "secret_tip": "Specific tip or null" 
        }
      ]
    }
  `;
  
  // 1. ATTEMPT GEMINI (Primary - Direct Call)
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (geminiError) {
    console.warn("⚠️ Gemini crashed/busy. Attempting Groq (Llama 3)...");

    // 2. ATTEMPT GROQ (Backup)
    try {
      const groqResult = await analyzeWithGroq(places, userMood);
      return groqResult;

    } catch (groqError) {
      console.warn("⚠️ Both AIs failed. Switching to 'Manual Mode'.");

      // 3. MANUAL FALLBACK (Last Resort)
      // This guarantees the user ALWAYS sees results, even if AIs are down.
      const manualRecommendations = places.map(place => {
        // 1. Guess famous dishes from category so the UI isn't empty
        let guessedDishes = ["Signature Special"];
        
        const cats = place.categories?.join(" ").toLowerCase() || "";
        
        if (cats.includes("pizza")) guessedDishes = ["Pepperoni Pizza", "Garlic Bread"];
        else if (cats.includes("coffee") || cats.includes("cafe")) guessedDishes = ["Cappuccino", "Hazelnut Latte"];
        else if (cats.includes("chinese")) guessedDishes = ["Hakka Noodles", "Chilli Chicken"];
        else if (cats.includes("indian") || cats.includes("curry")) guessedDishes = ["Butter Masala", "Biryani"];
        else if (cats.includes("burger") || cats.includes("fast")) guessedDishes = ["Double Cheeseburger", "Fries"];
        else if (cats.includes("sushi") || cats.includes("japanese")) guessedDishes = ["Salmon Roll", "Tempura"];

        return {
          ...place,
          // Add a generic reason so the card isn't empty
          match_reason: `A popular ${place.categories?.[0] || "spot"} nearby that matches your vibe.`,
          famous_dishes: guessedDishes,
          secret_tip: "Check the daily specials board!"
        };
      });

      // Return the manually formatted data (Top 4)
      return { recommendations: manualRecommendations.slice(0, 4) }; 
    }
  }
}

// --- Tool 3: Fallback Strategy (The Backup Plan) ---
export async function getFallbackQuery(originalQuery: string, location: string) {
  const textModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { temperature: 0.2 } 
  });

  const prompt = `
    CONTEXT: User searched for "${originalQuery}" in "${location}" but NO RESULTS were found.
    TASK: Generate a "Broad Alternative" search query.
    RETURN ONLY THE SEARCH STRING. No JSON, no quotes.
  `;
  
  try {
    const result = await textModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    return `Restaurants in ${location}`;
  }
}