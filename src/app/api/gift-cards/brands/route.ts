import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
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

/**
 * Build brand objects from the in-memory MERCHANTS array.
 * Used as fallback when the database is unreachable.
 */
function merchantsToBrands(country?: string | null) {
  const filtered = country && country !== 'all'
    ? MERCHANTS.filter((m) => m.countryCode === country.toUpperCase())
    : MERCHANTS;

  return filtered.map((m) => ({
    id: m.id,
    brandName: m.name,
    slug: m.slug,
    logoUrl: m.logoUrl,
    country: m.country,
    countryCode: m.countryCode,
    category: m.category,
    description: m.description,
    minAmount: 5,
    maxAmount: 500,
    smartContractAddress: null,
    brandColor: CATEGORY_DEFAULT_COLORS[m.category] || '#059669',
    isActive: m.isActive,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  /* ── Database unreachable? Return in-memory fallback ─────── */
  if (!dbReady) {
    console.warn('[gift-cards/brands] DB not ready — serving brands from in-memory MERCHANTS fallback');
    const brands = merchantsToBrands(country);
    return NextResponse.json({ brands, _fallback: true });
  }

  try {
    await ensureDb();

    /* Fetch ALL verified brands (including inactive — frontend handles gating) */
    const where: any = { isVerified: true };
    if (country && country !== 'all') {
      where.countryCode = country.toUpperCase();
    }

    /* Only select columns that definitely exist in the DB. */
    const brands = await db.giftCardBrand.findMany({
      where,
      orderBy: { brandName: 'asc' },
      select: {
        id: true,
        brandName: true,
        slug: true,
        logoUrl: true,
        country: true,
        countryCode: true,
        category: true,
        description: true,
        isActive: true,
        minAmount: true,
        maxAmount: true,
        smartContractAddress: true,
      },
    });

    /* If DB is empty (0 brands), fall back to in-memory data */
    if (brands.length === 0) {
      console.warn('[gift-cards/brands] DB returned 0 brands — serving from in-memory MERCHANTS fallback');
      const fallback = merchantsToBrands(country);
      return NextResponse.json({ brands: fallback, _fallback: true });
    }

    /* Check PlatformConfig for admin overrides. If this fails,
       just show all brands as active — don't crash the whole page. */
    let disabledSlugs = new Set<string>();
    let deletedSlugs = new Set<string>();
    try {
      const overrides = await db.platformConfig.findMany({
        where: {
          OR: [
            { key: { startsWith: 'merchant_disabled_' } },
            { key: { startsWith: 'merchant_deleted_' } },
          ],
        },
      });
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
    } catch (e) {
      console.warn('[gift-cards/brands] PlatformConfig check failed, showing all brands as active:', e);
    }

    /* Build response */
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
        brandColor: CATEGORY_DEFAULT_COLORS[b.category] || '#059669',
        isActive: b.isActive && !disabledSlugs.has(b.slug),
      }));

    return NextResponse.json({ brands: result });
  } catch (error: any) {
    console.error('[gift-cards/brands] DB error — falling back to in-memory MERCHANTS:', error.message);
    const brands = merchantsToBrands(country);
    return NextResponse.json({ brands, _fallback: true });
  }
}
