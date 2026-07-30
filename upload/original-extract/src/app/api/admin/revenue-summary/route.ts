import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminAuth } from '@/lib/admin-auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Current month fees collected (transactions that reached payment/delivery)
    const feesResult = await db.transaction.aggregate({
      where: {
        status: { in: ['delivered', 'processing', 'payment_confirmed'] },
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        feeConfirmed: true,
      },
      _sum: { feeAmount: true, totalCharged: true, amountSend: true },
      _count: true,
    });

    // Settled fees (transactions that are fully delivered)
    const settledResult = await db.transaction.aggregate({
      where: {
        status: { in: ['delivered'] },
        createdAt: { gte: startOfMonth, lt: endOfMonth },
      },
      _sum: { feeAmount: true },
      _count: true,
    });

    return NextResponse.json({
      totalFees: feesResult._sum.feeAmount || 0,
      totalVolume: feesResult._sum.amountSend || 0,
      transactionCount: feesResult._count || 0,
      totalCharged: feesResult._sum.totalCharged || 0,
      settledFees: settledResult._sum.feeAmount || 0,
      settledCount: settledResult._count || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});