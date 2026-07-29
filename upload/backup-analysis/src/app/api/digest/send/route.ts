import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { sendDigestToAll, assembleDigestData, generateDigestHtml } from '@/lib/digest';
import type { DigestFrequency, MarketFocus } from '@/lib/digest';

// POST /api/digest/send — trigger digest send (admin or cron)
export async function POST(req: NextRequest) {
  try {
    // Accept either admin auth or a shared cron secret
    const admin = (await import('@/lib/auth')).getAdminFromRequest(req);
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET || '';
    const isCron = authHeader === `Bearer ${cronSecret}`;

    if (!admin && !isCron) {
      return NextResponse.json({ error: 'Admin authentication or cron secret required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { frequency, marketFocus, dryRun } = body as {
      frequency?: DigestFrequency;
      marketFocus?: MarketFocus;
      dryRun?: boolean;
    };

    // Dry run — just generate and return HTML without sending
    if (dryRun) {
      const focus = (marketFocus || 'all') as MarketFocus;
      const data = await assembleDigestData(focus);
      const html = generateDigestHtml(data, 'https://afri-spine.com/api/digest/unsubscribe?email=test@example.com');

      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          date: data.date,
          topMoversCount: data.topMovers.length,
          fxInsightsCount: data.fxInsights.length,
          hasSponsor: !!data.sponsor,
          hasInvestmentOpportunity: !!data.investmentOpportunity,
          storyTitle: data.storyOfTheWeek.title,
        },
        htmlPreview: html,
      });
    }

    // Send digest
    const result = await sendDigestToAll({
      frequency: frequency || 'weekly',
      marketFocus: marketFocus as MarketFocus | undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e: any) {
    console.error('[digest/send]', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// GET /api/digest/send — public stats about digest issues
export async function GET() {
  try {
    const totalSubscribers = await db.digestSubscription.count({
      where: { isActive: true },
    });

    const recentIssues = await db.digestIssue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        issueDate: true,
        subject: true,
        sentCount: true,
        openRate: true,
        clickRate: true,
        createdAt: true,
      },
    });

    const statsByMarket = await db.digestSubscription.groupBy({
      by: ['marketFocus'],
      where: { isActive: true },
      _count: true,
    });

    const statsByFrequency = await db.digestSubscription.groupBy({
      by: ['frequency'],
      where: { isActive: true },
      _count: true,
    });

    return NextResponse.json({
      totalSubscribers,
      statsByMarket,
      statsByFrequency,
      recentIssues,
    });
  } catch (e: any) {
    console.error('[digest/send] GET stats error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}