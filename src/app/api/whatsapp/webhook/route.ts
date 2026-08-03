import { NextRequest, NextResponse } from 'next/server';
import { optOut } from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/webhook
 *
 * Twilio calls this webhook when a user sends a message to our
 * WhatsApp number. We handle STOP/UNSTOP opt-out compliance.
 *
 * IMPORTANT: In Twilio Console, set this URL as the webhook for
 * incoming WhatsApp messages:
 *   https://www.afri-spine.com/api/whatsapp/webhook
 *
 * No auth required — Twilio sends a signature header that you
 * can validate with twilio.webhook.validateRequest() in production.
 */

const STOP_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
const START_KEYWORDS = ['start', 'yes', 'unstop', 'subscribe'];

export async function POST(req: NextRequest) {
  // 1. Parse Twilio form-encoded body
  const formData = await req.formData();
  const body = Object.fromEntries(formData.entries());

  const fromNumber = (body.From as string || '').replace('whatsapp:', '').trim();
  const bodyText = (body.Body as string || '').trim().toLowerCase();

  if (!fromNumber) {
    return new NextResponse('No sender number', { status: 400 });
  }

  // 2. Handle STOP opt-out
  if (STOP_KEYWORDS.includes(bodyText)) {
    try {
      await optOut(fromNumber);
    } catch (err) {
      console.error('[WhatsApp webhook] optOut failed:', err);
    }
    // Twilio requires this XML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been unsubscribed from AfriSpine WhatsApp notifications. Reply START to re-subscribe.</Message>
</Response>`;
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // 3. Handle START opt-in
  if (START_KEYWORDS.includes(bodyText)) {
    try {
      const { optIn } = await import('@/lib/whatsapp');
      await optIn(fromNumber);
    } catch (err) {
      console.error('[WhatsApp webhook] optIn failed:', err);
    }
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Welcome back! You are now subscribed to AfriSpine WhatsApp notifications.</Message>
</Response>`;
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // 4. Default: ignore other messages (don't reply to avoid spamming)
  return new NextResponse('OK', { status: 200 });
}
