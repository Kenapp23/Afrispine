const OPENVERSE_BASE = 'https://api.openverse.org/v1/images/';

export function buildImageQuery(
  countryFocus?: string,
  relatedTicker?: string,
  exchangeFocus?: string,
  title?: string
): string[] {
  const queries: string[] = [];
  if (title) queries.push(title);
  if (relatedTicker) queries.push(`${relatedTicker} company Africa`);
  if (countryFocus && exchangeFocus) {
    queries.push(`${countryFocus} stock exchange ${exchangeFocus}`);
    queries.push(`${countryFocus} finance business`);
  }
  if (countryFocus) {
    queries.push(`${countryFocus} economy`);
    queries.push(`${countryFocus} business landscape`);
  }
  queries.push('African finance stock market');
  return [...new Set(queries)];
}

export async function searchOpenverseImages(
  query: string,
  page: number = 1
): Promise<{ url: string; title: string; creator: string; thumbnail: string }[]> {
  const params = new URLSearchParams({
    q: query,
    license_type: 'commercial',
    page_size: '10',
    page: String(page),
  });
  const response = await fetch(`${OPENVERSE_BASE}?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.results || []).map((img: Record<string, string>) => ({
    url: img.url || img.thumbnail || '',
    title: img.title || '',
    creator: img.creator || '',
    thumbnail: img.thumbnail || img.url || '',
  }));
}

export async function fetchImageForStory(
  countryFocus?: string,
  relatedTicker?: string,
  exchangeFocus?: string,
  title?: string
): Promise<{ url: string; title: string; creator: string } | null> {
  const queries = buildImageQuery(countryFocus, relatedTicker, exchangeFocus, title);
  for (const q of queries) {
    const results = await searchOpenverseImages(q);
    if (results.length > 0) {
      return { url: results[0].url, title: results[0].title, creator: results[0].creator };
    }
  }
  return null;
}