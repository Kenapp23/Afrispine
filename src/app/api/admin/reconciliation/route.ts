/**
 * Admin Ledger Reconciliation API
 *
 * GET: Return reconciliation summary. Admin only.
 *   - Total ticket sales, creator payouts, platform fees
 *   - Per-creator breakdown (ledger credits - debits vs balanceKes)
 *   - Recent ledger entries (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    // Aggregate totals by entry type
    const totals = await db.ledgerEntry.groupBy({
      by: ['entryType', 'direction'],
      _sum: { amountKes: true },
    });

    let totalTicketSales = 0;
    let totalCreatorPayouts = 0;
    let totalPlatformFees = 0;

    for (const row of totals) {
      const amount = row._sum.amountKes ?? 0;
      if (row.entryType === 'ticket_sale' && row.direction === 'credit') {
        totalTicketSales += amount;
      }
      if (row.entryType === 'creator_payout' && row.direction === 'debit') {
        totalCreatorPayouts += amount;
      }
      if (row.entryType === 'platform_fee' && row.direction === 'credit') {
        totalPlatformFees += amount;
      }
    }

    // Per-creator breakdown: sum credits - debits from ledger
    const creatorAggregates = await db.ledgerEntry.groupBy({
      by: ['creatorId'],
      where: { creatorId: { not: null } },
      _sum: { amountKes: true },
      having: { creatorId: { not: null } },
    });

    // We need per-direction sums — fetch separately
    const creatorCredits = await db.ledgerEntry.groupBy({
      by: ['creatorId'],
      where: { creatorId: { not: null }, direction: 'credit' },
      _sum: { amountKes: true },
    });

    const creatorDebits = await db.ledgerEntry.groupBy({
      by: ['creatorId'],
      where: { creatorId: { not: null }, direction: 'debit' },
      _sum: { amountKes: true },
    });

    const creditMap = new Map<string, number>();
    for (const row of creatorCredits) {
      if (row.creatorId) creditMap.set(row.creatorId, row._sum.amountKes ?? 0);
    }

    const debitMap = new Map<string, number>();
    for (const row of creatorDebits) {
      if (row.creatorId) debitMap.set(row.creatorId, row._sum.amountKes ?? 0);
    }

    // Get all unique creator IDs
    const allCreatorIds = new Set<string>([...creditMap.keys(), ...debitMap.keys()]);

    // Fetch current balanceKes for those creators
    const creators = await db.creatorProfile.findMany({
      where: { id: { in: [...allCreatorIds] } },
      select: { id: true, stageName: true, handle: true, balanceKes: true },
    });

    const creatorMap = new Map(creators.map((c) => [c.id, c]));

    const perCreatorBreakdown = [...allCreatorIds].map((cid) => {
      const credits = creditMap.get(cid) ?? 0;
      const debits = debitMap.get(cid) ?? 0;
      const ledgerBalance = Math.round((credits - debits) * 100) / 100;
      const creator = creatorMap.get(cid);
      return {
        creatorId: cid,
        stageName: creator?.stageName ?? null,
        handle: creator?.handle ?? null,
        ledgerBalance,
        profileBalanceKes: creator?.balanceKes ?? 0,
        discrepancy: Math.round((ledgerBalance - (creator?.balanceKes ?? 0)) * 100) / 100,
      };
    });

    // Recent ledger entries (paginated)
    const [entries, totalEntries] = await Promise.all([
      db.ledgerEntry.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          creator: {
            select: { stageName: true, handle: true },
          },
        },
      }),
      db.ledgerEntry.count(),
    ]);

    return NextResponse.json({
      totals: {
        totalTicketSales,
        totalCreatorPayouts,
        totalPlatformFees,
      },
      perCreatorBreakdown,
      recentEntries: entries,
      pagination: {
        page,
        pageSize,
        total: totalEntries,
        totalPages: Math.ceil(totalEntries / pageSize),
      },
    });
  } catch (err) {
    console.error('[admin/reconciliation] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
