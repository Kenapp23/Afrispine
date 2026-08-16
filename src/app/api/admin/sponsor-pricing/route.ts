import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { adminAuth } from '@/lib/admin-auth';

// GET /api/admin/sponsor-pricing — return all SponsorPricing records ordered by slotType
export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database is not available' }, { status: 503 });
    }

    const pricings = await db.sponsorPricing.findMany({
      orderBy: { slotType: 'asc' },
    });

    return NextResponse.json({ pricings });
  } catch (error: any) {
    console.error('[admin/sponsor-pricing] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// POST /api/admin/sponsor-pricing — upsert SponsorPricing records (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await adminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbReady) {
      return NextResponse.json({ error: 'Database is not available' }, { status: 503 });
    }

    const body = await req.json();
    const { pricings } = body as {
      pricings: Array<{
        slotType: string;
        label: string;
        priceKes: number;
        impressionsIncluded?: number;
      }>;
    };

    if (!Array.isArray(pricings) || pricings.length === 0) {
      return NextResponse.json(
        { error: 'pricings array is required' },
        { status: 400 },
      );
    }

    // Upsert each pricing record
    const results = [];
    for (const p of pricings) {
      if (!p.slotType || !p.label || !p.priceKes) {
        return NextResponse.json(
          { error: 'Each pricing must have slotType, label, and priceKes' },
          { status: 400 },
        );
      }

      const result = await db.sponsorPricing.upsert({
        where: { slotType: p.slotType },
        update: {
          label: p.label,
          priceKes: parseFloat(String(p.priceKes)),
          impressionsIncluded: p.impressionsIncluded ?? 10000,
          isActive: true,
        },
        create: {
          slotType: p.slotType,
          label: p.label,
          priceKes: parseFloat(String(p.priceKes)),
          impressionsIncluded: p.impressionsIncluded ?? 10000,
        },
      });

      results.push(result);
    }

    return NextResponse.json({ success: true, pricings: results });
  } catch (error: any) {
    console.error('[admin/sponsor-pricing] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save pricing' },
      { status: 500 },
    );
  }
}
