/**
 * My Tickets API
 *
 * GET /api/content/my-tickets?phone=254XXX
 *
 * Returns tickets purchased by the given phone number,
 * joined with Video title/thumbnail and Creator stageName,
 * ordered by purchasedAt desc, take 20.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 },
      );
    }

    if (!dbReady) {
      return NextResponse.json({ tickets: [] });
    }

    const tickets = await db.contentTicket.findMany({
      where: { viewerPhone: phone },
      orderBy: { purchasedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        videoId: true,
        amountPaid: true,
        purchasedAt: true,
        video: {
          select: {
            title: true,
            thumbnailUrl: true,
            creator: {
              select: {
                stageName: true,
              },
            },
          },
        },
      },
    });

    const mapped = tickets.map((t) => ({
      id: t.id,
      videoId: t.videoId,
      title: t.video?.title ?? 'Untitled',
      thumbnailUrl: t.video?.thumbnailUrl ?? null,
      creatorName: t.video?.creator?.stageName ?? 'Unknown',
      amountPaid: t.amountPaid,
      purchasedAt: t.purchasedAt.toISOString(),
    }));

    return NextResponse.json({ tickets: mapped });
  } catch (err) {
    console.error('[my-tickets] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
