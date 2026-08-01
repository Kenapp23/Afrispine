import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { error, res, admin } = await requireAdmin(request);
    if (error) return res!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const brandId = searchParams.get('brandId');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (brandId) where.brandId = brandId;

    const giftCards = await db.giftCard.findMany({
      where,
      include: { brand: true },
      orderBy: { purchasedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ giftCards });
  } catch (error: any) {
    console.error('[admin/gift-cards]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
