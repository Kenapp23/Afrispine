/**
 * Creator Value Score — System C
 *
 * Extracts a creator-level value score (0–100) by aggregating signals
 * already used in the foryou composite scorer. Reuses the same weights
 * and normalization approach rather than inventing a different formula.
 *
 * Inputs: followerCount, aggregate likeCount/viewCount/shareCount across
 * the creator's videos, recency-weighted.
 *
 * Output: normalized 0–100 "value score" used by dynamic pricing,
 * VOD ranking, and future collab suggestions.
 */

import { db, dbReady } from '@/lib/db';

const SEVEN_DAYS_HOURS = 168;

interface CreatorAggregate {
  followerCount: number;
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  videoCount: number;
  mostRecentVideoAge: number; // hours since latest video
}

export async function getCreatorAggregate(creatorId: string): Promise<CreatorAggregate | null> {
  if (!dbReady) return null;

  try {
    const videos = await db.video.findMany({
      where: { creatorId, status: 'live' },
      select: {
        likeCount: true,
        viewCount: true,
        shareCount: true,
        createdAt: true,
      },
      take: 500,
    });

    if (videos.length === 0) return null;

    const now = Date.now();
    let totalLikes = 0;
    let totalViews = 0;
    let totalShares = 0;
    let mostRecentAge = Infinity;

    for (const v of videos) {
      totalLikes += v.likeCount;
      totalViews += v.viewCount;
      totalShares += v.shareCount;
      const age = (now - v.createdAt.getTime()) / (1000 * 60 * 60);
      if (age < mostRecentAge) mostRecentAge = age;
    }

    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { followerCount: true },
    });

    if (!creator) return null;

    return {
      followerCount: creator.followerCount,
      totalLikes,
      totalViews,
      totalShares,
      videoCount: videos.length,
      mostRecentVideoAge: mostRecentAge === Infinity ? SEVEN_DAYS_HOURS : mostRecentAge,
    };
  } catch {
    return null;
  }
}

/**
 * Compute a normalized 0–100 creator value score.
 *
 * Dimensions (mirrors foryou weights):
 *   1. Follower base      (0–30 pts): normalized followers
 *   2. Engagement rate    (0–25 pts): likes / views ratio
 *   3. Aggregate reach    (0–25 pts): total views + shares
 *   4. Recency             (0–20 pts): how recently they published
 */
export function computeCreatorValueScore(agg: CreatorAggregate): number {
  let score = 0;

  // 1. Follower base (0–30 pts) — normalized against 100K ceiling
  const followerScore = 30 * Math.min(agg.followerCount / 100_000, 1);
  score += followerScore;

  // 2. Engagement rate (0–25 pts) — likes per view
  if (agg.totalViews > 0) {
    const engRate = agg.totalLikes / agg.totalViews;
    score += 25 * Math.min(engRate, 1);
  }

  // 3. Aggregate reach (0–25 pts) — total views normalized against 1M ceiling
  const reachScore = 25 * Math.min(agg.totalViews / 1_000_000, 1);
  score += reachScore;

  // 4. Recency (0–20 pts) — decays linearly over 7 days
  const recencyScore = Math.max(0, 20 * (1 - agg.mostRecentVideoAge / SEVEN_DAYS_HOURS));
  score += recencyScore;

  // Clamp to 0–100
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Price multiplier based on value score tier.
 *
 *   0–33  → ×0.8  (emerging)
 *   34–66 → ×1.0  (established)
 *   67–100 → ×1.4 (top-tier)
 *
 * Kennedy should sanity-check these bands before launch.
 */
export function priceMultiplier(valueScore: number): number {
  if (valueScore >= 67) return 1.4;
  if (valueScore >= 34) return 1.0;
  return 0.8;
}
