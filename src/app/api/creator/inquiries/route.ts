/**
 * Creator Inquiries API
 *
 * GET: List inquiries for a specific creator (by ?creatorId=).
 *       Includes both brand and booking inquiries, merged and sorted.
 *       No auth required — inquiries are public-facing data addressed to the creator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
  }

  try {
    const [brandInquiries, bookingInquiries] = await Promise.all([
      db.brandInquiry.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.bookingInquiry.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Merge and sort by date
    const merged = [
      ...brandInquiries.map((i) => ({ ...i, _type: 'brand' as const })),
      ...bookingInquiries.map((i) => ({ ...i, _type: 'booking' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(merged);
  } catch (err) {
    console.error('[creator/inquiries] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
