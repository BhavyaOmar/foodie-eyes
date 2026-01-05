type RawPlace = {
	title: string;
	address?: string;
	phoneNumber?: string;
	rating?: number;
	website?: string;
	thumbnailUrl?: string;
	categories?: string[];
};

type SearchResult = {
	title: string;
	address?: string;
	rating?: number;
	website?: string;
	phone?: string;
	thumbnail?: string;
	categories?: string[];
};

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function searchPlaces(query: string, location: string): Promise<SearchResult[]> {
	if (!SERPER_API_KEY) {
		console.warn("Missing SERPER_API_KEY");
		return [];
	}

	const payload = {
		q: `${query} near ${location}`.trim(),
		num: 8,
        gl:"in",
	};

	const res = await fetch("https://google.serper.dev/places", {
		method: "POST",
		headers: {
			"X-API-KEY": SERPER_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		cache: "no-store",
	});

	if (!res.ok) {
		console.error("Serper failed", res.status, res.statusText);
		return [];
	}

	const data = await res.json();
	const places: RawPlace[] = data?.places ?? [];

	return places.map((place) => ({
		title: place.title,
		address: place.address,
		rating: place.rating,
		website: place.website,
		phone: place.phoneNumber,
		thumbnail: place.thumbnailUrl,
		categories: place.categories,
	}));
}
