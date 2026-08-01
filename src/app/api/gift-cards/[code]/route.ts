import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await ensureDb();
    const { code } = await params;

    const giftCard = await db.giftCard.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { brand: true, transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    return NextResponse.json({ giftCard });
  } catch (error: any) {
    console.error('[gift-cards/code]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
