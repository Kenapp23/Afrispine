import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                       */
/* ------------------------------------------------------------------ */
const redeemSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
});

/* ------------------------------------------------------------------ */
/*  GET: Look up voucher details for verification                     */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Missing ?code= parameter' }, { status: 400 });
    }

    const voucher = await db.giftVoucher.findUnique({
      where: { reference: code },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    return NextResponse.json({
      merchantName: voucher.merchantId || '',
      amountLocal: voucher.amountLocal,
      currencyLocal: voucher.currencyLocal,
      amountGbp: voucher.amountGbp,
      recipientName: voucher.recipientName,
      senderMessage: voucher.senderMessage,
      status: voucher.status,
      issuedAt: voucher.issuedAt,
      expiresAt: voucher.expiresAt,
      redeemedAt: voucher.redeemedAt,
    });
  } catch (e: any) {
    console.error('[gifts/redeem GET]', e);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST: Mark a voucher as redeemed (for merchants/POS)              */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    // 1. Find voucher by reference (code)
    const voucher = await db.giftVoucher.findUnique({
      where: { reference: parsed.data.code },
    });

    // 2. Not found
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // 3. Already redeemed
    if (voucher.status === 'redeemed') {
      return NextResponse.json({
        error: 'Already redeemed',
        voucher: {
          merchantName: voucher.merchantId || '',
          amountLocal: voucher.amountLocal,
          currencyLocal: voucher.currencyLocal,
          recipientName: voucher.recipientName,
          redeemedAt: voucher.redeemedAt,
        },
      });
    }

    // 4. Check if expired
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return NextResponse.json({ error: 'Voucher expired' }, { status: 400 });
    }

    // 5. Check if actually issued (paid for)
    if (voucher.status !== 'sent') {
      return NextResponse.json(
        { error: 'Voucher is not yet active' },
        { status: 400 },
      );
    }

    // 6. Mark as redeemed
    const updated = await db.giftVoucher.update({
      where: { id: voucher.id },
      data: { status: 'redeemed', redeemedAt: new Date() },
    });

    // 7. Return voucher details
    return NextResponse.json({
      success: true,
      voucher: {
        merchantName: updated.merchantId || '',
        amountLocal: updated.amountLocal,
        currencyLocal: updated.currencyLocal,
        amountGbp: updated.amountGbp,
        recipientName: updated.recipientName,
        redeemedAt: updated.redeemedAt,
      },
    });
  } catch (e: any) {
    console.error('[gifts/redeem POST]', e);
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
  }
}