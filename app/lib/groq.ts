import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- HELPER: ROBUST JSON PARSER ---
function cleanAndParseJSON(text: string): any {
  try {
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Groq JSON Parse Error", e);
    return null; 
  }
}

// 1. REFINE QUERY (Groq Version)
export async function refineQueryWithGroq(userPrompt: string, locationContext: string) {
  const prompt = `
    ACT AS: A Google Maps Search Expert.
    USER INPUT: "${userPrompt}"
    LOCATION: "${locationContext}"

    TASK: Convert intent into a 2-4 word Keyword Search.
    OUTPUT JSON ONLY: { "searchQuery": "Keywords + Location", "locationString": "${locationContext}" }
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
    throw error; 
  }
}

// 2. ANALYZE PLACES (Groq Version)
export async function analyzePlacesWithGroq(places: any[], userMood: string) {
  const prompt = `
    ACT AS: A Food Critic.
    USER MOOD: "${userMood}"
    DATA: ${JSON.stringify(places)}

    TASK: Pick top 1-4 places. Return JSON only.
    OUTPUT FORMAT:
    {
      "recommendations": [
        {
          "name": "Exact Name",
          "match_reason": "Why it fits",
          "famous_dishes": ["Dish 1", "Dish 2"],
          "secret_tip": "Tip or null"
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
    throw error;
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
    RETURN ONLY THE SEARCH STRING.
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