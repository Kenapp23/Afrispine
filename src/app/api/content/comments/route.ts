/**
 * Content Comments — Read and post comments
 *
 * GET (?videoId=): Return comments for a video.
 * POST: Create a new comment on a video.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId query param is required' }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { videoId },
      select: {
        id: true,
        userId: true,
        videoId: true,
        body: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(comments);
  } catch (err) {
    console.error('[content/comments] GET error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, body: commentBody, userId } = body as {
      videoId?: string;
      body?: string;
      userId?: string;
    };

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const user = userId ?? 'anonymous';

    const comment = await db.comment.create({
      data: {
        videoId,
        userId: user,
        body: commentBody.trim(),
      },
      select: {
        id: true,
        userId: true,
        videoId: true,
        body: true,
        createdAt: true,
      },
    });

    return NextResponse.json(comment);
  } catch (err) {
    console.error('[content/comments] POST error:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
