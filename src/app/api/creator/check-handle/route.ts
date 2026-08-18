/**
 * Handle Availability Check
 *
 * GET ?handle=xxx — returns {available: true/false}
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'handle is required' }, { status: 400 });
  }

  try {
    const existing = await db.creatorProfile.findUnique({
      where: { handle },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (err) {
    console.error('[creator/check-handle] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
