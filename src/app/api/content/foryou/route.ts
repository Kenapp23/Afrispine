/**
 * Content For You — V3: Five-dimension weighted scoring
 *
 * Dimensions:
 *   1. Recency score    (0-25 pts): decays linearly over 7 days
 *   2. Engagement score  (0-35 pts): normalized likes + engagement ratio
 *   3. Social proof     (0-15 pts): creator followers + video shares
 *   4. Follow affinity   (0-15 pts): follow status + watch history
 *   5. Semantic match    (0-10 pts): cosine similarity to user's taste profile
 *
 * Accepts optional ?userId= for personalization, ?category= for filtering.
 * When userId is provided and they have watch/like history, their aggregate
 * topic fingerprint is compared against each video's embedding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { parseEmbedding, cosineSimilarity } from '@/lib/embedding';

const SEVEN_DAYS_HOURS = 168;

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  ticketPriceKes: number;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  demoVideoUrl: string | null;
  cfPreviewStreamId: string | null;
  cfPremiumStreamId: string | null;
  isHouseContent: boolean;
  embeddingVector: string | null;
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
  _compositeScore: number;
}

/**
 * Build a user's taste fingerprint by averaging embeddings of their
 * recently-liked and recently-watched videos. Returns a number[]
 * in the canonical topic-dimension order, or null if insufficient data.
 */
async function buildUserTasteProfile(userId: string): Promise<number[] | null> {
  try {
    // Get videos the user has liked
    const likedVideos = await db.like.findMany({
      where: { userId },
      select: {
        video: { select: { embeddingVector: true } },
      },
      take: 20,
    });

    // Get videos the user has watched
    const watchedVideos = await db.watchEvent.findMany({
      where: { userId },
      select: {
        video: { select: { embeddingVector: true } },
      },
      distinct: ['videoId'],
      take: 20,
    });

    // Collect all non-null embeddings
    const allEmbeddings: number[][] = [];
    for (const lv of likedVideos) {
      if (lv.video?.embeddingVector) {
        const vec = parseEmbedding(lv.video.embeddingVector);
        if (vec.length > 0) allEmbeddings.push(vec);
      }
    }
    for (const wv of watchedVideos) {
      if (wv.video?.embeddingVector) {
        const vec = parseEmbedding(wv.video.embeddingVector);
        if (vec.length > 0 && !allEmbeddings.some(e => e === vec)) {
          allEmbeddings.push(vec);
        }
      }
    }

    if (allEmbeddings.length === 0) return null;

    // Average all embeddings to create taste profile
    const dim = allEmbeddings[0].length;
    const avg = new Array(dim).fill(0);
    for (const vec of allEmbeddings) {
      for (let i = 0; i < dim && i < vec.length; i++) {
        avg[i] += vec[i];
      }
    }
    for (let i = 0; i < dim; i++) avg[i] /= allEmbeddings.length;

    return avg;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    // --- Step 1: Fetch all live videos (with category filter) ---
    const where: Record<string, unknown> = { status: 'live' };
    if (category) {
      where.category = category;
    }

    const videos = await db.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        ticketPriceKes: true,
        thumbnailUrl: true,
        durationSeconds: true,
        demoVideoUrl: true,
        cfPreviewStreamId: true,
        cfPremiumStreamId: true,
        isHouseContent: true,
        embeddingVector: true,
        releaseMode: true,
        premiereAt: true,
        premiereWindowEnds: true,
        backstageVideoId: true,
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
      // No orderBy — we sort in-memory by composite score
      take: 500,
    });

    if (videos.length === 0) {
      return NextResponse.json([]);
    }

    // --- Step 2: Pre-compute global max likeCount for normalization ---
    const maxLikes = Math.max(...videos.map((v) => v.likeCount), 1);

    // --- Step 3: Fetch user affinity data if userId is provided ---
    let followedCreatorIds = new Set<string>();
    let watchedCreatorIds = new Set<string>();
    let userTaste: number[] | null = null;

    if (userId) {
      // Check which creators this user follows
      try {
        const follows = await db.follow.findMany({
          where: { followerId: userId },
          select: { creatorId: true },
        });
        followedCreatorIds = new Set(follows.map((f) => f.creatorId));
      } catch {
        // Silently ignore — affinity scoring will just be 0
      }

      // Check which creators this user has watched before
      try {
        const watchEvents = await db.watchEvent.findMany({
          where: { userId },
          select: {
            video: {
              select: { creatorId: true },
            },
          },
          distinct: ['videoId'],
        });
        watchedCreatorIds = new Set(
          watchEvents
            .map((w) => w.video?.creatorId)
            .filter((id): id is string => typeof id === 'string')
        );
      } catch {
        // Silently ignore
      }

      // Build semantic taste profile from user's watch/like history
      userTaste = await buildUserTasteProfile(userId);
    }

    // --- Step 4: Score each video ---
    const now = Date.now();

    const scored: VideoRow[] = videos.map((video) => {
      let score = 0;

      // ── 1. Recency score (0-25 pts) ──
      const ageInHours = (now - video.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 25 * (1 - ageInHours / SEVEN_DAYS_HOURS));
      score += recencyScore;

      // ── 2. Engagement score (0-35 pts) ──
      // Part A (0-25 pts): normalized like count
      const normalizedLikes = video.likeCount / maxLikes;
      score += 25 * normalizedLikes;

      // Part B (0-10 pts): engagement ratio (likes / views)
      if (video.viewCount > 0) {
        const engagementRatio = video.likeCount / video.viewCount;
        score += 10 * Math.min(engagementRatio, 1);
      }

      // ── 3. Social proof score (0-15 pts) ──
      const followerPortion = 8 * Math.min(video.creator.followerCount / 100_000, 1);
      const sharePortion = 7 * Math.min(video.shareCount / 100, 1);
      score += followerPortion + sharePortion;

      // ── 4. Follow affinity (0-15 pts) — only if userId provided ──
      if (userId) {
        if (followedCreatorIds.has(video.creatorId)) {
          score += 10;
        }
        if (watchedCreatorIds.has(video.creatorId)) {
          score += 5;
        }
      }

      // ── 5. Semantic match (0-10 pts) — only if user has taste profile ──
      if (userTaste && video.embeddingVector) {
        const videoVec = parseEmbedding(video.embeddingVector);
        if (videoVec.length > 0) {
          const sim = cosineSimilarity(userTaste, videoVec);
          score += 10 * sim;
        }
      }

      return {
        ...video,
        _compositeScore: Math.round(score * 100) / 100,
      };
    });

    // --- Step 5: Sort by composite score descending, take top 20 ---
    scored.sort((a, b) => b._compositeScore - a._compositeScore);
    const topResults = scored.slice(0, 20);

    // Strip internal scoring field before sending to client
    const results = topResults.map(({ _compositeScore: _, ...rest }) => rest);

    return NextResponse.json(results);
  } catch (err) {
    console.error('[content/foryou] Error:', err);
    return NextResponse.json([]);
  }
}
