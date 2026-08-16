import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

const DEFAULT_PRICE_KES = 5000;

/** Helper: fetch all SponsorPricing records into a Map */
async function getPricingMap(): Promise<Map<string, { slotType: string; label: string; priceKes: number; impressionsIncluded: number }>> {
  try {
    const records = await db.sponsorPricing.findMany();
    return new Map(
      records.map((r) => [
        r.slotType,
        {
          slotType: r.slotType,
          label: r.label,
          priceKes: r.priceKes,
          impressionsIncluded: r.impressionsIncluded,
        },
      ]),
    );
  } catch {
    return new Map();
  }
}

/** Helper: calculate total cost from slot types */
function calculateTotalCost(
  slotTypes: string[],
  pricingMap: Map<string, { priceKes: number }>,
): { totalCost: number; pricingBreakdown: Array<{ slotType: string; priceKes: number; label?: string }> } {
  const breakdown: Array<{ slotType: string; priceKes: number; label?: string }> = [];
  let totalCost = 0;

  for (const slotType of slotTypes) {
    const pricing = pricingMap.get(slotType);
    const price = pricing ? pricing.priceKes : DEFAULT_PRICE_KES;
    totalCost += price;
    breakdown.push({
      slotType,
      priceKes: price,
      label: (pricing as any)?.label,
    });
  }

  return { totalCost: Math.round(totalCost * 100) / 100, pricingBreakdown: breakdown };
}

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

    if (!brandId || !name || !objective) {
      return NextResponse.json(
        { error: 'brandId, name, and objective are required.' },
        { status: 400 },
      );
    }

    // Verify brand exists
    const brand = await db.sponsorBrand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found.' }, { status: 404 });
    }

    // Look up SponsorPricing for cost calculation
    const pricingMap = await getPricingMap();
    const slots = slotTypes || [];
    const { totalCost, pricingBreakdown } = calculateTotalCost(slots, pricingMap);

    // Create campaign with slots
    const campaign = await db.sponsorCampaign.create({
      data: {
        brandId,
        name,
        objective,
        budgetKes: parseFloat(budgetKes) || totalCost,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'pending_review',
        slots: {
          create: slots.map((slotType: string) => ({
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
      include: { slots: true, brand: true },
    });

    return NextResponse.json({
      success: true,
      campaign,
      totalCost,
      pricingBreakdown,
    });
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

    // Fetch all pricing records for slot cost display
    const pricingMap = await getPricingMap();
    const pricingList = Array.from(pricingMap.values());

    if (campaignId) {
      // Return single campaign
      const campaign = await db.sponsorCampaign.findUnique({
        where: { id: campaignId },
        include: { slots: true, brand: true },
      });
      if (!campaign) {
        return NextResponse.json({ campaign: null });
      }

      // Calculate total cost from pricing
      const slotTypes = campaign.slots.map((s) => s.slotType);
      const { totalCost, pricingBreakdown } = calculateTotalCost(slotTypes, pricingMap);

      return NextResponse.json({ campaign, totalCost, pricingBreakdown, pricings: pricingList });
    }

    if (!brandId) {
      return NextResponse.json({ campaigns: [], pricings: pricingList });
    }

    const campaigns = await db.sponsorCampaign.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { slots: true, brand: true },
    });

    // Attach pricing info to each campaign
    const enrichedCampaigns = campaigns.map((c) => {
      const slotTypes = c.slots.map((s) => s.slotType);
      const { totalCost, pricingBreakdown } = calculateTotalCost(slotTypes, pricingMap);
      return { ...c, totalCost, pricingBreakdown };
    });

    return NextResponse.json({ campaigns: enrichedCampaigns, pricings: pricingList });
  } catch (error: any) {
    console.error('[sponsor/campaigns] GET error:', error);
    return NextResponse.json({ campaigns: [] });
  }
}
