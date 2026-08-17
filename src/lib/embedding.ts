/**
 * Embedding Generator — LLM-based topic fingerprints for AfriSpine videos.
 *
 * Uses the z-ai-web-dev-sdk chat completions API to produce a structured
 * JSON object of ~25 topic weights (0.0–1.0) that act as a semantic
 * fingerprint for each video.  The JSON string is stored in the
 * `embeddingVector` column on the Video model and later compared
 * using cosine similarity for recommendations and search.
 *
 * SERVER-SIDE ONLY — z-ai-web-dev-sdk must never be imported on the client.
 */

import ZAI from 'z-ai-web-dev-sdk';

// ─── Topic dimensions ────────────────────────────────────────
// These define the fixed vector space shared across all videos
// and search queries.  Order matters — the same order is used
// when generating embeddings and when parsing search intents.

export const TOPIC_DIMENSIONS = [
  'african_culture',
  'urban_life',
  'music',
  'fashion',
  'film',
  'comedy',
  'food',
  'sports',
  'education',
  'spirituality',
  'beauty',
  'nature',
  'nightlife',
  'art',
  'dance',
  'technology',
  'business',
  'lifestyle',
  'youth_culture',
  'traditional',
  'modern',
  'romantic',
  'inspirational',
  'documentary',
  'entertainment',
] as const;

export type TopicDimension = (typeof TOPIC_DIMENSIONS)[number];

// ─── In-memory cache with TTL ────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const EMBEDDING_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const embeddingCache = new Map<string, CacheEntry<string>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── System prompt for embedding generation ──────────────────

const EMBEDDING_SYSTEM_PROMPT = `You are a content-analysis engine for AfriSpine, an African video content marketplace. Your job is to read a video's title, description, and category, then produce a JSON object of topic weights.

The JSON object must have exactly these ${TOPIC_DIMENSIONS.length} keys with float values between 0.0 and 1.0:
${JSON.stringify(TOPIC_DIMENSIONS)}

Rules:
1. Every key MUST appear in the output. Use 0.0 for topics that are not relevant.
2. The category field is a strong signal — e.g. a "music" video should have a high "music" weight.
3. Weights should reflect the *primary* thematic content, not peripheral mentions. A cooking show might score 0.1 on "entertainment" but 0.9 on "food".
4. African cultural context matters: a Kenyan comedy skit should score high on "comedy", "youth_culture", and "african_culture".
5. Respond with ONLY the JSON object, no markdown fences, no explanation.
6. All values must be valid JSON numbers.`;

// ─── Main export: generate a topic-fingerprint embedding ─────

/**
 * Generate a semantic topic fingerprint for a video.
 *
 * @param title    - Video title
 * @param description - Video description (may be empty)
 * @param category - Video category (e.g. 'music', 'comedy', 'film')
 * @returns JSON string of { topic: weight } map, suitable for storing in `embeddingVector`
 */
export async function generateVideoEmbedding(
  title: string,
  description: string,
  category: string,
): Promise<string> {
  // Build a cache key from the content that determines the embedding
  const cacheKey = `${title}||${description}||${category}`;
  const cached = getCached(embeddingCache, cacheKey);
  if (cached) return cached;

  try {
    const zai = await ZAI.create();
    const userMessage = `Analyze this video and produce topic weights:\n\nTitle: ${title}\nDescription: ${description || '(no description)'}\nCategory: ${category}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: EMBEDDING_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    });

    // The response may be wrapped in markdown code fences; strip them.
    let raw = response?.choices?.[0]?.message?.content ?? '';
    raw = raw.trim();
    if (raw.startsWith('```')) {
      // Remove opening fence (with optional lang tag) and closing fence
      raw = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Validate that it parses as JSON and contains numbers
    const parsed = JSON.parse(raw);
    const weights: Record<string, number> = {};
    for (const dim of TOPIC_DIMENSIONS) {
      const val = Number(parsed[dim]);
      weights[dim] = isNaN(val) ? 0 : Math.max(0, Math.min(1, val));
    }

    const result = JSON.stringify(weights);
    setCache(embeddingCache, cacheKey, result, EMBEDDING_CACHE_TTL_MS);
    return result;
  } catch (err) {
    console.error('[embedding] Failed to generate embedding:', err);
    // Return a zero-vector JSON so the caller can still store something
    const fallback: Record<string, number> = {};
    for (const dim of TOPIC_DIMENSIONS) fallback[dim] = 0;
    return JSON.stringify(fallback);
  }
}

// ─── Vector utilities ────────────────────────────────────────

/**
 * Parse a stored JSON embedding string back into a number array.
 * The array is ordered to match TOPIC_DIMENSIONS.
 * Returns an empty array on any failure.
 */
export function parseEmbedding(jsonStr: string | null | undefined): number[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return [];
    }
    // Extract values in the canonical dimension order
    const vec: number[] = [];
    for (const dim of TOPIC_DIMENSIONS) {
      const val = Number(parsed[dim]);
      vec.push(isNaN(val) ? 0 : val);
    }
    return vec;
  } catch {
    return [];
  }
}

/**
 * Compute the cosine similarity between two vectors of equal length.
 * Returns 0 if either vector is empty or has zero magnitude.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Build a topic-weight vector from a Record (e.g. from search intent).
 * Orders values to match TOPIC_DIMENSIONS so it can be compared via cosineSimilarity.
 */
export function topicWeightsToVector(weights: Record<string, number>): number[] {
  return TOPIC_DIMENSIONS.map(dim => {
    const val = Number(weights[dim]);
    return isNaN(val) ? 0 : val;
  });
}
