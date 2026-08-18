/**
 * Analytics Event API
 *
 * POST: Fire-and-forget analytics event. No auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    // Fire-and-forget — don't block the client
    return NextResponse.json({ accepted: true, note: 'db_not_ready' }, { status: 202 });
  }

  try {
    const body = await req.json();
    const { eventName, actorType, actorId, targetType, targetId, meta } = body as {
      eventName?: string;
      actorType?: string;
      actorId?: string;
      targetType?: string;
      targetId?: string;
      meta?: string;
    };

    if (!eventName) {
      return NextResponse.json({ error: 'eventName is required' }, { status: 400 });
    }

    await db.analyticsEvent.create({
      data: {
        eventName,
        actorType: actorType ?? null,
        actorId: actorId ?? null,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        meta: meta ?? null,
      },
    });

    return NextResponse.json({ accepted: true }, { status: 201 });
  } catch (err) {
    console.error('[analytics/event] POST error:', err);
    // Still return 202 — analytics should never block the client
    return NextResponse.json({ accepted: true, note: 'write_failed' }, { status: 202 });
  }
}
