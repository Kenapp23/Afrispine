import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const sub = await db.senderSubscription.findUnique({ where: { senderId: sender.id } });
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });

  // Downgrade to free at end of period
  await db.senderSubscription.update({
    where: { id: sub.id },
    data: { plan: 'free', status: 'cancelled' },
  });

  return NextResponse.json({ success: true, message: 'Subscription will be cancelled at end of billing period' });
}