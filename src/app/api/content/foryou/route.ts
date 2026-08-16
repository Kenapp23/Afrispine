/**
 * Content For You — Weighted scoring recommendation feed
 *
 * V2: Composite scoring algorithm with four dimensions:
 *   - Recency score  (0-30 pts): decays linearly over 7 days
 *   - Engagement score (0-45 pts): normalized likes + engagement ratio
 *   - Social proof    (0-20 pts): creator followers + video shares
 *   - Follow affinity (0-30 pts): follow status + watch history
 *
 * Accepts optional ?userId= for personalization and ?category= for filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

const SEVEN_DAYS_HOURS = 168;

interface VideoRow {
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
  _compositeScore: number;
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
    }

    // --- Step 4: Score each video ---
    const now = Date.now();

    const scored: VideoRow[] = videos.map((video) => {
      let score = 0;

      // ── Recency score (0-30 pts) ──
      // Linear decay: newer videos score higher
      const ageInHours = (now - video.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 30 * (1 - ageInHours / SEVEN_DAYS_HOURS));
      score += recencyScore;

      // ── Engagement score (0-45 pts) ──
      // Part A (0-30 pts): normalized like count
      const normalizedLikes = video.likeCount / maxLikes;
      score += 30 * normalizedLikes;

      // Part B (0-15 pts): engagement ratio (likes / views)
      if (video.viewCount > 0) {
        const engagementRatio = video.likeCount / video.viewCount;
        score += 15 * Math.min(engagementRatio, 1);
      }

      // ── Social proof score (0-20 pts) ──
      // Part A (0-10 pts): creator follower count (caps at 100K)
      const followerPortion = 10 * Math.min(video.creator.followerCount / 100_000, 1);
      // Part B (0-10 pts): video share count (caps at 100)
      const sharePortion = 10 * Math.min(video.shareCount / 100, 1);
      score += followerPortion + sharePortion;

      // ── Follow affinity (0-30 pts) — only if userId provided ──
      if (userId) {
        // Direct follow: +20 pts
        if (followedCreatorIds.has(video.creatorId)) {
          score += 20;
        }
        // Watch history affinity: +10 pts (independent of follow)
        if (watchedCreatorIds.has(video.creatorId)) {
          score += 10;
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
