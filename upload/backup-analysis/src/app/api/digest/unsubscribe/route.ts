import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/digest/unsubscribe — works without auth (for email links) or with auth
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Find and deactivate subscription
    const subscription = await db.digestSubscription.findFirst({
      where: { email: email.toLowerCase().trim(), isActive: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active digest subscription found for this email' }, { status: 404 });
    }

    await db.digestSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false },
    });

    console.log(`[digest/unsubscribe] ${email} unsubscribed from digest`);

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from the AfriSpine Digest.',
    });
  } catch (e: any) {
    console.error('[digest/unsubscribe]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/digest/unsubscribe — supports one-click unsubscribe via email link
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email || !email.includes('@')) {
      return new Response('Missing or invalid email parameter.', { status: 400 });
    }

    const subscription = await db.digestSubscription.findFirst({
      where: { email: email.toLowerCase().trim(), isActive: true },
    });

    if (!subscription) {
      return new Response(generateUnsubscribePage('No active subscription found', false), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    await db.digestSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false },
    });

    console.log(`[digest/unsubscribe] ${email} unsubscribed via GET link`);

    return new Response(generateUnsubscribePage('You have been successfully unsubscribed', true), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e: any) {
    console.error('[digest/unsubscribe]', e);
    return new Response('An error occurred. Please try again later.', { status: 500 });
  }
}

function generateUnsubscribePage(message: string, success: boolean): string {
  const color = success ? '#10b981' : '#ef4444';
  const icon = success ? '✓' : '✗';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AfriSpine Digest — Unsubscribe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
    .card { background: #fff; border-radius: 12px; padding: 40px; text-align: center; max-width: 420px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; color: ${color}; margin-bottom: 16px; }
    h1 { margin: 0 0 8px; font-size: 22px; color: #1f2937; }
    p { margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.5; }
    a { display: inline-block; padding: 10px 24px; background: #10b981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
    a:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>AfriSpine Digest</h1>
    <p>${message}.</p>
    ${success ? '<a href="https://afri-spine.com">Back to AfriSpine</a>' : ''}
  </div>
</body>
</html>`;
}