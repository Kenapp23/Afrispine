/**
 * Premiere → VOD Transition Cron Endpoint
 *
 * Checks for Video rows where releaseMode='premiere' and
 * premiereWindowEnds < now(), and flips releaseMode to 'standard'.
 *
 * Designed to be called by Vercel Cron (vercel.json) or any external
 * scheduler. No auth required for the cron itself — it only flips
 * releaseMode, no destructive operations.
 *
 * Also integrates with the existing payout processor pattern.
 */

import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!dbReady) {
    return NextResponse.json({ flipped: 0, error: 'db_not_ready' });
  }

  try {
    const now = new Date();

    // Find all videos past their premiere window
    const expiredPremieres = await db.video.findMany({
      where: {
        releaseMode: 'premiere',
        premiereWindowEnds: { lt: now },
        status: 'live',
      },
      select: { id: true, title: true, premiereWindowEnds: true },
    });

    if (expiredPremieres.length === 0) {
      return NextResponse.json({ flipped: 0 });
    }

    // Flip all to standard in a transaction
    const ids = expiredPremieres.map((v) => v.id);
    const result = await db.video.updateMany({
      where: { id: { in: ids } },
      data: { releaseMode: 'standard' },
    });

    console.log(
      `[premiere-transition] Flipped ${result.count} video(s) from premiere to standard`,
      expiredPremieres.map((v) => `  - ${v.title} (window ended ${v.premiereWindowEnds?.toISOString()})`).join('\n'),
    );

    return NextResponse.json({ flipped: result.count });
  } catch (err) {
    console.error('[premiere-transition] Error:', err);
    return NextResponse.json({ flipped: 0, error: 'internal' });
  }
}
