import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import type { DigestFrequency, MarketFocus } from '@/lib/digest';

const VALID_FREQUENCIES: DigestFrequency[] = ['weekly', 'daily'];
const VALID_MARKETS: MarketFocus[] = ['KE', 'NG', 'GH', 'ZA', 'all'];

const COUNTRY_LABELS: Record<string, string> = {
  KE: 'Kenya',
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
  all: 'All Markets',
};

export async function POST(req: NextRequest) {
  try {
    const sender = await requireSenderAuth(req);

    const body = await req.json();
    const { frequency, marketFocus, whatsappOptIn } = body as {
      frequency?: string;
      marketFocus?: string;
      whatsappOptIn?: boolean;
    };

    // Validate frequency
    const freq = (frequency || 'weekly') as DigestFrequency;
    if (!VALID_FREQUENCIES.includes(freq)) {
      return NextResponse.json(
        { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate market focus
    const market = (marketFocus || 'KE') as MarketFocus;
    if (!VALID_MARKETS.includes(market)) {
      return NextResponse.json(
        { error: `Invalid market focus. Must be one of: ${VALID_MARKETS.join(', ')}` },
        { status: 400 },
      );
    }

    // Daily digest requires Pro subscription
    if (freq === 'daily') {
      const subscription = await db.senderSubscription.findUnique({
        where: { senderId: sender.id },
      });

      const isPro =
        subscription?.plan === 'pro' &&
        subscription?.status === 'active' &&
        subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) > new Date();

      if (!isPro) {
        return NextResponse.json(
          { error: 'Daily digest is only available for Pro subscribers. Upgrade to Pro for daily market updates.' },
          { status: 403 },
        );
      }
    }

    // Get sender email
    const senderRecord = await db.sender.findUnique({
      where: { id: sender.id },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!senderRecord) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // Upsert subscription
    const digestSub = await db.digestSubscription.upsert({
      where: { senderId: sender.id },
      create: {
        senderId: sender.id,
        email: senderRecord.email,
        frequency: freq,
        marketFocus: market,
        whatsappOptIn: whatsappOptIn === true,
        isActive: true,
        isPro: freq === 'daily',
      },
      update: {
        frequency: freq,
        marketFocus: market,
        whatsappOptIn: whatsappOptIn === true,
        isActive: true,
        isPro: freq === 'daily',
      },
    });

    console.log(`[digest/subscribe] ${sender.email} subscribed (${freq}, ${market})`);

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${freq} digest for ${COUNTRY_LABELS[market] || market} market`,
      subscription: {
        id: digestSub.id,
        frequency: digestSub.frequency,
        marketFocus: digestSub.marketFocus,
        whatsappOptIn: digestSub.whatsappOptIn,
        isActive: digestSub.isActive,
        joinedAt: digestSub.joinedAt,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[digest/subscribe]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}