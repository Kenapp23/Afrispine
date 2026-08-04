import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { error, res } = await requireAdmin(request);
    if (error) return res!;

    const brands = await db.giftCardBrand.findMany({
      orderBy: { brandName: 'asc' },
      select: {
        id: true,
        brandName: true,
        slug: true,
        logoUrl: true,
        website: true,
        countryCode: true,
        category: true,
        isActive: true,
      },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('[admin/gift-cards/brands/logo-capture GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureDb();
    const { error, res } = await requireAdmin(request);
    if (error) return res!;

    const body = await request.json();
    const { id, website, logoUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brand id is required' }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (website !== undefined) updateData.website = website;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updated = await db.giftCardBrand.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        brandName: true,
        slug: true,
        logoUrl: true,
        website: true,
        countryCode: true,
        category: true,
        isActive: true,
      },
    });

    return NextResponse.json({ brand: updated });
  } catch (error: any) {
    console.error('[admin/gift-cards/brands/logo-capture PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
