/**
 * Booking Inquiry API
 *
 * POST:   Create a booking inquiry (public)
 * GET:    List booking inquiries (admin only)
 * PATCH:  Update inquiry status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { sendWhatsAppAsync } from '@/lib/whatsapp';

const VALID_STATUSES = ['new', 'responded', 'closed'] as const;

type InquiryStatus = (typeof VALID_STATUSES)[number];

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

    // Notify the creator about the new booking inquiry
    try {
      const creator = await db.creatorProfile.findUnique({
        where: { id: creatorId },
        select: { stageName: true, whatsappNumber: true, handle: true },
      });
      if (creator?.whatsappNumber) {
        sendWhatsAppAsync({
          to: creator.whatsappNumber,
          templateName: 'inquiry_notification',
          templateParams: {
            creator_name: creator.stageName || creator.handle,
            inquiry_type: 'Booking',
            from_name: contactName || contactEmail,
            preview: message.slice(0, 80),
          },
        }).catch(() => {});
      }
    } catch {}

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

export async function PATCH(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  try {
    const body = await req.json();
    const { id, status } = body as { id?: string; status?: string };

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(status as InquiryStatus)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const updated = await db.bookingInquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    console.error('[creator/booking-inquiry] PATCH error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
