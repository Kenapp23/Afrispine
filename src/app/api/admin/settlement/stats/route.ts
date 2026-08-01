import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(req: NextRequest) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  try {
    const completed = await db.settlementTransaction.aggregate({
      where: { status: 'completed' },
      _sum: { grossAmountUsd: true, afriSpineFeeUsd: true, partnerFeeUsd: true, netAssetUsd: true },
      _count: true,
    });

    const pending = await db.settlementTransaction.count({ where: { status: 'pending' } });
    const failed = await db.settlementTransaction.count({ where: { status: 'failed' } });

    const statusCounts = await db.settlementTransaction.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSettled: completed._count || 0,
        totalGrossUsd: completed._sum.grossAmountUsd || 0,
        totalAfriSpineFees: completed._sum.afriSpineFeeUsd || 0,
        totalPartnerFees: completed._sum.partnerFeeUsd || 0,
        totalNetToBroker: completed._sum.netAssetUsd || 0,
        pendingCount: pending,
        failedCount: failed,
        statusBreakdown: statusCounts.map(s => ({ status: s.status, count: s._count })),
      },
    });
  } catch (e: any) {
    console.error('[settlement/stats]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
