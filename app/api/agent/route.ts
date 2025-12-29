import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "../../lib/serper";
import { scrapeWebsite } from "../../lib/jina";
import { refineQuery } from "../../lib/gemini"; // Import the new tool

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userLocation } = body; 
    // userLocation comes from the browser GPS logic we wrote earlier

    // --- STEP 0: REFINE (The Brain before the Action) ---
    console.log("🧠 Refining intent for:", query);
    
    const refinedData = await refineQuery(query, userLocation || "India");
    
    const optimizedQuery = refinedData.searchQuery;
    const finalLocation = refinedData.location;

    console.log(`✨ Optimized: "${optimizedQuery}" in "${finalLocation}"`);


    // --- STEP 1: SEARCH (Serper) ---
    // Now we use the optimized query, not the raw user text
    const places = await searchPlaces(optimizedQuery, finalLocation);

    if (!places || places.length === 0) {
      return NextResponse.json({ 
        status: "error", 
        message: "No places found for your mood." 
      });
    }

    // --- STEP 2: SCRAPE (Jina) ---
    // (This part stays the same as before)
    const enrichedPlaces = await Promise.all(
        places.map(async (place: any) => {
          let details = "";
          if (place.website) {
            details = await scrapeWebsite(place.website);
          }
          return { ...place, scraped_content: details };
        })
      );

    // --- STEP 3: RETURN ---
    return NextResponse.json({ 
      status: "success", 
      data: enrichedPlaces,
      meta: {
        original_query: query,
        interpreted_intent: optimizedQuery
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Agent Failure" }, { status: 500 });
  }
}