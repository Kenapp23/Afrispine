import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSenderAuth, getSenderFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

// ── FX rates (to CNY) ──
const FX_RATES_TO_CNY: Record<string, number> = {
  KES: 0.0056,
  NGN: 0.00095,
  GHS: 0.48,
  USD: 7.25,
  GBP: 9.18,
};

// ── Validation schema ──
const paySchema = z.object({
  amount: z.number().min(1).max(50000),
  currencyFrom: z.enum(['KES', 'NGN', 'GHS', 'USD', 'GBP']),
  supplierName: z.string().min(1).max(200),
  supplierBankName: z.string().min(1).max(200),
  supplierAccountNumber: z.string().min(1).max(50),
  supplierBankCode: z.string().min(1).max(50),
  deliveryMethod: z.enum(['bank_transfer', 'alipay']),
  supplierAlipayAccount: z.string().optional(),
  purposeOfPayment: z.enum(['goods_payment', 'service_payment', 'trade_settlement']),
  invoiceUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    // Auth — optional for beta, but we try to get the sender
    let senderId: string | null = null;
    let senderEmail: string | null = null;
    try {
      const sender = await requireSenderAuth(req);
      senderId = sender.id;
      senderEmail = sender.email;
    } catch {
      // Allow unauthenticated beta access
    }

    const body = await req.json();
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const data = parsed.data;

    // Validate delivery method
    if (data.deliveryMethod === 'alipay' && !data.supplierAlipayAccount) {
      return NextResponse.json(
        { error: 'Alipay account is required when delivery method is alipay' },
        { status: 400 }
      );
    }

    // FX conversion
    const fxRate = FX_RATES_TO_CNY[data.currencyFrom];
    if (!fxRate) {
      return NextResponse.json({ error: `Unsupported currency: ${data.currencyFrom}` }, { status: 400 });
    }

    const cnyAmount = parseFloat((data.amount * fxRate).toFixed(2));

    // Fee calculation: 0.8% of amount (minimum $5 equivalent in source currency)
    const feePct = 0.8;
    let feeInSourceCurrency = parseFloat(((data.amount * feePct) / 100).toFixed(2));

    // Convert $5 minimum fee to source currency
    const minFeeInUsd = 5;
    const minFeeInSource = data.currencyFrom === 'USD'
      ? minFeeInUsd
      : data.currencyFrom === 'GBP'
        ? minFeeInUsd / 1.27 // approx GBP/USD
        : data.currencyFrom === 'KES'
          ? minFeeInUsd * 153 // approx USD/KES
          : data.currencyFrom === 'NGN'
            ? minFeeInUsd * 1550 // approx USD/NGN
            : minFeeInUsd * 15; // approx USD/GHS

    if (feeInSourceCurrency < minFeeInSource) {
      feeInSourceCurrency = parseFloat(minFeeInSource.toFixed(2));
    }

    const totalCharged = parseFloat((data.amount + feeInSourceCurrency).toFixed(2));

    // Convert total to GBP for Paystack (since Paystack is configured for GBP)
    const totalGbp = data.currencyFrom === 'GBP'
      ? totalCharged
      : totalCharged / (FX_RATES_TO_CNY['GBP'] / fxRate); // approximate

    // Generate reference
    const reference = `AFSP-CN-${Date.now()}`;

    // Initialize Paystack transaction
    const email = senderEmail || 'china-corridor@afrispine.com';
    const paystackResult = await initializeTransaction({
      email,
      amount: Math.max(totalGbp, 1), // ensure at least £1
      reference,
      metadata: {
        type: 'china_corridor',
        reference,
        supplierName: data.supplierName,
        purposeOfPayment: data.purposeOfPayment,
        senderId: senderId || '',
        currencyFrom: data.currencyFrom,
        originalAmount: data.amount,
      },
    });

    // Store payment record
    await db.chinaCorridorPayment.create({
      data: {
        reference,
        senderId,
        status: 'pending',
        amountSend: data.amount,
        currencyFrom: data.currencyFrom,
        fxRate,
        cnyAmount,
        feePct,
        feeAmount: feeInSourceCurrency,
        supplierName: data.supplierName,
        supplierBankName: data.supplierBankName,
        supplierAccountNumber: data.supplierAccountNumber,
        supplierBankCode: data.supplierBankCode,
        deliveryMethod: data.deliveryMethod,
        supplierAlipayAccount: data.supplierAlipayAccount || '',
        purposeOfPayment: data.purposeOfPayment,
        invoiceUrl: data.invoiceUrl || null,
        paystackRef: paystackResult.reference,
      },
    });

    return NextResponse.json({
      access_code: paystackResult.access_code,
      reference: paystackResult.reference,
      cnyAmount,
      fee: feeInSourceCurrency,
      fxRate,
      totalCharged,
    });
  } catch (e: any) {
    console.error('[chinaCorridorPay]', e);
    const message = e.message || 'Payment initialization failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}