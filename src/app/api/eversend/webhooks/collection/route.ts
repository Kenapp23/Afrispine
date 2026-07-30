import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/lib/credential-store';
import { verifyWebhookSignature } from '@/lib/services/eversend';

const ALLOWED_EVENTS = ['collection.completed', 'collection.failed'] as const;

export async function POST(req: NextRequest) {
  try {
    // Validate Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Get webhook secret from credentials
    const credential = await getCredential('eversend');
    if (!credential?.secretKey) {
      console.error('[Eversend Collection Webhook] No webhook secret configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify signature
    const signature = req.headers.get('x-eversend-signature');
    if (!signature || !verifyWebhookSignature(rawBody, signature, credential.secretKey)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Parse body
    const body = JSON.parse(rawBody);
    const { event, data } = body;

    if (!ALLOWED_EVENTS.includes(event)) {
      console.warn(`[Eversend Collection Webhook] Unknown event: ${event}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Eversend Collection Webhook] ${event}`, {
      id: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      phone: data.phone,
      reference: data.reference,
      fees: data.fees,
      createdAt: data.createdAt,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Eversend Collection Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
