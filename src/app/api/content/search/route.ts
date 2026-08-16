/**
 * Content Search — Video search
 *
 * POST handler that searches videos by title, description, and category.
 * V1: Simple Prisma contains-based search.
 *
 * // TODO: Replace with embedding-based semantic search when provider is decided (§5.2 open decision)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

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

    // TODO: Replace with embedding-based semantic search when provider is decided (§5.2 open decision)

    const videos = await db.video.findMany({
      where: {
        status: 'live',
        OR: [
          { title: { contains: query.trim() } },
          { description: { contains: query.trim() } },
          { category: { contains: query.trim() } },
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
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(videos);
  } catch (err) {
    console.error('[content/search] Error:', err);
    return NextResponse.json([]);
  }
}
