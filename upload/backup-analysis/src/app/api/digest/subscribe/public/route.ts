import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/digest/subscribe/public — public digest website subscription (no auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, country, marketFocus, whatsappOptIn } = body as {
      email?: string;
      firstName?: string;
      country?: string;
      marketFocus?: string;
      whatsappOptIn?: boolean;
    };

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Check if already subscribed and active
    const existing = await db.digestSubscription.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json({
        message: 'Already subscribed',
        subscriptionId: existing.id,
      });
    }

    // Create new subscription (no senderId — website subscriber)
    const subscription = await db.digestSubscription.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: firstName || '',
        country: country || '',
        marketFocus: marketFocus || 'all',
        whatsappOptIn: whatsappOptIn === true,
        frequency: 'weekly',
        isActive: true,
        isPro: false,
        source: 'digest_website',
      },
    });

    console.log(
      `[digest/subscribe/public] New subscriber: ${email} from ${country || 'unknown'}`,
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to the AfriSpine Digest',
        subscriptionId: subscription.id,
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error('[digest/subscribe/public]', e);

    // Handle unique constraint violation for email+senderId (SQLite)
    if (e.code === 'P2002') {
      return NextResponse.json({
        message: 'Already subscribed',
        subscriptionId: null,
      });
    }

    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}