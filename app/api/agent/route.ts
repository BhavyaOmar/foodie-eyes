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
// We build this manually because Serper's direct links can be unstable
function getGoogleMapsLink(place: Place): string {
  if (place.cid) return `https://www.google.com/maps?cid=${place.cid}`;
  if (place.place_id) return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`;
  
  // Fallback: Search by name + address
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.title} ${place.address}`)}`;
}

// --- HELPER 2: Normalize Place Data ---
function normalizePlace(rawPlace: any): Place {
  return {
    ...rawPlace,
    address: rawPlace.address || rawPlace.formatted_address || rawPlace.vicinity || "Address not available",
    // This provides a valid clickable link for the UI
    link: getGoogleMapsLink(rawPlace),
  };
}

// --- HELPER 3: Search Google Maps (Smart Splitter) ---
// Handles complex Groq outputs like "Awadhi cuisine, street food, and cafes"
async function searchPlaces(query: string, location: string): Promise<Place[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY is missing");

  const url = "https://google.serper.dev/places";
  
  // 1. SPLIT LOGIC: If Groq returns a compound query, break it down
  // e.g. "Awadhi cuisine, Street food" -> ["Awadhi cuisine", "Street food"]
  let queries = [query];
  
  if (query.includes(",") || query.includes(" and ")) {
     const rawParts = query.split(/,| and /);
     const cleanParts = rawParts
       .map(s => s.replace(/hidden gems|authentic|famous|best|top|places/gi, "").trim())
       .filter(s => s.length > 2); // Remove empty junk

     if (cleanParts.length > 0) queries = cleanParts;
  }

  console.log(`⚡ Executing ${queries.length} parallel searches for:`, queries);

  // 2. RUN PARALLEL SEARCHES
  const promises = queries.map(async (q) => {
    // Ensure the location is attached to each sub-query
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
  
  // 3. FLATTEN & DEDUPLICATE (Remove duplicates found in multiple searches)
  const allPlaces = results.flat();
  const seenIds = new Set();
  
  return allPlaces.filter(place => {
    const id = place.cid || place.place_id || place.title;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}

// --- HELPER 4: Fetch Reviews via Serper (The "Public Opinion" Fetcher) ---
// Instead of Jina (which gets blocked), we ask Google for the reviews/snippets
async function getPlaceDetails(place: Place): Promise<Place> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return place;

  // We search for reviews + menu items specifically
  const reviewQuery = `reviews of ${place.title} ${place.address} food menu must try`;

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: reviewQuery, gl: "in", num: 5 }),
    });

    const data: SerperResponse = await response.json();
    
    // Extract "snippets" - these are the honest summaries from sites like TripAdvisor/Zomato/Maps
    const snippets = (data.organic || [])
      .map(item => `- "${item.snippet}" (Source: ${item.title})`)
      .join("\n");

    const combinedContent = `Public Reviews & Highlights:\n${snippets}`;

    if (snippets.length > 0) {
      return { ...place, scraped_content: combinedContent };
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

    // --- STEP 1: GROQ (REFINE) ---
    // Turn "I want spicy food" into "Spicy Restaurants"
    const refinedData = await refineQuery(query, userLocation || "India");
    let optimizedQuery = refinedData.searchQuery;
    const locationContext = refinedData.locationString;

    // Cleaner: Remove LLM artifacts like "| Veg" or quotes
    optimizedQuery = optimizedQuery.replace(/[|"]/g, "").trim();

    console.log(`🔍 Groq Refined Query: "${optimizedQuery}"`);

    // --- STEP 2: SERPER (SEARCH) ---
    // Uses the "Splitter" logic to handle complex queries
    let places = await searchPlaces(optimizedQuery, locationContext);
    
    // Strict Location Filter: Ensure results are actually in the city
    if (locationContext && places.length > 0) {
       const city = locationContext.split(',')[0].toLowerCase().trim();
       places = places.filter(p => (p.address || "").toLowerCase().includes(city));
    }

    // Fallback if strict search failed
    if (places.length === 0) {
       console.log("⚠️ No results. Trying fallback query...");
       const fallbackQ = await getFallbackQuery(query, locationContext);
       places = await searchPlaces(fallbackQ, locationContext);
    }

    if (places.length === 0) {
       return NextResponse.json({ status: "success", data: [], context: { message: "No places found." } });
    }

    // --- STEP 3: SERPER (ENRICH) ---
    // Get the "Vibe" and "Reviews" for the top 5 places
    const topCandidates = places.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    
    console.log(`🗣️ Fetching public reviews for top ${topCandidates.length} candidates...`);
    
    const enrichedPlaces = await Promise.all(
      topCandidates.map(place => getPlaceDetails(place))
    );

    // --- STEP 4: GROQ (ANALYZE) ---
    // Send the places + Serper snippets to Groq for final verdict
    console.log("🧠 Groq Analyzing Reviews...");
    const finalVerdict = await analyzePlaces(enrichedPlaces, query);

    // --- STEP 5: MERGE AI INSIGHTS WITH RAW PLACE DATA ---
    const cleanedRecommendations = (finalVerdict.recommendations || enrichedPlaces).map((rec: any) => {
      const original = enrichedPlaces.find(
        (p) => p.title?.toLowerCase() === rec.name?.toLowerCase()
      ) || enrichedPlaces.find((p) => p.title?.toLowerCase().includes((rec.name || '').toLowerCase())) || enrichedPlaces[0];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { scraped_content, ...placeData } = original || {};

      // Guard against bogus dish strings like "food is awesome"
      const cleanedDishes = Array.isArray(rec.famous_dishes)
        ? rec.famous_dishes.filter((d: string) => d && /[a-zA-Z]/.test(d) && d.length <= 80 && !/awesome|great|nice|good food/i.test(d))
        : placeData?.famous_dishes;

      return {
        ...placeData,
        name: rec.name || placeData?.title || placeData?.name,
        address: placeData?.address || rec.address,
        rating: placeData?.rating ?? rec.rating,
        website: placeData?.website || rec.website,
        phone: placeData?.phone || rec.phone,
        link: placeData?.link || rec.link,
        categories: placeData?.categories || rec.categories,
        match_reason: rec.match_reason || rec.why_love,
        note: rec.note,
        famous_dishes: cleanedDishes,
        tip: rec.tip || rec.Tip,
      };
    });

    return NextResponse.json({
      status: "success",
      data: cleanedRecommendations,
      context: { 
        original_query: query, 
        location_used: locationContext 
      }
    });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}