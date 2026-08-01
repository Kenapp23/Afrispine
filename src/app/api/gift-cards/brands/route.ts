import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(request: Request) {
  try {
    await ensureDb();

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    const where: any = { isVerified: true, isActive: true };
    if (country && country !== 'all') {
      where.countryCode = country.toUpperCase();
    }

    const brands = await db.giftCardBrand.findMany({
      where,
      orderBy: { brandName: 'asc' },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('[gift-cards/brands]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
