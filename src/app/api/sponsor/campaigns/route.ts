import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

// POST /api/sponsor/campaigns — create a new campaign with slots
export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json(
        { error: 'Database is not available. Please try again later.' },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { brandId, name, objective, budgetKes, startDate, endDate, categories, slotTypes, creativeUrl } = body;

    if (!brandId || !name || !objective || !budgetKes) {
      return NextResponse.json(
        { error: 'brandId, name, objective, and budgetKes are required.' },
        { status: 400 },
      );
    }

    // Verify brand exists
    const brand = await db.sponsorBrand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found.' }, { status: 404 });
    }

    // Create campaign with slots
    const campaign = await db.sponsorCampaign.create({
      data: {
        brandId,
        name,
        objective,
        budgetKes: parseFloat(budgetKes),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'pending_review',
        slots: {
          create: (slotTypes || []).map((slotType: string) => ({
            slotType,
            creativeUrl: creativeUrl || '',
            impressionLimit: 100000,
            currentImpressions: 0,
            clickCount: 0,
            status: 'pending',
            category: (categories || [])[0] || null,
          })),
        },
      },
      include: { slots: true },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('[sponsor/campaigns] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign. Please try again.' },
      { status: 500 },
    );
  }
}

// GET /api/sponsor/campaigns — list campaigns for a brand
export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ campaigns: [] });
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || '';
    const campaignId = searchParams.get('campaignId') || '';

    if (campaignId) {
      // Return single campaign
      const campaign = await db.sponsorCampaign.findUnique({
        where: { id: campaignId },
        include: { slots: true, brand: true },
      });
      return NextResponse.json({ campaign });
    }

    if (!brandId) {
      return NextResponse.json({ campaigns: [] });
    }

    const campaigns = await db.sponsorCampaign.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { slots: true },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[sponsor/campaigns] GET error:', error);
    return NextResponse.json({ campaigns: [] });
  }
}
