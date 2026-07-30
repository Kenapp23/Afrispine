import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  try {
    const totalInvestors = await db.investmentAccount.count();
    const totalOrders = await db.investmentOrder.count();
    const filledOrders = await db.investmentOrder.findMany({
      where: { status: 'filled' },
    });
    const totalAum = filledOrders.reduce(
      (sum, o) => sum + (o.totalChargedUsd || 0),
      0,
    );

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const monthOrders = await db.investmentOrder.findMany({
      where: { createdAt: { gte: startOfMonth } },
    });
    const revenueThisMonth = monthOrders.reduce(
      (sum, o) => sum + (o.tradingFeeGbp || 0) + (o.fxFeeGbp || 0),
      0,
    );

    return NextResponse.json({
      totalAum,
      totalInvestors,
      totalOrders,
      revenueThisMonth,
    });
  } catch (error) {
    console.error('[Admin Wealth Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wealth stats' },
      { status: 500 },
    );
  }
}