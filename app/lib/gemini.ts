import { GoogleGenerativeAI } from "@google/generative-ai";
import { refineQueryWithGroq, analyzePlacesWithGroq, getFallbackQueryWithGroq } from "./groq"; 

if (!process.env.GOOGLE_API_KEY) throw new Error("Missing GOOGLE_API_KEY");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  generationConfig: { responseMimeType: "application/json", temperature: 0 } 
});

// 🚩 GLOBAL STATE: Tracks if Gemini is "down" for this session
let useBackup = false; 

// --- TOOL 1: REFINE QUERY ---
export async function refineQuery(userPrompt: string, locationContext: string) {
  
  if (useBackup) {
    console.log("⚡ [Mode: Backup] Routing 'Refine' directly to Groq...");
    return await refineQueryWithGroq(userPrompt, locationContext);
  }

  const prompt = `
    ACT AS: A Google Maps Search Expert.
    USER INPUT: "${userPrompt}"
    LOCATION: "${locationContext}"
    TASK: Return JSON with "searchQuery" (keywords) and "locationString".
  `;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());

  } catch (error) {
    console.warn("⚠️ Gemini Refine Failed. Switching to Groq PERMANENTLY.", error);
    useBackup = true; 
    return await refineQueryWithGroq(userPrompt, locationContext);
  }
}

// --- TOOL 2: ANALYZE PLACES ---
export async function analyzePlaces(places: any[], userMood: string) {

  if (useBackup) {
    console.log("⚡ [Mode: Backup] Routing 'Analyze' directly to Groq...");
    return await handleAnalysisWithGroq(places, userMood);
  }

  const prompt = `
    ACT AS: Food Critic. USER MOOD: "${userMood}". DATA: ${JSON.stringify(places)}
    TASK: Return JSON with "recommendations" (name, match_reason, famous_dishes, secret_tip).
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiData = JSON.parse(result.response.text());
    return mergeData(places, aiData);

  } catch (error) {
    console.warn("⚠️ Gemini Analysis Failed. Switching to Groq PERMANENTLY.", error);
    useBackup = true;
    return await handleAnalysisWithGroq(places, userMood);
  }
}

// --- TOOL 3: FALLBACK STRATEGY ---
export async function getFallbackQuery(originalQuery: string, location: string) {
  
  if (useBackup) {
    return await getFallbackQueryWithGroq(originalQuery, location);
  }

  const prompt = `
    CONTEXT: User searched for "${originalQuery}" in "${location}" but found 0 results.
    
    TASK: 
    1. Identify the broad category of the food (e.g., "Fruit Ice Cream" -> "Ice Cream Parlour").
    2. Construct a search query for that CATEGORY strictly inside "${location}".
    
    ⚠️ CRITICAL RULES:
    - You MUST include "${location}" in the output string.
    - Do NOT search for the specific dish again. Search for the SHOP TYPE.
    
    EXAMPLE:
    - Input: "Waffles in Mau", Location: "Mau"
    - Output: "Dessert Shop in Mau"
    
    RETURN ONLY THE SEARCH STRING. No JSON.
  `;
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error) {
    console.warn("⚠️ Gemini Fallback Gen Failed. Switching to Groq PERMANENTLY.", error);
    useBackup = true;
    return await getFallbackQueryWithGroq(originalQuery, location);
  }
}

// --- HELPERS ---

async function handleAnalysisWithGroq(places: any[], mood: string) {
  try {
    const groqData = await analyzePlacesWithGroq(places, mood);
    return mergeData(places, groqData);
  } catch (e) {
    console.error("❌ CRITICAL: Both AIs Failed. Using Manual Fallback.");
    return getManualFallback(places);
  }
}

function mergeData(originalPlaces: any[], aiResult: any) {
  if (!aiResult?.recommendations) return getManualFallback(originalPlaces);

  const merged = aiResult.recommendations.map((rec: any) => {
    // Find original to get images/coords
    const original = originalPlaces.find(p => p.title.includes(rec.name) || rec.name.includes(p.title));
    if (!original) return null;
    return { ...original, ...rec };
  }).filter(Boolean);

  return { recommendations: merged };
}

function getManualFallback(places: any[]) {
  return {
    recommendations: places.slice(0, 4).map(p => ({
      ...p,
      match_reason: "A top-rated spot nearby.",
      famous_dishes: ["Signature Dish"],
      secret_tip: null
    }))
  };
}