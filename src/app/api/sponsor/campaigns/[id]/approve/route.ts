/**
 * POST /api/sponsor/campaigns/[id]/approve
 *
 * Admin approves a sponsor campaign, calculates total cost from SponsorPricing,
 * and initiates M-Pesa STK Push for flat-rate payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { adminAuth } from '@/lib/admin-auth';
import { initiateStkPush } from '@/lib/daraja';

const DEFAULT_PRICE_KES = 5000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await adminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbReady) {
      return NextResponse.json({ error: 'Database is not available' }, { status: 503 });
    }

    const { id } = await params;

    // a) Find the campaign by id, include brand (for billingPhone)
    const campaign = await db.sponsorCampaign.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, billingPhone: true, companyName: true } },
        slots: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'pending_review') {
      return NextResponse.json(
        { error: `Campaign is in "${campaign.status}" status — only pending_review campaigns can be approved` },
        { status: 400 },
      );
    }

    if (!campaign.brand.billingPhone) {
      return NextResponse.json(
        { error: 'Brand has no billing phone number configured' },
        { status: 400 },
      );
    }

    // b) Look up SponsorPricing for each slot type in the campaign's slots
    const slotTypes = [...new Set(campaign.slots.map((s) => s.slotType))];
    const pricingRecords = await db.sponsorPricing.findMany({
      where: { slotType: { in: slotTypes } },
    });

    const pricingMap = new Map(pricingRecords.map((p) => [p.slotType, p]));

    // c) Calculate total cost = sum of all slot prices
    let totalCost = 0;
    for (const slot of campaign.slots) {
      const pricing = pricingMap.get(slot.slotType);
      totalCost += pricing ? pricing.priceKes : DEFAULT_PRICE_KES;
    }

    totalCost = Math.round(totalCost * 100) / 100;

    // d) Update campaign: status = 'awaiting_payment', paymentPhone = brand.billingPhone
    // e) Generate merchantRequestId
    const merchantRequestId = `SPN_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await db.sponsorCampaign.update({
      where: { id },
      data: {
        status: 'awaiting_payment',
        paymentPhone: campaign.brand.billingPhone,
        merchantRequestId,
        paymentStatus: 'pending',
        budgetKes: totalCost,
      },
    });

    // f) Call initiateStkPush
    const callbackUrl =
      `${process.env.APP_URL ?? 'https://www.afri-spine.com'}/api/webhooks/mpesa-sponsor-callback`;

    const stkResult = await initiateStkPush(
      campaign.brand.billingPhone,
      totalCost,
      merchantRequestId,
      callbackUrl,
    );

    if (!stkResult.success) {
      // Revert campaign status on STK failure
      await db.sponsorCampaign.update({
        where: { id },
        data: {
          status: 'pending_review',
          paymentStatus: 'failed',
          merchantRequestId: null,
          paymentPhone: null,
        },
      });

      return NextResponse.json(
        { error: stkResult.error ?? 'Failed to initiate M-Pesa payment' },
        { status: 500 },
      );
    }

    // g) Update campaign with the real merchantRequestId from Daraja
    await db.sponsorCampaign.update({
      where: { id },
      data: { merchantRequestId: stkResult.merchantRequestId ?? merchantRequestId },
    });

    // h) Return { merchantRequestId, totalCost }
    return NextResponse.json({
      merchantRequestId: stkResult.merchantRequestId ?? merchantRequestId,
      totalCost,
    });
  } catch (error: any) {
    console.error('[sponsor/campaigns/approve] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to approve campaign' },
      { status: 500 },
    );
  }
}
