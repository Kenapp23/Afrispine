/**
 * Eversend Webhook Handler
 *
 * Receives and verifies webhook events from Eversend.
 * Handles: collection.completed, collection.failed, payout.completed, payout.failed
 *
 * Security: HMAC-SHA256 signature verification using the webhook secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { EversendClient, EversendError } from '@/lib/eversend';

// Events we care about
const HANDLED_EVENTS = [
  'collection.completed',
  'collection.failed',
  'payout.completed',
  'payout.failed',
];

export async function POST(req: NextRequest) {
  // Step 1: Get raw body (needed for signature verification)
  const rawBody = await req.text();

  // Step 2: Verify signature
  const signature = req.headers.get('eversend-signature') || '';
  if (!signature) {
    console.warn('[webhook/eversend] Missing signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const client = await EversendClient.fromSettings();
  if (!client) {
    console.error('[webhook/eversend] Cannot verify webhook — Eversend client not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  let payload;
  try {
    payload = client.parseWebhook(rawBody, signature);
  } catch (err) {
    console.warn('[webhook/eversend] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Step 3: Process the event
  const { event, data } = payload;

  if (!HANDLED_EVENTS.includes(event)) {
    // Acknowledge but don't process unhandled events
    return NextResponse.json({ received: true, event });
  }

  console.log(`[webhook/eversend] Processing ${event} for ${data.id}`);

  try {
    const { db } = await import('@/lib/db');

    // Update or create a transaction record based on the event
    const existingTx = await db.transfer.findUnique({
      where: { eversendId: data.id },
    });

    const status = data.status || 'unknown';
    const metadata = (data as Record<string, unknown>).metadata as Record<string, string> | undefined;
    const asRef = metadata?.afri_spine_ref || '';

    if (existingTx) {
      // Update existing transaction
      await db.transfer.update({
        where: { eversendId: data.id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
      console.log(`[webhook/eversend] Updated transfer ${existingTx.id} → ${status}`);
    } else if (event.startsWith('collection.')) {
      // Collection event — the sender has been charged
      // We create a transfer record tracking the full flow
      await db.transfer.create({
        data: {
          eversendId: data.id,
          senderId: metadata?.sender_id || null,
          type: 'send',
          status,
          currencySend: (data as Record<string, unknown>).currency as string || 'USD',
          amountSend: Number((data as Record<string, unknown>).amount) || 0,
          reference: asRef,
          metadata: data as Record<string, unknown>,
        },
      });
      console.log(`[webhook/eversend] Created transfer for collection ${data.id}`);
    } else if (event.startsWith('payout.')) {
      // Payout event — the recipient has been paid
      await db.transfer.create({
        data: {
          eversendId: data.id,
          senderId: metadata?.sender_id || null,
          type: 'send',
          status,
          currencySend: (data as Record<string, unknown>).currency as string || 'USD',
          amountSend: Number((data as Record<string, unknown>).amount) || 0,
          reference: asRef,
          metadata: data as Record<string, unknown>,
        },
      });
      console.log(`[webhook/eversend] Created transfer for payout ${data.id}`);
    }
  } catch (dbErr) {
    console.error('[webhook/eversend] DB error:', dbErr);
    // Still return 200 to prevent Eversend from retrying
  }

  // Always return 200 quickly to prevent retries
  return NextResponse.json({ received: true, event, id: data.id });
}
