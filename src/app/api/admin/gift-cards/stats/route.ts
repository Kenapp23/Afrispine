import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDb();
    const { error, res, admin } = await requireAdmin(request);
    if (error) return res!;

    const totalSold = await db.giftCard.count();
    const totalRedeemed = await db.giftCard.count({ where: { status: 'redeemed' } });
    const totalActive = await db.giftCard.count({ where: { status: 'active' } });
    const totalExpired = await db.giftCard.count({ where: { status: 'expired' } });

    // Revenue by brand
    const revenueByBrand = await db.giftCard.groupBy({
      by: ['brandId'],
      _sum: { amount: true },
      _count: true,
    });

    // Get brand names for the revenue data
    const brandIds = revenueByBrand.map(r => r.brandId);
    const brands = await db.giftCardBrand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, brandName: true },
    });
    const brandMap: Record<string, string> = {};
    brands.forEach(b => { brandMap[b.id] = b.brandName; });

    const topBrands = revenueByBrand
      .map(r => ({
        brandName: brandMap[r.brandId] || 'Unknown',
        totalAmount: r._sum.amount || 0,
        count: r._count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Total revenue (sum of all gift card amounts)
    const totalRevenueResult = await db.giftCard.aggregate({
      _sum: { amount: true },
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;

    // Cards by status over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCards = await db.giftCard.count({
      where: { purchasedAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      totalSold,
      totalRedeemed,
      totalActive,
      totalExpired,
      totalRevenue,
      recentCards,
      topBrands,
    });
  } catch (error: any) {
    console.error('[admin/gift-cards/stats]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
