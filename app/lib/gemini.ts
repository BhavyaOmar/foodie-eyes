import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. INITIALIZE OUTSIDE (Global Scope)
// This ensures all functions use the same instance and saves memory.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-001",
  generationConfig: { responseMimeType: "application/json" } // Force JSON for structured tasks
});

// --- Tool 1: Refines User Search (The Interpreter) ---
export async function refineQuery(userPrompt: string, locationContext: string) {
  const prompt = `
    ACT AS: A Search Engine Optimizer for a food app.
    
    USER INPUT: "${userPrompt}"
    USER LOCATION CONTEXT: "${locationContext}"

    TASK:
    1. Extract the food intent (e.g., "Sad" -> "Comfort Food", "Broke" -> "Cheap", "Date" -> "Romantic").
    2. Extract the location. 
       - If the user explicitly typed a location in their input (e.g. "Pizza in CP"), use that. 
       - Otherwise, use the USER LOCATION CONTEXT provided above.
    3. Create a short, punchy search query for Google Maps.

    OUTPUT JSON FORMAT:
    {
      "searchQuery": "String (e.g. Cheap Italian Food)",
      "locationString": "String (e.g. Connaught Place, Delhi)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean potential markdown markers
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    // Fallback: Just return inputs as is
    return { searchQuery: userPrompt, locationString: locationContext };
  }
}

// --- Tool 2: Analyzes Results (The Judge) ---
export async function analyzePlaces(places: any[], userMood: string) {
  const prompt = `
    ACT AS: A Food Critic and Local Guide.
    
    USER MOOD/QUERY: "${userMood}"
    
    DATA: Here are details on 3-4 places (including scraped menu text). 
    ${JSON.stringify(places)}
    
    TASK: 
    1. Analyze the 'scraped_content' and 'reviews' to find which places best match the user's mood.
    2. Return the top recommendations.
    
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
          "secret_tip": "A specific dish or seat to ask for (based on scraped data)"
        }
      ]
    }
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Gemini Analyze Error:", e);
    // Fallback: Return raw places if AI fails
    return { recommendations: places };
  }
}

// --- Tool 3: Fallback Strategy (The Backup Plan) ---
export async function getFallbackQuery(originalQuery: string, location: string) {
  // We need a separate model instance for this because we DON'T want JSON here, just plain text.
  const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

  const prompt = `
    CONTEXT: User searched for "${originalQuery}" in "${location}" but NO RESULTS were found.
    
    TASK: Generate a "Broad Alternative" search query.
    - If they asked for a specific dish (e.g. "Sushi"), look for the broader cuisine (e.g. "Asian Food").
    - If they asked for a specific vibe (e.g. "Roof top jazz bar"), look for "Best Rated Restaurants".
    - KEEP IT BROAD to ensure we find *something* in this location.
    
    RETURN ONLY THE SEARCH STRING. No JSON, no quotes.
  `;
  
  try {
    const result = await textModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    return `Restaurants in ${location}`;
  }
}