/**
 * Watch Party — Sync Playback State (host only)
 *
 * POST: { roomCode, isPlaying, playbackSeconds } → { ok: true }
 *
 * The host periodically calls this to persist current playback state
 * in the DB. New members fetch this state via GET /api/watch-party/room
 * or via Supabase Realtime sync-response events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { roomCode, isPlaying, playbackSeconds } = body as {
      roomCode?: string;
      isPlaying?: boolean;
      playbackSeconds?: number;
    };

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isPlaying === 'boolean') updateData.isPlaying = isPlaying;
    if (typeof playbackSeconds === 'number') updateData.currentPlaybackSeconds = playbackSeconds;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true });
    }

    await db.watchPartyRoom.update({
      where: { roomCode: roomCode.toUpperCase() },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[watch-party/sync] POST error:', err);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
