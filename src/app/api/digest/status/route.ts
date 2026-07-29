import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// GET /api/digest/status — check current subscription status
export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const subscription = await db.digestSubscription.findUnique({
      where: { senderId: sender.id },
    });

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        frequency: null,
        marketFocus: null,
        whatsappOptIn: false,
        isActive: false,
        message: 'You are not subscribed to the AfriSpine Digest.',
      });
    }

    return NextResponse.json({
      subscribed: true,
      frequency: subscription.frequency,
      marketFocus: subscription.marketFocus,
      whatsappOptIn: subscription.whatsappOptIn,
      isActive: subscription.isActive,
      isPro: subscription.isPro,
      joinedAt: subscription.joinedAt,
      lastSentAt: subscription.lastSentAt,
      message: subscription.isActive
        ? `You are subscribed to the ${subscription.frequency} digest for ${subscription.marketFocus} market.`
        : 'Your digest subscription is inactive. Subscribe again to re-activate.',
    });
  } catch (e: any) {
    console.error('[digest/status]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}