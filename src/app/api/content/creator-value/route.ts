/**
 * Creator Value Score API — System C
 *
 * GET /api/content/creator-value?creatorId=xxx
 *
 * Returns the creator's computed value score (0-100) and,
 * if a slotType query param is provided, the dynamic price
 * for that creator's sponsorship slot.
 *
 * IMPORTANT: This returns ONE creator's pricing at a time.
 * Never expose side-by-side pricing comparisons — that would
 * effectively publish a popularity ranking of creators to advertisers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { getCreatorAggregate, computeCreatorValueScore, priceMultiplier } from '@/lib/scoring';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');
  const slotType = searchParams.get('slotType');

  if (!creatorId) {
    return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
  }

  if (!dbReady) {
    return NextResponse.json({ valueScore: null, error: 'db_not_ready' });
  }

  try {
    // Fetch creator info
    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        stageName: true,
        handle: true,
        followerCount: true,
        verified: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ valueScore: null, error: 'creator_not_found' }, { status: 404 });
    }

    const agg = await getCreatorAggregate(creatorId);
    const valueScore = agg ? computeCreatorValueScore(agg) : 0;

    const response: {
      creatorId: string;
      stageName: string;
      handle: string;
      verified: boolean;
      followerCount: number;
      valueScore: number;
      tier: string;
      dynamicPrice?: {
        slotType: string;
        basePriceKes: number;
        multiplier: number;
        fromPriceKes: number;
      };
    } = {
      creatorId: creator.id,
      stageName: creator.stageName,
      handle: creator.handle,
      verified: creator.verified,
      followerCount: creator.followerCount,
      valueScore,
      tier: valueScore >= 67 ? 'top-tier' : valueScore >= 34 ? 'established' : 'emerging',
    };

    // If slotType requested, compute dynamic price
    if (slotType && dbReady) {
      const pricing = await db.sponsorPricing.findUnique({
        where: { slotType },
        select: { priceKes: true, label: true },
      });

      if (pricing) {
        const mult = priceMultiplier(valueScore);
        response.dynamicPrice = {
          slotType,
          basePriceKes: pricing.priceKes,
          multiplier: mult,
          fromPriceKes: Math.round(pricing.priceKes * mult),
        };
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[creator-value] Error:', err);
    return NextResponse.json({ valueScore: null, error: 'internal' }, { status: 500 });
  }
}
