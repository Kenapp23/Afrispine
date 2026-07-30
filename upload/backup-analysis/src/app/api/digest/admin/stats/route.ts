import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/digest/admin/stats — comprehensive digest stats (admin only)
export async function GET(req: Request) {
  try {
    const { error, res: authRes } = await requireAdmin(req);
    if (error || authRes) return authRes!;

    // Total subscribers & active subscribers
    const totalSubscribers = await db.digestSubscription.count();
    const activeSubscribers = await db.digestSubscription.count({
      where: { isActive: true },
    });

    // Total issues published
    const publishedIssues = await db.digestIssue.count({
      where: { status: 'published' },
    });

    // Total ad revenue
    const adRevenue = await db.digestAdPayment.aggregate({
      where: { status: 'completed' },
      _sum: { amountUsd: true },
    });

    // Latest issue info
    const latestIssue = await db.digestIssue.findFirst({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        issueNumber: true,
        slug: true,
        subject: true,
        sentCount: true,
        openRate: true,
        clickRate: true,
        publishedAt: true,
      },
    });

    // Subscriber growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscribers = await db.digestSubscription.count({
      where: { joinedAt: { gte: thirtyDaysAgo } },
    });

    // Subscribers by day (last 30 days) for growth trend
    const subscribersByDay = await db.digestSubscription.groupBy({
      by: ['joinedAt'],
      where: { joinedAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Aggregate by date string
    const growthByDay: Record<string, number> = {};
    for (const s of subscribersByDay) {
      const dateKey = s.joinedAt.toISOString().split('T')[0];
      growthByDay[dateKey] = (growthByDay[dateKey] || 0) + 1;
    }

    // Top countries
    const countryStats = await db.digestSubscription.groupBy({
      by: ['country'],
      where: { isActive: true, country: { not: '' } },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    // Average open/click rates from published issues
    const rateStats = await db.digestIssue.aggregate({
      where: { status: 'published' },
      _avg: { openRate: true, clickRate: true },
    });

    // Subscriber source breakdown
    const sourceStats = await db.digestSubscription.groupBy({
      by: ['source'],
      where: { isActive: true },
      _count: true,
    });

    // Subscriber market focus breakdown
    const marketStats = await db.digestSubscription.groupBy({
      by: ['marketFocus'],
      where: { isActive: true },
      _count: true,
    });

    return NextResponse.json({
      totalSubscribers,
      activeSubscribers,
      publishedIssues,
      totalAdRevenue: adRevenue._sum.amountUsd || 0,
      latestIssue,
      subscriberGrowth: {
        last30Days: recentSubscribers,
        byDay: growthByDay,
      },
      topCountries: countryStats.map((c) => ({
        country: c.country,
        count: c._count,
      })),
      averageRates: {
        openRate: rateStats._avg.openRate || 0,
        clickRate: rateStats._avg.clickRate || 0,
      },
      bySource: sourceStats.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      byMarket: marketStats.map((m) => ({
        market: m.marketFocus,
        count: m._count,
      })),
    });
  } catch (e: any) {
    console.error('[digest/admin/stats]', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}