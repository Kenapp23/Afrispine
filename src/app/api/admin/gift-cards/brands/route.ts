import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { error, res } = await requireAdmin(request);
    if (error) return res!;

    const { searchParams } = new URL(request.url);
    const kycStatus = searchParams.get('kycStatus');
    const country = searchParams.get('country');

    const where: any = {};
    if (kycStatus && kycStatus !== 'all') where.kycStatus = kycStatus;
    if (country && country !== 'all') where.countryCode = country.toUpperCase();

    const brands = await db.giftCardBrand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        brandName: true,
        slug: true,
        logoUrl: true,
        country: true,
        countryCode: true,
        category: true,
        kycStatus: true,
        isVerified: true,
        isActive: true,
        smartContractHash: true,
        smartContractAddress: true,
        createdAt: true,
        _count: { select: { giftCards: true } },
      },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('[admin/gift-cards/brands]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
