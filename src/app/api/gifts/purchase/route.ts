import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';
import { getMerchantById } from '@/lib/merchants';

/* ------------------------------------------------------------------ */
/*  FX rates: GBP → local currency (hardcoded)                        */
/* ------------------------------------------------------------------ */
const FX_RATES: Record<string, { rate: number; currency: string }> = {
  KE: { rate: 190, currency: 'KES' },
  NG: { rate: 1950, currency: 'NGN' },
  ZA: { rate: 23, currency: 'ZAR' },
  GH: { rate: 15, currency: 'GHS' },
  UG: { rate: 4700, currency: 'UGX' },
  TZ: { rate: 3300, currency: 'TZS' },
};

/* ------------------------------------------------------------------ */
/*  Zod schema                                                        */
/* ------------------------------------------------------------------ */
const purchaseSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  merchantName: z.string().min(1, 'Merchant name is required'),
  occasion: z.string().default(''),
  amountGbp: z.number().min(5, 'Minimum amount is £5').max(500, 'Maximum amount is £500'),
  recipientName: z.string().min(1, "Recipient's name is required"),
  recipientPhone: z.string().default(''),
  recipientEmail: z.string().default(''),
  senderMessage: z.string().default(''),
  deliveryMethod: z.string().default('whatsapp'),
  customAmount: z.number().optional(),
});

/* ------------------------------------------------------------------ */
/*  POST: Initialize a gift voucher purchase via Paystack             */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const sender = await requireSenderAuth(req);

    // 2. Parse & validate
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // 3. Look up merchant for country/FX
    const merchant = getMerchantById(data.merchantId);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 400 });
    }

    const fx = FX_RATES[merchant.countryCode];
    if (!fx) {
      return NextResponse.json(
        { error: `FX rate not available for ${merchant.country}` },
        { status: 400 },
      );
    }

    // 4. Calculations
    const amountGbp = data.customAmount || data.amountGbp;
    const voucherFeeGbp = 1.5;
    const totalChargedGbp = amountGbp + voucherFeeGbp;
    const amountLocal = Math.round(amountGbp * fx.rate);

    // 5. Generate reference
    const reference = `AFSP-GIFT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // 6. Create pending voucher
    const voucher = await db.giftVoucher.create({
      data: {
        reference,
        senderId: sender.id,
        merchantId: data.merchantId,
        occasion: data.occasion,
        amountGbp,
        amountLocal,
        currencyLocal: fx.currency,
        fxRate: fx.rate,
        voucherFeeGbp,
        totalChargedGbp,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        recipientEmail: data.recipientEmail,
        senderMessage: data.senderMessage,
        deliveryMethod: data.deliveryMethod,
        status: 'pending',
      },
    });

    // 7. Initialize Paystack
    const paystackResult = await initializeTransaction({
      email: sender.email,
      amount: totalChargedGbp,
      reference,
      metadata: {
        type: 'gift_voucher',
        voucherRef: reference,
        senderId: sender.id,
      },
    });

    // 8. Update voucher with Paystack reference
    await db.giftVoucher.update({
      where: { id: voucher.id },
      data: { paystackRef: paystackResult.reference },
    });

    // 9. Return
    return NextResponse.json({
      access_code: paystackResult.access_code,
      reference: paystackResult.reference,
      voucherRef: reference,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[gifts/purchase]', e);
    return NextResponse.json(
      { error: e.message || 'Failed to initiate purchase' },
      { status: 500 },
    );
  }
}