import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeWithGroq(places: any[], userMood: string) {
  console.log("⚠️ Switching to Backup AI (Groq/Llama 3)...");

  const prompt = `
    ACT AS: A Food Critic.
    USER MOOD: "${userMood}"
    DATA: ${JSON.stringify(places)}
    
    TASK:
    1. Filter out places that don't match the mood.
    2. Pick the top 3.
    3. Return ONLY valid JSON.
    
    OUTPUT JSON FORMAT:
    {
      "recommendations": [
        {
          "name": "Place Name",
          "match_reason": "Why it fits",
          "famous_dishes": ["Dish 1", "Dish 2"],
          "secret_tip": "Tip"
        }
      ]
    }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192", // Fast, free, and good at JSON
      temperature: 0,
      response_format: { type: "json_object" }, // Llama 3 supports JSON mode natively
    });

    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Groq Failed too:", error);
    throw error; // If this fails, we go to Manual Mode
  }
}