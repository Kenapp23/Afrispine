import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

// Get current subscription status
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const sub = await db.senderSubscription.findUnique({
    where: { senderId: sender.id },
  });

  // Check if subscription has expired
  if (sub && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    // Auto-downgrade
    await db.senderSubscription.update({
      where: { id: sub.id },
      data: { status: 'expired', plan: 'free' },
    });
    return NextResponse.json({
      plan: 'free',
      feePct: parseFloat(process.env.FEE_STANDARD_PCT || '1.5'),
      rateLockMinutes: parseInt(process.env.RATE_LOCK_FREE_MIN || '15'),
      rateAlerts: false,
      subscription: { ...sub, status: 'expired', plan: 'free' },
    });
  }

  const isPro = sub?.plan === 'pro' && sub?.status === 'active';
  return NextResponse.json({
    plan: isPro ? 'pro' : 'free',
    feePct: isPro ? parseFloat(process.env.FEE_PRO_PCT || '0.75') : parseFloat(process.env.FEE_STANDARD_PCT || '1.5'),
    rateLockMinutes: isPro ? parseInt(process.env.RATE_LOCK_PRO_MIN || '30') : parseInt(process.env.RATE_LOCK_FREE_MIN || '15'),
    rateAlerts: isPro,
    subscription: sub,
  });
}

// Subscribe to Pro plan
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const senderRecord = await db.sender.findUnique({ where: { id: sender.id } });
  if (!senderRecord) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

  const proPrice = parseFloat(process.env.PRO_MONTHLY_PRICE_GBP || '4.99');

  const reference = `AFSP-PRO-${sender.id}-${Date.now()}`;

  const result = await initializeTransaction({
    email: senderRecord.email,
    amount: proPrice,
    reference,
    metadata: {
      type: 'pro_subscription',
      senderId: sender.id,
      plan: 'pro',
    },
  });

  return NextResponse.json({ access_code: result.access_code, reference });
}