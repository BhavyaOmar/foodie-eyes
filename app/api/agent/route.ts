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

// --- HELPER 3: Smart Cuisine Expansion ---
// Now uses LLM (Groq) to detect cuisine instead of hardcoded lists
// This allows infinite dish recognition and better accuracy
// The cuisineCategory is returned from refineQuery() in groq.ts

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

    // Extract the base query (remove filter context like "| Preference: Veg" for validation)
    // This prevents Groq from misinterpreting filter preferences as part of the food query
    const baseQuery = query.split('|')[0].trim();
    
    // --- STEP 1: GROQ (REFINE & VALIDATE) ---
    // Use baseQuery for validation, but keep full query for search
    const refinedData = await refineQuery(baseQuery, userLocation || "India");
    
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

    // Use the full query (with filters) for search, but base the optimization on Groq's response
    let optimizedQuery = refinedData.searchQuery || baseQuery;
    const locationContext = refinedData.locationString || userLocation || "India";

    // Re-append filter context if it exists in the original query
    const filterParts = query.split('|').slice(1); // Get everything after the first |
    if (filterParts.length > 0) {
      optimizedQuery = `${optimizedQuery} | ${filterParts.join(' | ')}`;
    }

    // Clean up any extra pipes or quotes
    optimizedQuery = optimizedQuery.replace(/[|"]/g, "").trim();

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
    
    // Removed overly strict location filtering - Serper already handles location context
    // This was excluding valid results from nearby areas

    let usedFallbackQuery = false;
    if (places.length === 0) {
       console.log("⚠️ No results. Trying fallback query...");
       const fallbackQ = await getFallbackQuery(query, locationContext);
       const fallbackResults = await searchPlaces(fallbackQ, locationContext);
       if (fallbackResults.length > 0) {
         places = fallbackResults;
         usedFallbackQuery = true;
       }
    }

    // 🔥 SMART FILTERING: More lenient matching + Cuisine expansion
    // Keep place type keywords (cafe, restaurant, etc.) as they're important for filtering
    const forbiddenTerms = ["in", "near", "best", "top", "famous", "hot", "spicy", "places", "find", "search", "looking", "for", "some", "me", "suggest"];
    const searchTerms = query.toLowerCase().split(" ")
      .filter((w: string) => !forbiddenTerms.includes(w) && w.length > 2);
    
    const relevantTerms = searchTerms.length > 0 ? searchTerms : [];
    // Get cuisine category from Groq LLM (instead of hardcoded lists)
    let cuisineCategory = refinedData.cuisineCategory || null;
    let usedCuisineExpansion = false;

    // ALWAYS run cuisine expansion when cuisine is detected (not just when < 5 results)
    if (cuisineCategory && !optimizedQuery.toLowerCase().includes(cuisineCategory.toLowerCase())) {
      console.log(`🍜 Always expanding search to ${cuisineCategory} cuisine for query: ${query}`);
      const cuisineQuery = `${cuisineCategory} restaurants`;
      const cuisineResults = await searchPlaces(cuisineQuery, locationContext);
      
      // Merge cuisine results with original results, avoiding duplicates
      const existingIds = new Set(places.map(p => p.cid || p.place_id || p.title));
      const newPlaces = cuisineResults.filter(p => !existingIds.has(p.cid || p.place_id || p.title));
      places = [...places, ...newPlaces];
      usedCuisineExpansion = true;
      console.log(`✅ Merged ${newPlaces.length} additional ${cuisineCategory} restaurants. Total: ${places.length}`);
    }

    // 🔥 SMART SCORING: Boost cuisine matches, then sort by score (not just rating)
    let fallbackMessage = null;
    
    if (places.length > 0) {
      // Score each place: cuisine match boost + term match + rating
      const scoredPlaces = places.map(place => {
        const placeTitle = (place.title || "").toLowerCase();
        const placeAddress = (place.address || "").toLowerCase();
        const placeCategories = (place.categories || []).join(" ").toLowerCase();
        const combinedStr = `${placeTitle} ${placeAddress} ${placeCategories}`;
        
        let score = 0;
        let cuisineMatch = false;
        let termMatchRatio = 0;
        
        // 1. CUISINE MATCH BOOST (High priority)
        if (cuisineCategory) {
          const cuisineLower = cuisineCategory.toLowerCase();
          if (combinedStr.includes(cuisineLower) || 
              placeCategories.includes(cuisineLower) ||
              placeTitle.includes(cuisineLower)) {
            cuisineMatch = true;
            score += 1000; // Big boost for cuisine match
          }
        }
        
        // 2. PLACE TYPE MATCH BOOST (Very High Priority - e.g., "cafe" should match cafes, not parks)
        const placeTypeKeywords = ['cafe', 'restaurant', 'bar', 'bakery', 'food', 'dining', 'eatery', 'bistro'];
        const queryPlaceTypes = relevantTerms.filter((term: string) => placeTypeKeywords.includes(term));
        if (queryPlaceTypes.length > 0) {
          const hasPlaceType = queryPlaceTypes.some((type: string) => 
            placeTitle.includes(type) || 
            placeCategories.includes(type) ||
            combinedStr.includes(type)
          );
          if (hasPlaceType) {
            score += 1500; // Even higher boost for place type match (cafe, restaurant, etc.)
          } else {
            // Penalize places that don't match the requested type (e.g., park when searching for cafe)
            score -= 2000; // Heavy penalty for wrong place type
          }
        }
        
        // 3. TERM MATCH RATIO (Medium priority)
        if (relevantTerms.length > 0) {
          const matchingTerms = relevantTerms.filter((term: string) => combinedStr.includes(term));
          termMatchRatio = matchingTerms.length / relevantTerms.length;
          score += termMatchRatio * 500; // Boost based on how many terms match
        }
        
        // 4. RATING (Lower priority, but still matters)
        const rating = place.rating || 0;
        score += rating * 10; // Rating contributes but less than cuisine/term matches
        
        return {
          place,
          score,
          cuisineMatch,
          termMatchRatio,
          rating
        };
      });
      
      // Sort by score (highest first): Cuisine matches + term matches come first
      scoredPlaces.sort((a, b) => b.score - a.score);
      
      // Extract places back in sorted order
      places = scoredPlaces.map(sp => sp.place);
      
      // Count cuisine matches for message
      const cuisineMatches = scoredPlaces.filter(sp => sp.cuisineMatch).length;
      const nonCuisineMatches = scoredPlaces.length - cuisineMatches;
      
      // Set informative message
      if (usedCuisineExpansion && cuisineCategory) {
        if (cuisineMatches > 0) {
          fallbackMessage = `Found ${cuisineMatches} ${cuisineCategory} restaurant${cuisineMatches > 1 ? 's' : ''}${nonCuisineMatches > 0 ? ` and ${nonCuisineMatches} other place${nonCuisineMatches > 1 ? 's' : ''}` : ''} in this area.`;
        } else {
          fallbackMessage = `Found restaurants in this area.`;
        }
      } else if (relevantTerms.length > 0) {
        const exactMatches = scoredPlaces.filter(sp => sp.termMatchRatio === 1).length;
        if (exactMatches > 0) {
          // No message needed for exact matches
        } else {
          fallbackMessage = `Found places related to "${relevantTerms.join(" ")}" in this area.`;
        }
      }
    }

    if (places.length === 0) {
       return NextResponse.json({ status: "success", data: [], context: { message: "No places found." } });
    }

    // --- STEP 3: SERPER (ENRICH) ---
    // 👇 Places are already sorted by smart scoring (cuisine first, then term matches, then rating)
    // No need to re-sort by rating - just take top 12
    const topCandidates = places.slice(0, 12);
    
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
        isFallback: false, // Don't mark as fallback if we have results - only use fallbackMessage
        message: fallbackMessage || null, // Only show message if we have a meaningful explanation
        was_corrected: refinedData.was_corrected,
        corrected_term: refinedData.corrected_term
      }
    });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}