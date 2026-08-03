import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { MERCHANTS } from '@/lib/merchants';

/* Category-based default brand colors */
const CATEGORY_DEFAULT_COLORS: Record<string, string> = {
  Supermarket: '#059669',
  Electronics: '#475569',
  Fashion: '#db2777',
  'Airtime/Telecom': '#ea580c',
  Travel: '#0284c7',
  'Food & Dining': '#e11d48',
  Healthcare: '#0d9488',
  Entertainment: '#7c3aed',
  'E-Commerce': '#059669',
  Utilities: '#6b7280',
  General: '#059669',
};

export async function GET(request: Request) {
  try {
    await ensureDb();

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    /* Fetch ALL verified brands (including inactive — frontend handles gating) */
    const where: any = { isVerified: true };
    if (country && country !== 'all') {
      where.countryCode = country.toUpperCase();
    }

    const brands = await db.giftCardBrand.findMany({
      where,
      orderBy: { brandName: 'asc' },
    });

    /* Check PlatformConfig for admin overrides (disabled / deleted merchants) */
    const overrides = await db.platformConfig.findMany({
      where: {
        OR: [
          { key: { startsWith: 'merchant_disabled_' } },
          { key: { startsWith: 'merchant_deleted_' } },
        ],
      },
    });

    const disabledSlugs = new Set<string>();
    const deletedSlugs = new Set<string>();

    for (const o of overrides) {
      let merchantId = '';
      if (o.key.startsWith('merchant_disabled_')) {
        merchantId = o.key.replace('merchant_disabled_', '');
        if (o.value === 'true') {
          const m = MERCHANTS.find((x) => x.id === merchantId);
          if (m) disabledSlugs.add(m.slug);
        }
      } else if (o.key.startsWith('merchant_deleted_')) {
        merchantId = o.key.replace('merchant_deleted_', '');
        if (o.value === 'true') {
          const m = MERCHANTS.find((x) => x.id === merchantId);
          if (m) deletedSlugs.add(m.slug);
        }
      }
    }

    /* Build response: hide deleted, mark disabled as inactive */
    const result = brands
      .filter((b) => !deletedSlugs.has(b.slug))
      .map((b) => ({
        id: b.id,
        brandName: b.brandName,
        slug: b.slug,
        logoUrl: b.logoUrl,
        country: b.country,
        countryCode: b.countryCode,
        category: b.category,
        description: b.description,
        minAmount: b.minAmount,
        maxAmount: b.maxAmount,
        smartContractAddress: b.smartContractAddress,
        brandColor: b.brandColor || CATEGORY_DEFAULT_COLORS[b.category] || '#059669',
        isActive: b.isActive && !disabledSlugs.has(b.slug),
      }));

    return NextResponse.json({ brands: result });
  } catch (error: any) {
    console.error('[gift-cards/brands]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
