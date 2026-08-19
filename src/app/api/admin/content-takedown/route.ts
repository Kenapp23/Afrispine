/**
 * Admin Content Takedown API
 *
 * POST:   Takedown a video (set status='takedown'). Admin only.
 * GET:    List content reports by status. Admin only.
 * PATCH:  Dismiss a report (set status='reviewed'). Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdminWith2FA } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdminWith2FA(req);
  if (auth.error) return auth.res!;

  try {
    const body = await req.json();
    const { videoId, reportId } = body as { videoId?: string; reportId?: string };

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    // Takedown the video
    const video = await db.video.update({
      where: { id: videoId },
      data: { status: 'takedown' },
    });

    // Also mark the associated report as reviewed if reportId provided
    if (reportId) {
      await db.contentReport.update({
        where: { id: reportId },
        data: { status: 'reviewed' },
      }).catch(() => { /* ignore if report doesn't exist */ });
    }

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

  const auth = await requireAdminWith2FA(req);
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

export async function PATCH(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdminWith2FA(req);
  if (auth.error) return auth.res!;

  try {
    const body = await req.json();
    const { reportId, action } = body as { reportId?: string; action?: string };

    if (!reportId || !action) {
      return NextResponse.json({ error: 'reportId and action are required' }, { status: 400 });
    }

    if (action === 'dismiss') {
      const updated = await db.contentReport.update({
        where: { id: reportId },
        data: { status: 'dismissed' },
      });
      return NextResponse.json({ success: true, reportId: updated.id, status: updated.status });
    }

    return NextResponse.json({ error: 'Unknown action. Use "dismiss".' }, { status: 400 });
  } catch (err) {
    console.error('[admin/content-takedown] PATCH error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
