/**
 * Brand Inquiry API
 *
 * POST: Create a brand inquiry (public)
 * GET:  List brand inquiries (admin only, optional ?status=new)
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
