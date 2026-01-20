import { NextRequest, NextResponse } from "next/server";
// ✅ GROQ USAGE 1 & 2: Imported here for Query Refinement and Analysis
import { refineQuery, analyzePlaces, getFallbackQuery } from "@/app/lib/groq";

// --- CONFIGURATION ---
export const maxDuration = 60; // Allow time for multiple parallel searches
export const dynamic = 'force-dynamic';

// --- TYPES ---
interface Place {
  title: string;
  address?: string;
  rating?: number;
  userRatingCount?: number;
  link?: string;
  website?: string;
  cid?: string;
  place_id?: string;
  scraped_content?: string;
  [key: string]: any;
}

interface SerperResponse {
  places?: Place[];
  organic?: { snippet: string; link: string; title: string }[];
  knowledgeGraph?: { description?: string };
}

// --- HELPER 1: Generate Reliable Google Maps URL ---
function getGoogleMapsLink(place: Place): string {
  if (place.cid) return `https://www.google.com/maps?cid=${place.cid}`;
  if (place.place_id) return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`;
  // Fallback: Search by name + address
  const title = place.title || (place as any).name;
  const address = place.address || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${address}`)}`;
}

// --- HELPER 2: Normalize Place Data ---
function normalizePlace(rawPlace: any): Place {
  return {
    ...rawPlace,
    address: rawPlace.address || rawPlace.formatted_address || rawPlace.vicinity || "Address not available",
    link: getGoogleMapsLink(rawPlace),
  };
}

// --- HELPER 3: Search Google Maps (Smart Splitter) ---
async function searchPlaces(query: string, location: string): Promise<Place[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY is missing");

  const url = "https://google.serper.dev/places";
  
  let queries = [query];
  
  if (query.includes(",") || query.includes(" and ")) {
     const rawParts = query.split(/,| and /);
     const cleanParts = rawParts
       .map(s => s.replace(/hidden gems|authentic|famous|best|top|places|find|search/gi, "").trim())
       .filter(s => s.length > 2);

     if (cleanParts.length > 0) queries = cleanParts;
  }

  console.log(`⚡ Executing ${queries.length} parallel searches for:`, queries);

  const promises = queries.map(async (q) => {
    const searchString = q.toLowerCase().includes(location.toLowerCase()) 
      ? q 
      : `${q} near ${location}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: searchString, location: location, gl: "in", hl: "en" }),
      });
      const data: SerperResponse = await response.json();
      return (data.places || []).map(normalizePlace);
    } catch (e) {
      console.warn(`Search failed for sub-query: ${q}`);
      return [];
    }
  });

  const results = await Promise.all(promises);
  
  const allPlaces = results.flat();
  const seenIds = new Set();
  
  return allPlaces.filter(place => {
    const id = place.cid || place.place_id || place.title;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}

// --- HELPER 4: Fetch Reviews via Serper ---
async function getPlaceDetails(place: Place): Promise<Place> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return place;

  const reviewQuery = `reviews of ${place.title} ${place.address} food menu must try`;

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: reviewQuery, gl: "in", num: 5 }),
    });

    const data: SerperResponse = await response.json();
    
    const snippets = (data.organic || [])
      .map(item => `- "${item.snippet}" (Source: ${item.title})`)
      .join("\n");

    if (snippets.length > 0) {
      return { ...place, scraped_content: `Public Reviews & Highlights:\n${snippets}` };
    }
  } catch (e) {
    console.warn(`Failed to fetch details for ${place.title}`);
  }

  return { ...place, scraped_content: "No detailed public reviews found." };
}

