// app/lib/jina.ts

// 1. Modern URL Normalizer (Fixes the [DEP0169] warning)
function normalizeUrl(urlStr: string) {
  if (!urlStr) return "";
  try {
      // Ensure protocol exists so the URL constructor works
      const withProtocol = /^https?:\/\//i.test(urlStr) ? urlStr : `http://${urlStr}`;
      const urlObj = new URL(withProtocol);
      return urlObj.toString();
  } catch (e) {
      // If URL is invalid, return empty string so we skip scraping
      return "";
  }
}

export async function scrapeWebsite(url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";

  // 2. Construct Jina Reader URL
  const jinaUrl = `https://r.jina.ai/${normalized}`;

  try {
      const res = await fetch(jinaUrl, { 
          cache: "no-store", // Never cache; we want fresh reviews
          headers: {
              "X-Respond-With": "markdown", // Critical: Ask for Markdown, not HTML
              "User-Agent": "FoodieEyes-Agent/1.0"
          }
      });
      
      if (!res.ok) {
          console.error(`Jina scrape failed: ${res.status} ${res.statusText}`);
          return "";
      }
      
      const text = await res.text();
      
      // 3. Return a large chunk (Matches your route.ts limit)
      // Google Maps pages are heavy; we need at least 25k chars to reach the reviews section
      return text.slice(0, 25000); 

  } catch (error) {
      console.error("Jina Network Error:", error);
      return "";
  }
}