import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  const where: any = {};
  if (type === 'pending') where.kybStatus = 'pending';
  if (type === 'approved') where.kybStatus = 'approved';
  if (type === 'rejected') where.kybStatus = 'rejected';

  const [accounts, transactions, pendingCount, approvedCount, totalTxCount] =
    await Promise.all([
      db.businessAccount.findMany({
        where: type === 'all' ? undefined : where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.businessTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { businessAccount: { select: { companyName: true } } },
      }),
      db.businessAccount.count({ where: { kybStatus: 'pending' } }),
      db.businessAccount.count({ where: { kybStatus: 'approved' } }),
      db.businessTransaction.count(),
    ]);

  // Compute transaction counts per account
  const txCounts = await db.businessTransaction.groupBy({
    by: ['businessAccountId'],
    _count: { id: true },
  });
  const txCountMap = new Map(txCounts.map((t) => [t.businessAccountId, t._count.id]));

  // Revenue summary from business transactions
  const revenueRows = await db.businessTransaction.findMany({
    where: { status: { in: ['settled', 'delivered', 'completed'] } },
    select: {
      sellAmount: true,
      marginAmount: true,
    },
  });
  const totalVolume = revenueRows.reduce((s, r) => s + r.sellAmount, 0);
  const totalMargin = revenueRows.reduce((s, r) => s + r.marginAmount, 0);

  return NextResponse.json({
    accounts,
    transactions,
    pendingCount,
    approvedCount,
    totalTxCount,
    txCountMap: Object.fromEntries(txCountMap),
    revenue: {
      totalVolume,
      totalMargin,
      transactionCount: revenueRows.length,
      avgDealSize: revenueRows.length > 0 ? totalVolume / revenueRows.length : 0,
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const body = await req.json();
  const { id, kybStatus, feePct, dailyLimitUsd, accountStatus } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await db.businessAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const updateData: any = {};
  if (kybStatus) updateData.kybStatus = kybStatus;
  if (feePct !== undefined) updateData.feePct = feePct;
  if (dailyLimitUsd !== undefined) updateData.dailyLimitUsd = dailyLimitUsd;
  if (accountStatus) updateData.accountStatus = accountStatus;
  if (kybStatus === 'approved') {
    updateData.kybReviewedAt = new Date();
    updateData.kybReviewedById = auth.admin?.id || '';
    updateData.kybReviewedByName = auth.admin?.email || '';
    if (!accountStatus) updateData.accountStatus = 'active';
  }
  if (kybStatus === 'rejected') {
    updateData.kybReviewedAt = new Date();
    updateData.kybReviewedById = auth.admin?.id || '';
    updateData.kybReviewedByName = auth.admin?.email || '';
    if (!accountStatus) updateData.accountStatus = 'rejected';
  }

  const account = await db.businessAccount.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ account });
}