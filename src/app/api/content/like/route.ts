/**
 * Content Like — Like/Unlike a video
 *
 * POST: Create a Like, increment Video.likeCount
 * DELETE: Delete a Like, decrement Video.likeCount
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, userId } = body as { videoId?: string; userId?: string };

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const user = userId ?? 'anonymous';

    // Optimistic insert — @@unique([userId, videoId]) catches duplicates
    try {
      await db.like.create({
        data: { userId: user, videoId },
      });

      // Increment video like count
      await db.video.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      }).catch(() => { /* ignore */ });

      // Fire analytics (fire-and-forget)
      db.analyticsEvent.create({
        data: {
          eventName: 'video_liked',
          actorType: 'viewer',
          actorId: user,
          targetType: 'video',
          targetId: videoId,
        },
      }).catch(() => {});

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr.code === 'P2002') {
        // Already liked — return success (idempotent)
        return NextResponse.json({ success: true });
      }
      throw err;
    }
  } catch (err) {
    console.error('[content/like] POST error:', err);
    return NextResponse.json({ error: 'Failed to like video' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, userId } = body as { videoId?: string; userId?: string };

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const user = userId ?? 'anonymous';

    try {
      const deleted = await db.like.deleteMany({
        where: { userId: user, videoId },
      });

      if (deleted.count > 0) {
        // Decrement video like count
        await db.video.update({
          where: { id: videoId },
          data: { likeCount: { decrement: 1 } },
        }).catch(() => { /* ignore */ });
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[content/like] DELETE error:', err);
      return NextResponse.json({ error: 'Failed to unlike video' }, { status: 500 });
    }
  } catch (err) {
    console.error('[content/like] DELETE unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
