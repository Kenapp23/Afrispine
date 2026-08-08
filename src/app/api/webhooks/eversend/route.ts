/**
 * Eversend Webhook Handler
 *
 * Receives and verifies webhook events from Eversend.
 * Handles: collection.completed, collection.failed, payout.completed, payout.failed
 *
 * Security: HMAC-SHA256 signature verification using the webhook secret.
 * Idempotency: terminal-state guard prevents re-processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProvider, ProviderInitializationError } from '@/lib/payments/adapter';
import { isHandledEvent, processWebhookPayload } from '@/lib/payments/webhook-processor';

export async function POST(req: NextRequest) {
  // Step 1: Get raw body (needed for signature verification)
  const rawBody = await req.text();
  const signature = req.headers.get('eversend-signature') || '';

  // Step 2: Verify signature via the provider
  let provider;
  try {
    provider = await getProvider();
  } catch (err) {
    if (err instanceof ProviderInitializationError) {
      console.error('[webhook/eversend] Provider misconfigured:', err.message);
      return NextResponse.json({ error: 'Provider misconfigured' }, { status: 503 });
    }
    console.error('[webhook/eversend] Failed to get provider');
    return NextResponse.json({ error: 'Provider error' }, { status: 503 });
  }

  if (!provider) {
    console.error('[webhook/eversend] No provider available');
    return NextResponse.json({ error: 'No provider' }, { status: 503 });
  }

  let payload;
  try {
    payload = provider.verifyWebhook(rawBody, signature);
  } catch (err) {
    console.warn('[webhook/eversend] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Step 3: Check if we handle this event
  if (!isHandledEvent(payload.event)) {
    return NextResponse.json({ received: true, event: payload.event });
  }

  // Step 4: Process the event (shared logic)
  const result = await processWebhookPayload(payload);

  // Always return 200 to prevent retries
  return NextResponse.json({
    received: true,
    event: result.event,
    id: result.id,
  });
}
