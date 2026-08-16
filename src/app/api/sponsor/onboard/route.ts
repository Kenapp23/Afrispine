import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

// POST /api/sponsor/onboard — register a new sponsor brand
export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json(
        { error: 'Database is not available. Please try again later.' },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { companyName, contactEmail, contactName, website, billingPhone } = body;

    if (!companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'companyName and contactEmail are required.' },
        { status: 400 },
      );
    }

    // Check for existing email
    const existing = await db.sponsorBrand.findUnique({ where: { contactEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'A brand with this email already exists.' },
        { status: 409 },
      );
    }

    const brand = await db.sponsorBrand.create({
      data: {
        companyName,
        contactEmail,
        contactName: contactName || null,
        website: website || null,
        billingPhone: billingPhone || null,
        kybStatus: 'unverified',
      },
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    console.error('[sponsor/onboard] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create brand. Please try again.' },
      { status: 500 },
    );
  }
}

// GET /api/sponsor/onboard — list brands (for admin page)
export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ brands: [] });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'all') {
      where.kybStatus = status;
    }

    const brands = await db.sponsorBrand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaigns: true } } },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('[sponsor/onboard] GET error:', error);
    return NextResponse.json({ brands: [] });
  }
}
