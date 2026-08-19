/**
 * Watch Party — Create Room
 *
 * POST: { videoId, userId } → { roomCode, joinUrl }
 *
 * The room is persisted in the DB. Real-time sync is handled by
 * Supabase Realtime broadcast channels (client-side), NOT socket.io.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

// Uppercase alphanumeric, excluding ambiguous chars O/0/I/1/L
const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, userId } = body as { videoId?: string; userId?: string };

    if (!videoId || !userId) {
      return NextResponse.json({ error: 'videoId and userId are required' }, { status: 400 });
    }

    // Verify video exists
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (await db.watchPartyRoom.findUnique({ where: { roomCode } }) && attempts < 20) {
      roomCode = generateRoomCode();
      attempts++;
    }
    if (attempts >= 20) {
      return NextResponse.json({ error: 'Could not generate unique room code' }, { status: 500 });
    }

    // Create room + host member
    const room = await db.watchPartyRoom.create({
      data: {
        roomCode,
        videoId,
        hostUserId: userId,
        members: {
          create: {
            userId,
          },
        },
      },
    });

    return NextResponse.json({
      roomCode: room.roomCode,
      joinUrl: `/party/${room.roomCode}`,
    });
  } catch (err) {
    console.error('[watch-party/create] POST error:', err);
    return NextResponse.json({ error: 'Failed to create watch party' }, { status: 500 });
  }
}
