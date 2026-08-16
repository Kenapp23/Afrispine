/**
 * Content For You — Personalized feed
 *
 * V1: Returns same data as feed with basic ordering (most recent first).
 * Accepts optional ?userId= for future personalization.
 * Accepts optional ?category= for filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    // Future: Use userId for personalization via WatchEvent history
    if (userId) {
      console.log(`[content/foryou] userId=${userId} (personalization TBD)`);
    }

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
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(videos);
  } catch (err) {
    console.error('[content/foryou] Error:', err);
    return NextResponse.json([]);
  }
}
