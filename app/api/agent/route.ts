import { NextRequest, NextResponse } from "next/server";
import { refineQuery, analyzePlaces, getFallbackQuery } from "@/app/lib/gemini"; 

// --- HELPER 1: Search Google Maps (Serper) ---
async function searchPlaces(query: string, location: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("Missing SERPER_API_KEY");

  const url = "https://google.serper.dev/places";
  const body = JSON.stringify({ q: query, location: location, gl: "in" });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: body,
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.places || [];
  } catch (e) {
    console.error("Serper Error:", e);
    return [];
  }
}

// --- HELPER 2: Scrape Reviews (Jina) ---
async function scrapeReviews(place: any) {
  // If we don't have a Google Maps link, we can't scrape reviews.
  if (!place.link) return { ...place, scraped_content: "" };

  const jinaKey = process.env.JINA_API_KEY; 
  
  // 1. We scrape the Google Maps Link (place.link) because that's where the reviews are.
  // 2. We prepend https://r.jina.ai/
  const jinaUrl = `https://r.jina.ai/${place.link}`;

  try {
    const response = await fetch(jinaUrl, {
      method: "GET",
      headers: jinaKey ? { 
        "Authorization": `Bearer ${jinaKey}`,
        "X-Target-Selector": "#QA0Szd", // Targets the review panel specifically on Maps
        "X-Timeout": "8" // Fast timeout so we don't hang
      } : {}
    });

    if (!response.ok) return { ...place, scraped_content: "" };
    
    const text = await response.text();
    // Truncate to save tokens (Gemini doesn't need 50 pages of text)
    return { ...place, scraped_content: text.slice(0, 6000) };

  } catch (e) {
    console.warn(`Skipping scrape for ${place.name}`);
    return { ...place, scraped_content: "" };
  }
}

// --- MAIN ROUTE ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userLocation } = body; 
    
    // --- STEP 0: REFINE (The Brain) ---
    console.log("🧠 Refining intent for:", query);
    const refinedData = await refineQuery(query, userLocation || "India");
    
    const optimizedQuery = refinedData.searchQuery;
    const locationContext = refinedData.locationString;

    console.log(`🔍 Optimized: "${optimizedQuery}"`);

    // --- STEP 1: SEARCH (The Scout) ---
    let places = await searchPlaces(optimizedQuery, locationContext);
    let isFallback = false;
    let fallbackReason = "";

    // === FALLBACK LOGIC (If 0 results found) ===
    if (!places || places.length === 0) {
      console.log("⚠️ No results. Attempting Fallback...");
      
      // Ask Gemini for a broader query (e.g. "Spicy Food" -> "Restaurants")
      const backupQuery = await getFallbackQuery(optimizedQuery, locationContext);
      console.log(`🔄 Trying fallback query: "${backupQuery}"`);
      
      places = await searchPlaces(backupQuery, locationContext);
      
      isFallback = true;
      fallbackReason = `We couldn't find matches for "${query}", so we looked for "${backupQuery}" instead.`;
    }

    // If STILL no results, return empty (don't crash)
    if (!places || places.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        data: [], 
        context: { message: "No places found nearby." } 
      });
    }

    // --- STEP 2: SCRAPE (The Reader) ---
    // Critical: Sort by rating first, so we only scrape the BEST places.
    const bestPlaces = places
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5); // Limit to top 5 to respect Rate Limits
    
    console.log(`⚡ Scraping reviews for top ${bestPlaces.length} places...`);
    
    const enrichedPlaces = await Promise.all(
      bestPlaces.map((place: any) => scrapeReviews(place))
    );

    // --- STEP 3: ANALYZE (The Judge) ---
    console.log("🤖 AI Analysis...");
    const finalVerdict = await analyzePlaces(enrichedPlaces, query);

    // --- STEP 4: RETURN ---
    return NextResponse.json({ 
      status: "success", 
      data: finalVerdict.recommendations || enrichedPlaces, 
      context: {
        isFallback,
        message: fallbackReason,
        original_query: query,
        interpreted_intent: optimizedQuery
      }
    });

  } catch (error) {
    console.error("🔥 Agent Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}