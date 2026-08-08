/**
 * Mock Payment Complete
 *
 * Simulates a user completing a mock payment.
 * GET /api/webhooks/mock/complete?ref=XXX
 *
 * SECURITY: This endpoint is ONLY active when payment_provider is 'mock'.
 * When payment_provider=eversend, this endpoint returns 404 to prevent
 * fake-completing real transactions.
 *
 * 1. Reads payment_provider setting — returns 404 if 'eversend'
 * 2. Calls MockProvider.simulateWebhook(ref) to generate a webhook payload
 * 3. Processes the payload (updates Transaction/BillPayment status)
 * 4. Redirects the user back to the app with status=processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { MockProvider } from '@/lib/payments/adapter';
import { processWebhookPayload } from '@/lib/payments/webhook-processor';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  // ── Gate: block when not in mock mode ──────────────────────────────
  if (dbReady) {
    try {
      const setting = await db.platformSetting.findUnique({ where: { key: 'payment_provider' } });
      const provider = setting?.value || 'mock';
      if (provider === 'eversend') {
        // In live mode this endpoint must not exist — return 404, not 403,
        // so attackers can't even discover it.
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch {
      // If DB is unreadable, be safe and deny
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  const ref = req.nextUrl.searchParams.get('ref');

  if (!ref) {
    return new NextResponse('Missing ref parameter', { status: 400 });
  }

  // Get the mock provider and simulate webhook
  const mock = new MockProvider();
  const payload = mock.simulateWebhook(ref);

  // Process the webhook payload (shared logic)
  await processWebhookPayload(payload);

  // Determine redirect target based on event type
  const isBill = payload.event === 'collection.completed' || payload.event === 'collection.failed';

  // Check if this was a bill payment by looking at the metadata
  const isBillPayment = isBill && (
    (payload.data.metadata as Record<string, string> | undefined)?.purpose === 'bill_payment' ||
    (payload.data.metadata as Record<string, string> | undefined)?.bill_type
  );

  const status = payload.event.includes('failed') ? 'failed' : 'processing';
  const view = isBillPayment ? 'bills' : 'dashboard';

  // Redirect back to the app
  const redirectUrl = `/?view=${view}&status=${status}&ref=${encodeURIComponent(ref)}`;

  // Return HTML that redirects the user
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Processing...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; }
    h2 { color: #111827; margin: 0 0 8px; }
    p { color: #6b7280; margin: 0; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Payment ${status === 'failed' ? 'Failed' : 'Received'}</h2>
    <p>Redirecting you back...</p>
  </div>
  <script>window.location.href = "${redirectUrl}";</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}