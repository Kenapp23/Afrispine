/**
 * Content Report API
 *
 * POST: Report a video (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { videoId, reporterPhone, reason } = body as {
      videoId?: string;
      reporterPhone?: string;
      reason?: string;
    };

    if (!videoId || !reason) {
      return NextResponse.json(
        { error: 'videoId and reason are required' },
        { status: 400 },
      );
    }

    const report = await db.contentReport.create({
      data: {
        videoId,
        reporterPhone: reporterPhone ?? null,
        reason,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error('[content/report] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
