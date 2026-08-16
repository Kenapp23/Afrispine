/**
 * Content Follow — Follow/Unfollow a creator
 *
 * POST: Create a Follow relationship (optimistic; duplicate caught by @@unique)
 * DELETE: Remove a Follow relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { creatorId, followerId } = body as { creatorId?: string; followerId?: string };

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // followerId comes from client auth context; use a default for now
    const follower = followerId ?? 'anonymous';

    // Optimistic insert — @@unique([followerId, creatorId]) catches duplicates
    try {
      await db.follow.create({
        data: { followerId: follower, creatorId },
      });

      // Increment creator follower count
      await db.creatorProfile.update({
        where: { id: creatorId },
        data: { followerCount: { increment: 1 } },
      }).catch(() => { /* ignore */ });

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr.code === 'P2002') {
        // Already following — still return success (idempotent)
        return NextResponse.json({ success: true });
      }
      throw err;
    }
  } catch (err) {
    console.error('[content/follow] POST error:', err);
    return NextResponse.json({ error: 'Failed to follow creator' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { creatorId, followerId } = body as { creatorId?: string; followerId?: string };

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const follower = followerId ?? 'anonymous';

    try {
      await db.follow.deleteMany({
        where: { followerId: follower, creatorId },
      });

      // Decrement creator follower count (best-effort)
      await db.creatorProfile.update({
        where: { id: creatorId },
        data: { followerCount: { decrement: 1 } },
      }).catch(() => { /* ignore */ });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[content/follow] DELETE error:', err);
      return NextResponse.json({ error: 'Failed to unfollow creator' }, { status: 500 });
    }
  } catch (err) {
    console.error('[content/follow] DELETE unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
