import { NextRequest, NextResponse } from 'next/server';
import { EversendClient, EversendError, RAIL_MAP, COUNTRY_CURRENCY } from '@/lib/eversend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collectionId,
      amount,
      receiveAmount,
      receiveCurrency,
      recipientPhone,
      recipientName,
      recipientCountry,
      rail,
      bankCode,
      accountNumber,
      accountName,
      reference,
    } = body;

    if (!collectionId || !amount || !receiveCurrency || !recipientCountry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await EversendClient.fromSettings();
    if (!client) {
      return NextResponse.json({ error: 'Payment processor not configured.' }, { status: 503 });
    }

    const destCurrency = COUNTRY_CURRENCY[recipientCountry] || receiveCurrency;
    const eversendRail = RAIL_MAP[rail] || rail;

    // Step 2: Create payout (deliver to recipient)
    const payout = await client.createPayout({
      amount: Number(receiveAmount || amount),
      currency: destCurrency,
      rail: eversendRail,
      phone: recipientPhone,
      bankCode,
      accountNumber,
      accountName,
      fund: 'stablecoin',
      metadata: {
        afri_spine_ref: reference || '',
        collection_id: collectionId,
        recipient_name: recipientName || '',
      },
      idempotencyKey: reference || `as_pay_${Date.now()}`,
    });

    return NextResponse.json({
      payoutId: payout.id,
      status: payout.status,
      amount: payout.amount,
      currency: payout.currency,
      rail: payout.rail,
      reference: payout.reference || payout.id,
    });
  } catch (err) {
    if (err instanceof EversendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[send/execute] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to execute transfer.' }, { status: 500 });
  }
}
