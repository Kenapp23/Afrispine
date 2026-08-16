/**
 * Content Search V3 — AI-powered hybrid search
 *
 * Three-layer search:
 *   Layer 1: LLM intent parsing → structured filters (category, mood, maxDuration, freeOnly)
 *   Layer 2: Semantic similarity via LLM topic fingerprints + cosine similarity
 *   Layer 3: FTS5 full-text search as keyword fallback (replaces hand-rolled trigram)
 *
 * Results are merged and ranked by blended score:
 *   - Semantic similarity: 0-40 pts
 *   - Text relevance (FTS rank): 0-30 pts
 *   - Engagement bonus: 0-30 pts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { parseSearchIntent, type SearchIntent } from '@/lib/search-intent';
import { parseEmbedding, cosineSimilarity, topicWeightsToVector } from '@/lib/embedding';
import { ensureFtsTable } from '@/lib/fts-setup';

const VALID_CATEGORIES = ['film', 'music', 'comedy', 'fashion', 'sports', 'education', 'spirituality', 'food', 'beauty'];

interface VideoCandidate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  ticketPriceKes: number;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  status: string;
  createdAt: Date;
  creatorId: string;
  embeddingVector: string | null;
  creator: {
    stageName: string;
    handle: string;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
  };
  _searchScore: number;
}

// FTS5 rank is negative (higher = better match). Normalize to 0-1.
function normalizeFtsRank(rank: number): number {
  if (rank >= 0) return 0; // no match
  // FTS5 bm25 is negative; map -20..0 → 1..0
  return Math.min(1, Math.max(0, 1 + rank / 20));
}

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json([]);
    }

    const body = await req.json();
    const { query } = body as { query?: string };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const trimmed = query.trim();

    // ── Step 1: LLM intent parsing ──
    // Parse natural language into structured filters + semantic query + topic weights
    let intent: SearchIntent;
    try {
      intent = await parseSearchIntent(trimmed);
    } catch {
      intent = {
        rawQuery: trimmed,
        semanticQuery: trimmed,
        topicWeights: {},
      };
    }

    // Build Prisma where clause from intent filters
    const whereClause: Record<string, unknown> = { status: 'live' };
    const andConditions: Record<string, unknown>[] = [];

    if (intent.category && VALID_CATEGORIES.includes(intent.category)) {
      andConditions.push({ category: intent.category });
    }
    if (intent.maxDuration !== undefined && intent.maxDuration > 0) {
      andConditions.push({
        OR: [
          { durationSeconds: null }, // null duration = unknown, include it
          { durationSeconds: { lte: intent.maxDuration } },
        ],
      });
    }
    if (intent.isFreeOnly) {
      andConditions.push({ ticketPriceKes: 0 });
    }
    if (andConditions.length > 0) {
      (whereClause as Record<string, unknown>).AND = andConditions;
    }

    // ── Step 2: Ensure FTS table exists (SQLite only, no-op on Postgres) ──
    await ensureFtsTable();

    // ── Step 3: Fetch candidates ──
    // Get all live videos matching intent filters (generous take)
    const candidates = await db.video.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        ticketPriceKes: true,
        thumbnailUrl: true,
        durationSeconds: true,
        viewCount: true,
        likeCount: true,
        shareCount: true,
        status: true,
        createdAt: true,
        creatorId: true,
        embeddingVector: true,
        creator: {
          select: {
            stageName: true,
            handle: true,
            avatarUrl: true,
            verified: true,
            followerCount: true,
          },
        },
      },
      take: 200,
    });

    if (candidates.length === 0) {
      return NextResponse.json([]);
    }

    // ── Step 3: FTS5 keyword search ──
    // Use SQLite FTS5 for full-text search. If the fts table doesn't exist
    // (first run before migration), fall back to Prisma contains.
    const semanticQuery = intent.semanticQuery || trimmed;
    let ftsScores: Map<string, number> = new Map();

    try {
      const ftsResults = await db.$queryRawUnsafe<
        Array<{ video_id: string; rank: number }>
      >(
        `SELECT video_id, rank FROM video_fts WHERE video_fts MATCH ? ORDER BY rank LIMIT 200`,
        semanticQuery,
      );
      for (const r of ftsResults) {
        ftsScores.set(r.video_id, r.rank);
      }
    } catch {
      // FTS5 table doesn't exist yet — fallback to Prisma contains
      // This only runs on first deploy before migration
      const queryLower = trimmed.toLowerCase();
      for (const v of candidates) {
        const titleMatch = v.title.toLowerCase().includes(queryLower) ? 1 : 0;
        const descMatch = v.description?.toLowerCase().includes(queryLower) ? 0.5 : 0;
        const catMatch = v.category.toLowerCase().includes(queryLower) ? 0.8 : 0;
        const score = titleMatch + descMatch + catMatch;
        if (score > 0) ftsScores.set(v.id, -score * 5); // negative to match FTS convention
      }
    }

    // ── Step 4: Semantic similarity scoring ──
    const queryVector = topicWeightsToVector(intent.topicWeights);
    const hasQueryVector = queryVector.some((w) => w > 0);

    // ── Step 5: Score and rank ──
    const scored: VideoCandidate[] = candidates.map((video) => {
      let score = 0;

      // Layer 1: Semantic similarity (0-40 pts)
      if (hasQueryVector && video.embeddingVector) {
        const videoVector = parseEmbedding(video.embeddingVector);
        if (videoVector.length > 0) {
          const sim = cosineSimilarity(queryVector, videoVector);
          score += 40 * sim; // max 40 pts for perfect semantic match
        }
      }

      // Layer 2: FTS text relevance (0-30 pts)
      const ftsRank = ftsScores.get(video.id);
      if (ftsRank !== undefined) {
        score += 30 * normalizeFtsRank(ftsRank);
      }

      // Layer 3: Engagement bonus (0-30 pts)
      const engagementBonus =
        Math.min(video.viewCount * 0.005, 10) +
        Math.min(video.likeCount * 0.02, 10) +
        Math.min(video.shareCount * 0.1, 10);
      score += engagementBonus;

      return {
        ...video,
        _searchScore: Math.round(score * 100) / 100,
      };
    });

    // Sort by blended score descending
    scored.sort((a, b) => b._searchScore - a._searchScore);

    // Filter out zero-score results (no semantic, no text, no engagement match)
    const results = scored
      .filter((v) => v._searchScore > 0)
      .slice(0, 30)
      .map(({ _searchScore: _, embeddingVector: __, ...rest }) => rest);

    return NextResponse.json(results);
  } catch (err) {
    console.error('[content/search] Error:', err);
    return NextResponse.json([]);
  }
}
