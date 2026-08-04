import { NextRequest, NextResponse } from 'next/server';

/*
 * Server-side brand logo proxy.
 * Tries: 1. Clearbit (high quality) → 2. Google favicon → 3. Direct /favicon.ico
 * Returns the best available image with caching.
 */

const CLEARBIT_BASE = 'https://logo.clearbit.com/';
const GOOGLE_FAVICON_BASE = 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://';

// Cache logos in memory to avoid repeated fetches
const logoCache = new Map<string, { buffer: Buffer; contentType: string; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchImage(url: string, timeoutMs = 5000, allowTiny = false): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AfriSpine/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    // Reject Google's generic globe fallback (always 726 bytes, 16x16)
    if (url.includes('gstatic.com') && buf.length < 1024) return null;
    return { buffer: buf, contentType: ct };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
  }

  // Check cache
  const cached = logoCache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Logo-Cache': 'HIT',
      },
    });
  }

  let source = 'none';
  let result: { buffer: Buffer; contentType: string } | null = null;

  // 1. Try Clearbit (best quality)
  result = await fetchImage(CLEARBIT_BASE + domain);
  if (result) source = 'clearbit';

  // 2. Try Google favicon
  if (!result) {
    result = await fetchImage(GOOGLE_FAVICON_BASE + encodeURIComponent(domain) + '&size=128');
    if (result) source = 'google';
  }

  // 3. Try direct /favicon.ico from the brand's website
  if (!result) {
    result = await fetchImage('https://' + domain + '/favicon.ico', 8000);
    if (result) source = 'direct';
  }

  if (!result) {
    return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
  }

  // Store in cache
  logoCache.set(domain, { ...result, fetchedAt: Date.now() });

  return new NextResponse(result.buffer, {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Logo-Source': source,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
