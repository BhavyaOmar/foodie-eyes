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
    You are a food intent classifier.
    USER INPUT: "${userPrompt}"
    LOCATION: "${locationContext}"

    Task:
- Extract ONLY a food or drink category that best fits the mood.
- Do NOT include restaurant names.
- Do NOT include adjectives alone.
- If unclear, return "food".

Examples:
Input: "it's a rainy day and I want something warm"
Output: soup

Input: "I feel like eating light and healthy"
Output: salad

Input: "late night hunger"
Output: noodles

Input: "I am bored"
Output: food

Now extract for: "${userPrompt}"

    // 1. -CONTEXTUALIZE "LOCAL": If the user asks for "Local food", "Regional cuisine", or "Famous dish", REPLACE it with the specific cuisine name native to ${locationContext}. 
    //    (e.g., If "Mau, UP", change "Local food" to "Best Litti Chokha and Chaat in Mau").

    // 2. LOCATION BINDING: You MUST explicitly include the city name "${locationContext}" in the search query output.

    // OUTPUT JSON ONLY: 
    // { "searchQuery": "Your optimized query here", "locationString": "${locationContext}" }


    




  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return cleanAndParseJSON(completion.choices[0]?.message?.content || "{}", {
      searchQuery: `${userPrompt} near ${locationContext}`,
      locationString: locationContext,
    });
  } catch (error) {
    console.error("Groq Refine Failed:", error);
    return { searchQuery: `${userPrompt} near ${locationContext}`, locationString: locationContext };
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
  - rejection_reason: why not relevant (if is_relevant = false)

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