import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from  "../../lib/serper"
import { scrapeWebsite } from "../../lib/jina"
import { refineQuery, analyzePlaces, getFallbackQuery } from "../../lib/gemini"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userLocation } = body; 
    
    // --- STEP 0: REFINE (The Brain) ---
    console.log("Refining intent for:", query);
    // userLocation is now a string like "Connaught Place" or "28.5,77.2"
    const refinedData = await refineQuery(query, userLocation || "India");
    
    const optimizedQuery = refinedData.searchQuery;
    const locationContext = refinedData.locationString;

    console.log(`Optimized: "${optimizedQuery}" in "${locationContext}"`);

    // --- STEP 1: SEARCH (The Scout) ---
    let places = await searchPlaces(optimizedQuery, locationContext);
    let isFallback = false;
    let fallbackReason = "";

    // === FALLBACK LOGIC (If 0 results found) ===
    if (!places || places.length === 0) {
      console.log("No results found. Attempting Fallback...");
      
      // A. Ask Gemini for a broader query
      const backupQuery = await getFallbackQuery(optimizedQuery, locationContext);
      console.log(`🔄 Trying fallback query: "${backupQuery}"`);
      
      // B. Search again
      places = await searchPlaces(backupQuery, locationContext);
      
      isFallback = true;
      fallbackReason = `We couldn't find "${optimizedQuery}" nearby, so we found some "${backupQuery}" options instead.`;
    }

    // If STILL no results, stop here
    if (!places || places.length === 0) {
      return NextResponse.json({ 
        status: "error", 
        message: "No places found even after broadening search." 
      });
    }

    // --- STEP 2: SCRAPE (The Reader) ---
    // Limit to top 4 to save time/tokens
    const topPlaces = places.slice(0, 4);
    
    console.log("Scraping websites...");
    const enrichedPlaces = await Promise.all(
      topPlaces.map(async (place: any) => {
        let details = "";
        // Only scrape if it's a real website (skip google links)
        if (place.website && !place.website.includes("google.com")) {
          details = await scrapeWebsite(place.website);
        }
        return { ...place, scraped_content: details };
      })
    );

    // --- STEP 3: ANALYZE (The Judge) ---
    console.log("Final Analysis...");
    // Use the Analyze tool to rank/format the data
    const finalVerdict = await analyzePlaces(enrichedPlaces, query);

    // --- STEP 4: RETURN ---
    return NextResponse.json({ 
      status: "success", 
      data: finalVerdict.recommendations || enrichedPlaces, // Fallback to raw data if analysis fails
      context: {
        isFallback,
        message: fallbackReason,
        original_query: query,
        interpreted_intent: optimizedQuery
      }
    });

  } catch (error) {
    console.error("Agent Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}