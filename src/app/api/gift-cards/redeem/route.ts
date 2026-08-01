import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function POST(request: Request) {
  try {
    await ensureDb();

    const body = await request.json();
    const { code, redeemerName, redeemerPhone } = body;

    if (!code || !redeemerName) {
      return NextResponse.json({ error: 'code and redeemerName are required' }, { status: 400 });
    }

    const giftCard = await db.giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { brand: true },
    });

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (giftCard.status !== 'active') {
      return NextResponse.json({ error: `Gift card is ${giftCard.status}`, status: 400 });
    }

    if (giftCard.expiresAt && new Date() > new Date(giftCard.expiresAt)) {
      await db.giftCard.update({
        where: { id: giftCard.id },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 });
    }

    // Redeem the card
    const updated = await db.giftCard.update({
      where: { id: giftCard.id },
      data: {
        status: 'redeemed',
        redeemedAt: new Date(),
        redeemedBy: redeemerName,
        transactions: {
          create: {
            type: 'redeem',
            amount: giftCard.amount,
            currency: giftCard.currency,
            status: 'completed',
            performedBy: redeemerName,
            performedByRole: 'redeemer',
            metadata: JSON.stringify({ redeemerPhone }),
          },
        },
      },
      include: { brand: true, transactions: true },
    });

    return NextResponse.json({ giftCard: updated, message: 'Gift card redeemed successfully' });
  } catch (error: any) {
    console.error('[gift-cards/redeem]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
