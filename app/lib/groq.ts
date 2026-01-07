import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- HELPER: ROBUST JSON PARSER ---
function cleanAndParseJSON(text: string): any {
  try {
    // Aggressively clean markdown code blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Groq JSON Parse Error. Raw Text:", text);
    return { recommendations: [] }; // Safe fallback
  }
}

// 1. REFINE QUERY (The Brain - Groq Edition)
export async function refineQueryWithGroq(userPrompt: string, locationContext: string) {
  const prompt = `
    ACT AS: A Google Maps Search Expert.
    USER INPUT: "${userPrompt}"
    LOCATION: "${locationContext}"

    TASK: Convert the user's input into the BEST possible Google Maps search query.

    RULES:
    1. CONTEXTUALIZE "LOCAL": If the user asks for "Local food", "Regional cuisine", or "Famous dish", REPLACE it with the specific cuisine name native to ${locationContext}. 
       (e.g., If "Mau, UP", change "Local food" to "Best Litti Chokha and Chaat in Mau").
    2. LOCATION BINDING: You MUST explicitly include the city name "${locationContext}" in the search query output.

    OUTPUT JSON ONLY: 
    { "searchQuery": "Your optimized query here", "locationString": "${locationContext}" }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return cleanAndParseJSON(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq Refine Failed:", error);
    // Ultimate fallback if Groq dies
    return { searchQuery: `${userPrompt} near ${locationContext}`, locationString: locationContext };
  }
}

// 2. ANALYZE PLACES (The Judge - Groq Edition)
export async function analyzePlacesWithGroq(places: any[], userQuery: string) {
  const prompt = `
    ROLE: Friendly foodie guide who vets places.
    USER QUERY: "${userQuery}"

    FOR EACH PLACE: Give helpful positives (Why you'll love it) and move negatives into a separate "note".

    STRICT RULES
    - POSITIVE ONLY in match_reason: highlight taste, signature dishes, ambience perks, service wins. No negatives here.
    - NEGATIVES go to note: only add if there are explicit complaints (slow service, stale food, overpriced, hygiene). Keep concise.
    - FAMOUS_DISHES must be concrete dish names from text (e.g., "butter chicken", "filter coffee"). Ignore vague praise like "food is awesome" or "good ambience". If no real dishes, return an empty list.
    - QUERY FIT: Prefer dishes/cues matching the user query.

    INPUT DATA (Scraped Snippets):
    ${JSON.stringify(places.map(p => ({
      name: p.title,
      rating: p.rating,
      text: p.scraped_content ? p.scraped_content.slice(0, 4000) : "No reviews available."
    })))}

    OUTPUT (JSON):
    {
      "recommendations": [
        {
          "name": "Exact Name",
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
    return cleanAndParseJSON(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq Analysis Failed:", error);
    return { recommendations: [] };
  }
}

// 3. FALLBACK QUERY GENERATOR (Groq Version)
export async function getFallbackQueryWithGroq(originalQuery: string, location: string) {
  const prompt = `
    CONTEXT: User searched for "${originalQuery}" in "${location}" but found 0 results.
    
    TASK: 
    1. Identify the broad category (e.g., "Fruit Ice Cream" -> "Ice Cream Shop").
    2. Return a search query for that CATEGORY inside "${location}".
    
    CRITICAL: MUST include "${location}" in the string.
    RETURN ONLY THE SEARCH STRING. NO JSON.
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