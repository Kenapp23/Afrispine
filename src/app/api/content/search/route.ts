/**
 * Content Search — Hybrid video search with relevance ranking
 *
 * POST handler that searches videos by title, description, and category.
 * V2: Hybrid search with keyword + fuzzy matching and relevance scoring.
 *
 * Scoring weights:
 *   - Title exact match:    3x
 *   - Category exact match: 2x
 *   - Description match:    1x
 *   - Engagement bonus:     viewCount*0.01 + likeCount*0.05 + shareCount*0.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

/**
 * Generate all substrings of length >= 3 from a query string.
 * Used for trigram-like fuzzy matching on SQLite.
 */
function generateTrigrams(query: string): string[] {
  const q = query.toLowerCase();
  const ngrams: string[] = [];
  for (let len = 3; len <= q.length; len++) {
    for (let i = 0; i <= q.length - len; i++) {
      ngrams.push(q.slice(i, i + len));
    }
  }
  return ngrams;
}

/**
 * Check if ANY trigram from the query appears in the target string.
 * Returns true if there is at least one 3+ char substring match.
 */
function hasTrigramMatch(trigrams: string[], target: string): boolean {
  const t = target.toLowerCase();
  for (const ngram of trigrams) {
    if (t.includes(ngram)) return true;
  }
  return false;
}

interface ScoredVideo {
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
  creator: {
    stageName: string;
    handle: string;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
  };
  _relevanceScore: number;
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
    const queryLower = trimmed.toLowerCase();
    const trigrams = generateTrigrams(trimmed);

    // --- Step 1: Keyword matching via Prisma contains (case-insensitive) ---
    // Fetch candidates that match at least one keyword field.
    // We use a generous take to allow for post-query fuzzy filtering and scoring.
    const candidates = await db.video.findMany({
      where: {
        status: 'live',
        OR: [
          { title: { contains: trimmed } },
          { description: { contains: trimmed } },
          { category: { contains: trimmed } },
        ],
      },
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
      take: 200, // generous limit — we filter & score in-memory
    });

    // --- Step 2: Fuzzy matching — include results via trigram substrings ---
    // For queries with 3+ chars, also pull videos where any trigram
    // substring appears in title, description, or category.
    // Only fetch IDs we don't already have from keyword matching.
    let fuzzyCandidates: typeof candidates = [];

    if (trigrams.length > 0 && candidates.length < 200) {
      const existingIds = new Set(candidates.map((v) => v.id));

      // We can't do pure trigram matching in a single Prisma query,
      // so we fetch all live videos (up to a cap) and filter in-memory.
      // This is practical for SQLite with typical content library sizes.
      const allLive = await db.video.findMany({
        where: {
          status: 'live',
          id: { notIn: Array.from(existingIds) },
        },
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
        take: 300,
      });

      fuzzyCandidates = allLive.filter((video) => {
        const titleMatch = hasTrigramMatch(trigrams, video.title);
        const descMatch = video.description
          ? hasTrigramMatch(trigrams, video.description)
          : false;
        const catMatch = hasTrigramMatch(trigrams, video.category);
        return titleMatch || descMatch || catMatch;
      });
    }

    // --- Step 3: Merge candidates and score ---
    const allCandidates = [...candidates, ...fuzzyCandidates];

    // Deduplicate by ID (keyword matches take priority)
    const seen = new Set<string>();
    const uniqueCandidates: typeof candidates = [];
    for (const v of allCandidates) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        uniqueCandidates.push(v);
      }
    }

    const scored: ScoredVideo[] = uniqueCandidates.map((video) => {
      const titleLower = video.title.toLowerCase();
      const descLower = (video.description ?? '').toLowerCase();
      const catLower = video.category.toLowerCase();

      // --- Text relevance scoring ---
      // Exact substring match (case-insensitive) with weighted multipliers
      const titleMatch = titleLower.includes(queryLower);
      const descMatch = descLower.includes(queryLower);
      const catMatch = catLower.includes(queryLower);

      let textScore = 0;
      if (titleMatch) textScore += 3;
      if (catMatch) textScore += 2;
      if (descMatch) textScore += 1;

      // If no exact match, check trigram overlap count for partial credit
      if (textScore === 0 && trigrams.length > 0) {
        const titleNgramHits = trigrams.filter((n) => titleLower.includes(n)).length;
        const descNgramHits = trigrams.filter((n) => descLower.includes(n)).length;
        const catNgramHits = trigrams.filter((n) => catLower.includes(n)).length;

        // Award partial score proportional to trigram hit ratio (capped at ~1.5)
        const hitRatio = (titleNgramHits * 3 + descNgramHits * 1 + catNgramHits * 2) / trigrams.length;
        textScore = Math.min(hitRatio, 1.5);
      }

      // --- Engagement bonus ---
      // Rewards popular/quality content to surface relevant but also good videos
      const engagementBonus =
        video.viewCount * 0.01 +
        video.likeCount * 0.05 +
        video.shareCount * 0.1;

      const totalScore = textScore + engagementBonus;

      return {
        ...video,
        _relevanceScore: Math.round(totalScore * 100) / 100,
      };
    });

    // --- Step 4: Sort by relevance score descending, take top 30 ---
    scored.sort((a, b) => b._relevanceScore - a._relevanceScore);
    const topResults = scored.slice(0, 30);

    // Strip the internal scoring field before sending to client
    const results = topResults.map(({ _relevanceScore: _, ...rest }) => rest);

    return NextResponse.json(results);
  } catch (err) {
    console.error('[content/search] Error:', err);
    return NextResponse.json([]);
  }
}
