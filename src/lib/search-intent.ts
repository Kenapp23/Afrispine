/**
 * Search Intent Parser — conversational query understanding for AfriSpine.
 *
 * Uses the z-ai-web-dev-sdk chat completions API to turn a casual
 * user query (e.g. "funny Kenyan skits under 5 min") into structured
 * filters + a semantic query + topic weights for vector search.
 *
 * SERVER-SIDE ONLY — z-ai-web-dev-sdk must never be imported on the client.
 */

import ZAI from 'z-ai-web-dev-sdk';
import { TOPIC_DIMENSIONS, topicWeightsToVector } from './embedding';

// ─── Types ──────────────────────────────────────────────────

export interface SearchIntent {
  /** The original user query, untouched. */
  rawQuery: string;

  /** Parsed content category, if the query implies one. */
  category?:
    | 'film'
    | 'music'
    | 'comedy'
    | 'fashion'
    | 'sports'
    | 'education'
    | 'spirituality'
    | 'food'
    | 'beauty';

  /** Maximum video duration in seconds, if the query implies a length limit. */
  maxDuration?: number;

  /** Mood detected from the query. */
  mood?:
    | 'funny'
    | 'dramatic'
    | 'chill'
    | 'inspirational'
    | 'romantic'
    | 'educational'
    | 'energetic'
    | 'spiritual';

  /** Whether the user wants only free content. */
  isFreeOnly?: boolean;

  /** Query rewritten for better text search (expanded, keyword-optimized). */
  semanticQuery: string;

  /** Topic weights in the same dimension space as video embeddings. */
  topicWeights: Record<string, number>;
}

// ─── In-memory cache with 5-min TTL ─────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const INTENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const intentCache = new Map<string, CacheEntry<SearchIntent>>();

// ─── System prompt ───────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are a search query analyser for AfriSpine — an African video content marketplace focused on Kenyan and broader African creators. Content is paid (M-Pesa) but some is free (house/demo content).

Given a user's search query, output a SINGLE JSON object with these fields:

1. "category" — one of: film, music, comedy, fashion, sports, education, spirituality, food, beauty, or null if unclear.
2. "maxDuration" — max video length in SECONDS (integer), or null. Example: "under 5 min" → 300, "short" → 180, "long documentary" → null (no cap).
3. "mood" — one of: funny, dramatic, chill, inspirational, romantic, educational, energetic, spiritual, or null.
4. "isFreeOnly" — true if the user explicitly asks for free content ("free", "no pay", "without paying", "gratis"); false otherwise.
5. "semanticQuery" — a rewritten search query optimised for text matching. Expand abbreviations, add synonyms relevant to African content. E.g. "funny clips" → "funny comedy skits laughs African humor". Keep it under 60 words.
6. "topicWeights" — a JSON object with exactly these keys and float values 0.0–1.0: ${JSON.stringify(TOPIC_DIMENSIONS)}. Distribute weight based on what the query implies the user wants to watch.

Context clues you should understand:
- "Kenyan", "Nairobi", "Kenyatta" → african_culture + urban_life
- "M-Pesa", "paybill" → these are payment terms, not content topics — ignore for topic weights
- "gengetone", "kapuka", "bongo" → music + african_culture + youth_culture
- "skit", "comedian" → comedy + youth_culture
- "sermon", "church", "gospel" → spirituality + inspirational
- "nyama choma", "ugali", "sukuma wiki" → food + african_culture
- "masai", "maasai", "shangaan" → african_culture + traditional
- "Amapiano", "Afrobeats" → music + dance + youth_culture
- "Nollywood" → film + african_culture + dramatic
- "natural hair", "afro", "braids" → beauty + african_culture

Rules:
- Respond with ONLY valid JSON, no markdown, no explanation.
- Use null (not "null") for unset optional fields.
- All numeric values must be valid JSON numbers.`;

// ─── Main export ─────────────────────────────────────────────

/**
 * Parse a user's search query into a structured SearchIntent.
 *
 * @param query - The raw user search string
 * @returns SearchIntent with category, mood, duration, semanticQuery, and topicWeights
 */
export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { rawQuery: query, semanticQuery: '', topicWeights: {} };
  }

  // Check cache
  const cached = intentCache.get(trimmed);
  if (cached) {
    if (Date.now() <= cached.expiresAt) return cached.value;
    intentCache.delete(trimmed);
  }

  try {
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT },
        { role: 'user', content: trimmed },
      ],
      thinking: { type: 'disabled' },
    });

    let raw = response?.choices?.[0]?.message?.content ?? '';
    raw = raw.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const parsed = JSON.parse(raw);

    // Build and validate the intent
    const intent: SearchIntent = {
      rawQuery: trimmed,
      category: validateCategory(parsed.category),
      maxDuration: validateMaxDuration(parsed.maxDuration),
      mood: validateMood(parsed.mood),
      isFreeOnly: typeof parsed.isFreeOnly === 'boolean' ? parsed.isFreeOnly : undefined,
      semanticQuery: typeof parsed.semanticQuery === 'string' ? parsed.semanticQuery : trimmed,
      topicWeights: extractTopicWeights(parsed.topicWeights),
    };

    // Cache the result
    intentCache.set(trimmed, { value: intent, expiresAt: Date.now() + INTENT_CACHE_TTL_MS });

    return intent;
  } catch (err) {
    console.error('[search-intent] Failed to parse intent:', err);
    return {
      rawQuery: trimmed,
      semanticQuery: trimmed,
      topicWeights: {},
    };
  }
}

// ─── Validators ──────────────────────────────────────────────

const VALID_CATEGORIES = [
  'film', 'music', 'comedy', 'fashion', 'sports',
  'education', 'spirituality', 'food', 'beauty',
] as const;

function validateCategory(val: unknown): SearchIntent['category'] {
  if (typeof val === 'string' && (VALID_CATEGORIES as readonly string[]).includes(val)) {
    return val as SearchIntent['category'];
  }
  return undefined;
}

const VALID_MOODS = [
  'funny', 'dramatic', 'chill', 'inspirational',
  'romantic', 'educational', 'energetic', 'spiritual',
] as const;

function validateMood(val: unknown): SearchIntent['mood'] {
  if (typeof val === 'string' && (VALID_MOODS as readonly string[]).includes(val)) {
    return val as SearchIntent['mood'];
  }
  return undefined;
}

function validateMaxDuration(val: unknown): number | undefined {
  if (typeof val === 'number' && val > 0) {
    // Cap at 2 hours (7200s) — anything larger is probably a mistake
    return Math.min(val, 7200);
  }
  // Some LLMs return duration as a string like "300" or "5 min"
  if (typeof val === 'string') {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) return Math.min(num, 7200);
  }
  return undefined;
}

function extractTopicWeights(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const weights: Record<string, number> = {};
  for (const dim of TOPIC_DIMENSIONS) {
    const val = Number((raw as Record<string, unknown>)[dim]);
    weights[dim] = isNaN(val) ? 0 : Math.max(0, Math.min(1, val));
  }
  return weights;
}

/**
 * Convenience: convert a SearchIntent's topicWeights to a vector
 * that can be compared with video embeddings via cosineSimilarity.
 */
export function intentToVector(intent: SearchIntent): number[] {
  return topicWeightsToVector(intent.topicWeights);
}
