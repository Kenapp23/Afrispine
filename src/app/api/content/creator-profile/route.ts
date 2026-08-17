/**
 * Creator Profile API
 *
 * GET /api/content/creator-profile?handle=xxx
 * GET /api/content/creator-profile?id=xxx
 *
 * Returns creator profile with their recent videos for card rendering.
 * Public — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'db_not_ready' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const id = searchParams.get('id');

  if (!handle && !id) {
    return NextResponse.json({ error: 'handle or id required' }, { status: 400 });
  }

  try {
    const where: Record<string, string> = id ? { id } : { handle: handle! };

    const creator = await db.creatorProfile.findUnique({
      where,
      select: {
        id: true,
        stageName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        verified: true,
        followerCount: true,
        createdAt: true,
        videos: {
          where: { status: 'live' },
          select: {
            id: true,
            title: true,
            category: true,
            ticketPriceKes: true,
            thumbnailUrl: true,
            releaseMode: true,
            premiereAt: true,
            premiereWindowEnds: true,
            viewCount: true,
            likeCount: true,
            shareCount: true,
            createdAt: true,
            durationSeconds: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: 'creator_not_found' }, { status: 404 });
    }

    return NextResponse.json(creator);
  } catch (err) {
    console.error('[creator-profile] Error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
