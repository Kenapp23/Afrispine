import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { MERCHANTS } from '@/lib/merchants';
import type { Merchant } from '@/lib/merchants';

// Ensure DB schema exists
import '@/lib/ensure-db';

/**
 * GET /api/merchants?country=KE
 *
 * Public endpoint — returns only active, non-disabled, non-deleted merchants.
 * Used by the gifts hub and other user-facing pages.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');

  await ensureDb();

  // Fetch all merchant overrides in a single query
  const configs = await db.platformConfig.findMany({
    where: {
      OR: [
        { key: { startsWith: 'merchant_disabled_' } },
        { key: { startsWith: 'merchant_deleted_' } },
      ],
    },
  });

  const disabledIds = new Set<string>();
  const deletedIds = new Set<string>();

  for (const c of configs) {
    if (c.value !== 'true') continue;
    if (c.key.startsWith('merchant_disabled_')) {
      disabledIds.add(c.key.replace('merchant_disabled_', ''));
    } else if (c.key.startsWith('merchant_deleted_')) {
      deletedIds.add(c.key.replace('merchant_deleted_', ''));
    }
  }

  let results: Merchant[] = MERCHANTS.filter((m) => {
    // Must be active in static data
    if (!m.isActive) return false;
    // Must not be disabled by admin
    if (disabledIds.has(m.id)) return false;
    // Must not be deleted by admin
    if (deletedIds.has(m.id)) return false;
    return true;
  });

  // Filter by country if provided
  if (country) {
    results = results.filter(
      (m) => m.countryCode.toUpperCase() === country.toUpperCase(),
    );
  }

  return NextResponse.json({ merchants: results, total: results.length });
}
