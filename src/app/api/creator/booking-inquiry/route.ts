/**
 * Booking Inquiry API
 *
 * POST: Create a booking inquiry (public)
 * GET:  List booking inquiries (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { creatorId, eventType, roughDate, contactEmail, contactName, message } = body as {
      creatorId?: string;
      eventType?: string;
      roughDate?: string;
      contactEmail?: string;
      contactName?: string;
      message?: string;
    };

    if (!creatorId || !contactEmail || !message) {
      return NextResponse.json(
        { error: 'creatorId, contactEmail, and message are required' },
        { status: 400 },
      );
    }

    const inquiry = await db.bookingInquiry.create({
      data: {
        creatorId,
        eventType: eventType ?? null,
        roughDate: roughDate ?? null,
        contactEmail,
        contactName: contactName ?? null,
        message,
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (err) {
    console.error('[creator/booking-inquiry] POST error:', err);
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
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (status) {
      where.status = status;
    }

    const inquiries = await db.bookingInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(inquiries);
  } catch (err) {
    console.error('[creator/booking-inquiry] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
