function normalizeUrl(url: string) {
	if (!url) return "";
	if (/^https?:\/\//i.test(url)) return url;
	return `http://${url}`;
}

export async function scrapeWebsite(url: string): Promise<string> {
	const normalized = normalizeUrl(url);
	if (!normalized) return "";

	const jinaUrl = `https://r.jina.ai/${normalized}`;

	try {
		const res = await fetch(jinaUrl, { cache: "no-store" });
		if (!res.ok) {
			console.error("Jina fetch failed", res.status, res.statusText);
			return "";
		}
		const text = await res.text();
		return text.slice(0, 4000);
	} catch (error) {
		console.error("Jina scrape error", error);
		return "";
	}
}
