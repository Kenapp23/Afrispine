/**
 * Brand Inquiry API
 *
 * POST:   Create a brand inquiry (public)
 * GET:    List brand inquiries (admin only, optional ?status=new)
 * PATCH:  Update inquiry status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { sendWhatsAppAsync } from '@/lib/whatsapp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const VALID_STATUSES = ['new', 'responded', 'closed'] as const;

type InquiryStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: NextRequest) {
  // Rate limit: 10 inquiries per IP per minute
  const ip = getClientIp(req);
  const rl = checkRateLimit(`ip:${ip}:brand-inquiry`, 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many inquiries. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { creatorId, brandName, contactEmail, message } = body as {
      creatorId?: string;
      brandName?: string;
      contactEmail?: string;
      message?: string;
    };

    if (!creatorId || !brandName || !contactEmail || !message) {
      return NextResponse.json(
        { error: 'creatorId, brandName, contactEmail, and message are required' },
        { status: 400 },
      );
    }

    const inquiry = await db.brandInquiry.create({
      data: { creatorId, brandName, contactEmail, message },
    });

    // Notify the creator about the new brand inquiry
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
            inquiry_type: 'Brand',
            from_name: brandName,
            preview: message.slice(0, 80),
          },
        }).catch(() => {});
      }
    } catch {}

    return NextResponse.json(inquiry, { status: 201 });
  } catch (err) {
    console.error('[creator/brand-inquiry] POST error:', err);
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

    const inquiries = await db.brandInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(inquiries);
  } catch (err) {
    console.error('[creator/brand-inquiry] GET error:', err);
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

    const updated = await db.brandInquiry.update({
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
    console.error('[creator/brand-inquiry] PATCH error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
