import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireSenderAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDb();
    const sender = await requireSenderAuth(request);

    const giftCards = await db.giftCard.findMany({
      where: { senderId: sender.id },
      include: { brand: true },
      orderBy: { purchasedAt: 'desc' },
    });

    return NextResponse.json({ giftCards });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[gift-cards/my]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
