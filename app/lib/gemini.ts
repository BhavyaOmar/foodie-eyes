import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function refineQuery(userPrompt: string, browserLocation: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // Force JSON
  });

  const prompt = `
    ACT AS: A Search Engine Optimizer for a food app.
    
    USER INPUT: "${userPrompt}"
    USER GPS LOCATION: "${browserLocation}" (Use this if user doesn't mention a city)

    TASK:
    1. Extract the food intent (e.g., "Sad" -> "Comfort Food", "Broke" -> "Cheap").
    2. Extract the location. If the user typed a location (e.g., "in CP"), use that. If not, use the USER GPS LOCATION.
    3. Create a short, punchy search query for Google Maps.

    OUTPUT JSON FORMAT:
    {
      "searchQuery": "String (e.g. Cheap Italian Food)",
      "location": "String (e.g. Connaught Place, Delhi)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    // Fallback if AI fails
    return { searchQuery: userPrompt, location: browserLocation };
  }
}