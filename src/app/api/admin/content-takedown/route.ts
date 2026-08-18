/**
 * Admin Content Takedown API
 *
 * POST: Takedown a video (set status='takedown'). Admin only.
 * GET:  List pending content reports. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  try {
    const body = await req.json();
    const { videoId } = body as { videoId?: string };

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const video = await db.video.update({
      where: { id: videoId },
      data: { status: 'takedown' },
    });

    return NextResponse.json({ success: true, videoId: video.id, status: video.status });
  } catch (err) {
    console.error('[admin/content-takedown] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    const reports = await db.contentReport.findMany({
      where: { status },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            status: true,
            creatorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error('[admin/content-takedown] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
