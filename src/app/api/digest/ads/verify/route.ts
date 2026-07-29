import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTransaction } from '@/lib/paystack';

// POST /api/digest/ads/verify — verify Paystack payment for an ad
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body as { reference?: string };

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing required field: reference' },
        { status: 400 },
      );
    }

    // ── Verify with Paystack ──
    const result = await verifyTransaction(reference);

    if (result.status !== 'success') {
      return NextResponse.json(
        { error: `Payment not successful. Status: ${result.status}` },
        { status: 400 },
      );
    }

    // ── Find payment record by Paystack reference ──
    const payment = await db.digestAdPayment.findUnique({
      where: { paystackRef: reference },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found for this reference' },
        { status: 404 },
      );
    }

    // ── Update payment status ──
    await db.digestAdPayment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    // ── Update ad slot status ──
    const amountUsd = result.amount / 100; // Paystack returns amount in kobo/pence
    await db.sponsoredDigestSlot.update({
      where: { id: payment.adId },
      data: {
        status: 'approved',
        paidAmountUsd: amountUsd,
      },
    });

    // ── Update advertiser total spend ──
    await db.digestAdvertiser.update({
      where: { id: payment.advertiserId },
      data: {
        totalSpendUsd: {
          increment: amountUsd,
        },
      },
    });

    console.log(
      `[digest/ads/verify] Ad ${payment.adId} payment verified — $${amountUsd} from ${reference}`,
    );

    return NextResponse.json({
      success: true,
      adId: payment.adId,
      amountPaid: amountUsd,
      reference,
      status: 'completed',
    });
  } catch (e: any) {
    console.error('[digest/ads/verify]', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET /api/digest/ads/verify?id=xxx — get ad details by ID (for preview)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 },
      );
    }

    const slot = await db.sponsoredDigestSlot.findUnique({
      where: { id },
      include: {
        advertiser: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Ad slot not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(slot);
  } catch (e: any) {
    console.error('[digest/ads/verify] GET', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}