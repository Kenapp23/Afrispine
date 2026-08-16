/**
 * Content Feed — Public video listing
 *
 * Returns live videos ordered by most recent. Used by the home feed.
 * Gracefully degrades if the database is unavailable.
 */

import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET() {
  try {
    if (!dbReady) {
      return NextResponse.json([]);
    }

    const videos = await db.video.findMany({
      where: { status: 'live' },
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
    console.error('[content/feed] Error:', err);
    return NextResponse.json([]);
  }
}