// --- MAIN ROUTE ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userLocation } = body;

    // --- STEP 1: GROQ (REFINE & VALIDATE) ---
    const refinedData = await refineQuery(query, userLocation || "India");
    
    console.log("🔍 Food Validation:", { query, is_food: refinedData.is_food, response: refinedData.searchQuery });
    
    // Check if the query is about food
    if (refinedData.is_food === false) {
      return NextResponse.json({
        status: "error",
        data: [],
        context: {
          message: refinedData.searchQuery || "Sorry, I can only help with food or drinks. Please enter something edible or drinkable.",
          is_food_related: false
        }
      }, { status: 400 });
    }

    let optimizedQuery = refinedData.searchQuery || query;
    const locationContext = refinedData.locationString || userLocation || "India";

    optimizedQuery = optimizedQuery.replace(/[|"]/g, "").trim().toLowerCase();

    console.log("🧠 Search Intent:", {
      raw: query,
      optimized: optimizedQuery,
      location: locationContext,
      is_food: refinedData.is_food,
      was_corrected: refinedData.was_corrected,
      corrected_term: refinedData.corrected_term
    });

    // --- STEP 2: SERPER (SEARCH) ---
    let places = await searchPlaces(optimizedQuery, locationContext);
    
    if (locationContext && places.length > 0) {
       const city = locationContext.split(',')[0].toLowerCase().trim();
       places = places.filter(p => (p.address || "").toLowerCase().includes(city));
    }

    if (places.length === 0) {
       console.log("⚠️ No results. Trying fallback query...");
       const fallbackQ = await getFallbackQuery(query, locationContext);
       places = await searchPlaces(fallbackQ, locationContext);
    }

    // 🔥 STRICT FILTERING (Fix for Pizza vs Chowmein)
    // Identify the main "subject" from the user's raw query (e.g. "Pizza")
    const forbiddenTerms = ["in", "near", "best", "top", "famous", "hot", "spicy", "places", "restaurants"];
    const searchTerms = query.toLowerCase().split(" ")
      .filter((w: string) => !forbiddenTerms.includes(w) && w.length > 2);
    const mainSubject = searchTerms[0] || "";

    const exactMatches: Place[] = [];
    const alternatives: Place[] = [];
    let fallbackMessage = null;

    if (mainSubject && places) {
      // Sort places into exact keyword matches vs others
      places.forEach(place => {
         const placeStr = JSON.stringify(place).toLowerCase();
        if (placeStr.includes(mainSubject.toLowerCase())) {
          exactMatches.push(place);
        } else {
          alternatives.push(place);
        }
      });

      if (exactMatches.length > 0) {
        // If we found the exact thing, ONLY show that
        places = exactMatches;
      } else {
        // If we found NOTHING, show alternatives and set a warning message
        places = alternatives;
        if (places.length > 0) {
          fallbackMessage = `We couldn't find exact matches for "${mainSubject.toLowerCase()}" in this area. Here are some popular alternatives instead.`;
        }
      }
    }

    if (places.length === 0) {
       return NextResponse.json({ status: "success", data: [], context: { message: "No places found." } });
    }

    // --- STEP 3: SERPER (ENRICH) ---
    // 👇 THIS IS THE LINE CONTROLLING THE NUMBER OF CARDS
    const topCandidates = places.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    
    console.log(`🗣️ Fetching public reviews for top ${topCandidates.length} candidates...`);
    
    const enrichedPlaces = await Promise.all(
      topCandidates.map(place => getPlaceDetails(place))
    );

    // --- STEP 4: GROQ (ANALYZE) ---
    console.log("🧠 Groq Analyzing Reviews...");
    const finalVerdict = await analyzePlaces(enrichedPlaces, query);

    // --- STEP 5: MERGE AI INSIGHTS ---
const finalAnalysis = finalVerdict.place_analysis || [];

const cleanedRecommendations = finalAnalysis.map((rec: any) => {
  const original = enrichedPlaces.find(
    (p) => p.title?.toLowerCase() === rec.name?.toLowerCase()
  ) || enrichedPlaces.find((p) => p.title?.toLowerCase().includes((rec.name || '').toLowerCase())) || enrichedPlaces[0];

  return {
    ...original,
    name: rec.name || original?.title || original?.name,
    address: original?.address || rec.address,
    rating: original?.rating ?? rec.rating,
    website: original?.website || rec.website,
    phone: original?.phone || rec.phone,
    link: original?.link || rec.link,
    categories: original?.categories || rec.categories,
    match_reason: rec.match_reason || rec.why_love || "",
    note: rec.note ,
    famous_dishes: Array.isArray(rec.famous_dishes) ? rec.famous_dishes.slice(0, 5) : [],
    tip: rec.tip || rec.Tip || "",
    is_relevant: rec.is_relevant ?? true,
  };
});

    return NextResponse.json({
      status: "success",
      data: cleanedRecommendations,
      context: { 
        original_query: query, 
        location_used: locationContext,
        isFallback: !!fallbackMessage, // Flag for frontend
        message: fallbackMessage,
        was_corrected: refinedData.was_corrected,
        corrected_term: refinedData.corrected_term       // The warning message
      }
    });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}