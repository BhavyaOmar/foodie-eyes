import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- HELPER: ROBUST JSON PARSER ---
function cleanAndParseJSON(text: string,fallback: any={}): any {
  try {
    // Aggressively clean markdown code blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Groq JSON Parse Error. Raw Text:", text);
    return fallback; // Safe fallback
  }
}

// 1. REFINE QUERY (The Brain - Groq Edition)
export async function refineQueryWithGroq(userPrompt: string, locationContext: string) {
  const prompt = `
You are a STRICT food intent classifier. Your ONLY job is to identify food, drinks, or dining-related queries.

USER INPUT: "${userPrompt}"
LOCATION: "${locationContext}"

CRITICAL RULES:
1. ANALYZE INTENT - Answer ONE question: "Is this about eating, drinking, or dining?"
   
   ✅ FOOD/DRINK (is_food: true):
   - Actual food: Pizza, Burger, Biryani, Pasta, Sushi, Salad, Sandwich, Chicken, Beef, Pork, Fish, Seafood
   - Drinks: Coffee, Tea, Beer, Wine, Juice, Water, Smoothie, Cocktail
   - Food moods: Hungry, Craving, Date night, Breakfast, Late-night munchies
   - Dining places: Restaurant, Cafe, Bar, Bakery, Food truck
   - Food-related: Menu, Dessert, Appetizer, Vegan options, Vegetarian options
   - Conversational queries about food: "places to try", "iconic places", "best restaurants", "popular places", "must visit", "recommendations", "where to eat", "famous places", "top places", "suggest places", "suggest me places"
   - Ambiance/atmosphere queries: "cozy cafe", "quiet cafe", "romantic restaurant", "peaceful place", "calm restaurant", "cozy places", "relaxing places", "quiet places", "peaceful places", "romantic places", "calm places"
   - IMPORTANT: When users ask for "places" with ambiance words (cozy, relaxing, quiet, peaceful, romantic, calm, etc.), they are ALWAYS asking about dining places (cafes, restaurants). Treat these as food-related.
   - IMPORTANT: Food items like "chicken burger", "beef burger", "pork sandwich" are STILL FOOD even if they contain meat. The presence of meat in the name doesn't make it non-food.
   
   ❌ NOT FOOD (is_food: false):
   - Clothing: Sweater, Shoes, Jacket, Shirt, Dress, Jeans, Hat, Pants
   - Electronics: iPhone, Laptop, Headphones, Charger, TV, Phone, Computer
   - Services: Hospital, Doctor, Salon, Gym, Spa, Hotel room, Pharmacy
   - Products: Furniture, Books, Toys, Stationery, Cosmetics, Medicine
   - Vehicles: Car, Bike, Scooter, Taxi, Uber
   - Any non-edible item

2. IF NOT FOOD/DRINK:
   - IMMEDIATELY set "is_food": false
   - Set "searchQuery": "Sorry, I can only help with food or drinks. Please enter something edible or drinkable."
   - DO NOT proceed with any other analysis

3. IF FOOD/DRINK - THEN:
   - Correct spelling errors (e.g., "Piza" -> "Pizza", "Biriani" -> "Biryani")
   - Normalize plurals (e.g., "burgers" -> "burger")
   - Extract the food/drink category
   - Preserve the food item name as-is (e.g., "chicken burger" stays "chicken burger", don't change to just "burger")
   - For conversational queries (e.g., "suggest places to try", "iconic places", "best restaurants"), convert to a searchable query like "restaurants" or "popular restaurants" or "best restaurants"
   - For ambiance queries (e.g., "cozy cafe", "quiet cafe"), preserve the place type (cafe) and ambiance keywords in the search query: "cozy cafe" or "quiet cafe"
   - For ambiance queries without explicit place type (e.g., "cozy places", "relaxing places", "suggest me some cozy and relaxing places"), convert to "cozy restaurants" or "relaxing cafes" or "cozy relaxing restaurants" - add a dining place type (restaurant/cafe) to make it searchable

OUTPUT FORMAT (JSON ONLY):
{
  "is_food": true/false,
  "searchQuery": "optimized query OR rejection message",
  "locationString": "${locationContext}",
  "was_corrected": true/false,
  "corrected_term": "fixed word if applicable OR null",
  "cuisineCategory": "South Indian" | "North Indian" | "Chinese" | "Italian" | "Continental" | "Mexican" | "Thai" | "Japanese" | null
}

CUISINE DETECTION RULES:
- Analyze the query to identify the cuisine type based on dishes mentioned
- Examples:
  - "idli dosa sambar" → "South Indian"
  - "naan butter chicken" → "North Indian"
  - "chowmein manchurian" → "Chinese"
  - "pizza pasta" → "Italian"
  - "biryani" → null (can be multiple cuisines, don't assume)
  - "coffee" → null (not cuisine-specific)
  - "restaurants" → null (too generic)
- Only return cuisineCategory if you're confident about the cuisine type
- If ambiguous or generic, return null

EXAMPLES:

Input: "sweater"
Output: { "is_food": false, "searchQuery": "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "iPhone"
Output: { "is_food": false, "searchQuery": "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "shoes"
Output: { "is_food": false, "searchQuery": "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "hospital"
Output: { "is_food": false, "searchQuery": "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "Piza"
Output: { "is_food": true, "searchQuery": "Pizza near ${locationContext}", "locationString": "${locationContext}", "was_corrected": true, "corrected_term": "Pizza", "cuisineCategory": "Italian" }

Input: "Burgers"
Output: { "is_food": true, "searchQuery": "Burger near ${locationContext}", "locationString": "${locationContext}", "was_corrected": true, "corrected_term": "Burger", "cuisineCategory": null }

Input: "late night hunger"
Output: { "is_food": true, "searchQuery": "noodles near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "coffee"
Output: { "is_food": true, "searchQuery": "Coffee near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "Suggest me Some Iconic places to try in Kalyani"
Output: { "is_food": true, "searchQuery": "popular restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "best restaurants"
Output: { "is_food": true, "searchQuery": "best restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "where to eat"
Output: { "is_food": true, "searchQuery": "restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "famous places to try"
Output: { "is_food": true, "searchQuery": "popular restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "suggest me some quite and cozy cafe"
Output: { "is_food": true, "searchQuery": "cozy quiet cafe near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null }

Input: "quiet restaurant"
Output: { "is_food": true, "searchQuery": "quiet restaurant near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "suggest me some cozy and relaxing places"
Output: { "is_food": true, "searchQuery": "cozy relaxing restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "cozy places"
Output: { "is_food": true, "searchQuery": "cozy restaurants near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

Input: "relaxing places"
Output: { "is_food": true, "searchQuery": "relaxing cafes near ${locationContext}", "locationString": "${locationContext}", "was_corrected": false, "corrected_term": null, "cuisineCategory": null }

  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return cleanAndParseJSON(completion.choices[0]?.message?.content || "{}", {
      is_food: false,
      searchQuery: "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.",
      locationString: locationContext,
      cuisineCategory: null,
    });
  } catch (error) {
    console.error("Groq Refine Failed:", error);
    return { 
      is_food: false,
      searchQuery: "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.",
      locationString: locationContext,
      cuisineCategory: null
    };
  }
}

// 2. ANALYZE PLACES (The Judge - Groq Edition)
export async function analyzePlacesWithGroq(places: any[], userQuery: string) {
  const prompt = `
    ROLE: Friendly foodie guide who vets places.
    USER QUERY: "${userQuery}"

    TASK
    - Annotate EACH place independently. Do NOT rank.
  - For each place, provide:
  - is_relevant: true/false
  - confidence: 0-1
  - match_reason: positives only (taste, signature dishes, ambience, service)
  - famous_dishes: concrete dishes from text, max 5 items
  - tip: optional practical tip
  - note: only explicit negatives (slow service, stale food, overpriced, hygiene)

    INPUT DATA (max 4000 chars per place):
    ${JSON.stringify(places.map(p => ({
      name: p.title,
      rating: p.rating,
      text: p.scraped_content ? p.scraped_content.slice(0, 4000) : "No reviews available."
    })))}

    OUTPUT JSON ONLY:
    {
      "place_analysis": [
        {
          "name": "Exact Name",
          "is_relevant" : true,
          "match_reason": "Positive reasons to love it (no negatives).",
          "famous_dishes": ["Dish 1", "Dish 2"],
          "tip": "Practical tip to enjoy the visit (optional)",
          "note": "Only explicit negatives if present; else omit"
        }
      ]
    }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return cleanAndParseJSON(completion.choices[0]?.message?.content || "{}", { place_analysis: [] });
  } catch (error) {
    console.error("Groq Analysis Failed:", error);
    return { place_analysis: [] };
  }
}

// 3. FALLBACK QUERY GENERATOR (Groq Version)
export async function getFallbackQueryWithGroq(originalQuery: string, location: string) {
  const prompt = `
    CONTEXT: User searched for "${originalQuery}" in "${location}" but found 0 results.
    
    TASK: 
    1. Identify the broad category of food/drink (e.g., "Fruit Ice Cream" -> "Ice Cream Shop").
    2. Return a search query for that CATEGORY including "${location}".
    3. Return only string, NO JSON.
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2, 
    });
    
    return completion.choices[0]?.message?.content?.trim() || `Restaurants in ${location}`;
  } catch (error) {
    console.error("Groq Fallback Failed:", error);
    return `Restaurants in ${location}`;
  }
}

// Aliases to keep callers simple while we standardize on Groq
export const refineQuery = refineQueryWithGroq;
export const analyzePlaces = analyzePlacesWithGroq;
export const getFallbackQuery = getFallbackQueryWithGroq;
