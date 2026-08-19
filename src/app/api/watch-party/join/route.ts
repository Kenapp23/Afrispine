/**
 * Watch Party — Join Room
 *
 * POST: { roomCode, userId? } → { videoId, roomCode }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { roomCode, userId } = body as { roomCode?: string; userId?: string };

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    // Find room by roomCode
    const room = await db.watchPartyRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: { video: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Add member (idempotent — unique constraint on [roomId, userId])
    if (userId) {
      try {
        await db.watchPartyMember.create({
          data: {
            roomId: room.id,
            userId,
          },
        });
      } catch (err: unknown) {
        // P2002 = unique violation, already a member
        const prismaErr = err as { code?: string };
        if (prismaErr.code !== 'P2002') throw err;
      }
    }

    return NextResponse.json({
      videoId: room.videoId,
      roomCode: room.roomCode,
      videoTitle: room.video.title,
      hostUserId: room.hostUserId,
    });
  } catch (err) {
    console.error('[watch-party/join] POST error:', err);
    return NextResponse.json({ error: 'Failed to join watch party' }, { status: 500 });
  }
}
