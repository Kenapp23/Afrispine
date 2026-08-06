import { NextRequest, NextResponse } from 'next/server';
import { EversendClient, EversendError, SENDER_CURRENCY_MAP, RAIL_MAP, COUNTRY_CURRENCY } from '@/lib/eversend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, sendCurrency, receiveCurrency, recipientPhone, recipientName, recipientCountry, rail, senderEmail } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!sendCurrency || !receiveCurrency) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }
    if (!recipientPhone && !recipientCountry) {
      return NextResponse.json({ error: 'Recipient phone and country are required' }, { status: 400 });
    }

    // Get Eversend client
    const client = await EversendClient.fromSettings();
    if (!client) {
      return NextResponse.json({
        error: 'Payment processor not configured. Please contact support.',
      }, { status: 503 });
    }

    // Step 1: Create collection (charge the sender)
    const collection = await client.createCollection({
      amount: Number(amount),
      currency: SENDER_CURRENCY_MAP[sendCurrency] || sendCurrency,
      method: 'card',
      email: senderEmail,
      country: 'GB', // Sender is always in a diaspora market
      metadata: {
        afri_spine_ref: body.reference || '',
        recipient_country: recipientCountry || '',
        receive_currency: receiveCurrency,
      },
      idempotencyKey: body.reference || `as_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });

    return NextResponse.json({
      collectionId: collection.id,
      status: collection.status,
      checkoutUrl: collection.checkoutUrl,
      reference: collection.reference || collection.id,
    });
  } catch (err) {
    if (err instanceof EversendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[send/initialize] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to initialize transfer. Please try again.' }, { status: 500 });
  }
}
