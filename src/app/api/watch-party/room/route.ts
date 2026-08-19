/**
 * Watch Party — Get Room Details
 *
 * GET: ?roomCode=xxx → { room details, member count, video info }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get('roomCode');

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const room = await db.watchPartyRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            category: true,
            creator: {
              select: { stageName: true, handle: true, avatarUrl: true },
            },
          },
        },
        members: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      roomCode: room.roomCode,
      videoId: room.videoId,
      hostUserId: room.hostUserId,
      isPlaying: room.isPlaying,
      currentPlaybackSeconds: room.currentPlaybackSeconds,
      memberCount: room.members.length,
      createdAt: room.createdAt,
      video: room.video,
    });
  } catch (err) {
    console.error('[watch-party/room] GET error:', err);
    return NextResponse.json({ error: 'Failed to get room details' }, { status: 500 });
  }
}
