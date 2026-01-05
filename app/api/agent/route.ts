import { NextRequest, NextResponse } from "next/server";
import { refineQuery, analyzePlaces, getFallbackQuery } from "@/app/lib/gemini"; 
import { scrapeWebsite } from "@/app/lib/jina"; 

// --- TYPES ---
interface Place {
  title: string;
  address?: string;
  rating?: number;
  userRatingCount?: number;
  link?: string;     // Google Maps Link
  website?: string;  // Official Website
  scraped_content?: string;
  [key: string]: any;
}

interface SerperResponse {
  places: Place[];
}

// --- CONFIG ---
const SCRAPE_TIMEOUT_MS = 8000; // Skip a site if it takes > 8s
const MAX_CHARS_PER_SITE = 3000; // Save tokens

// --- HELPER 1: Search Google Maps (Serper) ---
async function searchPlaces(query: string, location: string): Promise<Place[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error("❌ Critical: SERPER_API_KEY is missing");
    throw new Error("Service configuration error");
  }

  const url = "https://google.serper.dev/places";
  const body = JSON.stringify({ q: query, location: location, gl: "in" });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: body,
    });
    
    if (!response.ok) {
      console.error(`❌ Serper API Error: ${response.statusText}`);
      return [];
    }

    const data: SerperResponse = await response.json();
    return data.places || [];
  } catch (e) {
    console.error("❌ Serper Network Error:", e);
    return [];
  }
}

// --- HELPER 2: Scrape Reviews (Jina) with Timeout & Truncation ---
async function scrapeReviews(place: Place): Promise<Place> {
  // Prioritize official website for menus/vibes, fallback to Maps link
  const targetUrl = place.website || place.link;

  if (!targetUrl) return { ...place, scraped_content: "" };

  try {
    // Create a timeout promise
    const timeout = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), SCRAPE_TIMEOUT_MS)
    );

    // Race the scraper against the timeout
    const content = await Promise.race([
      scrapeWebsite(targetUrl),
      timeout
    ]) as string;

    // Truncate content to save tokens
    const cleanedContent = content.slice(0, MAX_CHARS_PER_SITE);

    return { ...place, scraped_content: cleanedContent };

  } catch (e) {
    console.warn(`⚠️ Skipping scrape for ${place.title} (Timeout/Error)`);
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

    console.log(`🔍 Optimized Search: "${optimizedQuery}" @ "${locationContext}"`);

    // --- STEP 1: SEARCH (The Scout) ---
    let places = await searchPlaces(optimizedQuery, locationContext);
    let isFallback = false;
    let fallbackMessage = "";

    // === FALLBACK LOGIC (If 0 results found) ===
    if (!places || places.length === 0) {
      console.log("⚠️ No results found. Initiating fallback protocol...");
      
      const backupQuery = await getFallbackQuery(optimizedQuery, locationContext);
      console.log(`🔄 Retrying with fallback query: "${backupQuery}"`);
      
      places = await searchPlaces(backupQuery, locationContext);
      
      if (places.length > 0) {
        isFallback = true;
        fallbackMessage = `We couldn't find exact matches for "${query}", but here are some similar options.`;
      }
    }

    // Double check emptiness after fallback
    if (!places || places.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        data: [], 
        context: { message: "No places found nearby matching your criteria." } 
      });
    }

    // --- STEP 2: SCRAPE (The Reader) ---
    // Sort by rating and pick top 4 to analyze
    const bestPlaces = places
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4); 
    
    console.log(`⚡ Scraping top ${bestPlaces.length} places...`);
    
    const enrichedPlaces = await Promise.all(
      bestPlaces.map((place) => scrapeReviews(place))
    );

    // --- STEP 3: ANALYZE (The Judge) ---
    console.log("🤖 Running AI Analysis...");
    const finalVerdict = await analyzePlaces(enrichedPlaces, query);

    // --- STEP 4: RETURN ---
    return NextResponse.json({ 
      status: "success", 
      data: finalVerdict.recommendations || enrichedPlaces, 
      context: {
        isFallback,
        message: fallbackMessage || null,
        original_query: query,
        interpreted_intent: optimizedQuery,
        analysis_meta: finalVerdict.meta || {}
      }
    });

  } catch (error) {
    console.error("🔥 Critical Server Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}