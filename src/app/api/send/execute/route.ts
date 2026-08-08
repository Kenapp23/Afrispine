/**
 * Send Money — Execute Payout
 *
 * Called after collection completes (via webhook or polling).
 * Creates a payout to deliver funds to the recipient.
 * Uses the payment adapter for provider-agnostic execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { getProvider } from '@/lib/payments/adapter';
import { RAIL_MAP, COUNTRY_CURRENCY } from '@/lib/eversend';

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

    const provider = await getProvider();
    if (!provider) {
      return NextResponse.json({ error: 'Payment processor not configured.' }, { status: 503 });
    }

    const destCurrency = COUNTRY_CURRENCY[recipientCountry] || receiveCurrency;
    const eversendRail = RAIL_MAP[rail] || rail;

    // Execute payout via the adapter
    const payout = await provider.executePayout({
      amount: Number(receiveAmount || amount),
      currency: destCurrency,
      rail: eversendRail,
      phone: recipientPhone,
      bankCode,
      accountNumber,
      accountName,
      metadata: {
        afri_spine_ref: reference || '',
        collection_id: collectionId,
        recipient_name: recipientName || '',
      },
      idempotencyKey: reference || `as_pay_${Date.now()}`,
    });

    // Update the Transaction record with the payout provider ID
    if (dbReady && reference) {
      try {
        await db.transaction.update({
          where: { reference },
          data: { eversendId: payout.providerId },
        });
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      payoutId: payout.providerId,
      status: payout.status,
      amount: payout.amount,
      currency: payout.currency,
      rail: payout.rail,
      reference: payout.reference || payout.providerId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to execute transfer.';
    console.error('[send/execute] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
