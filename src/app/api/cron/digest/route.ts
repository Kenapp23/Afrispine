import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendDigestToAll, checkDigestRateLimit } from '@/lib/digest';

// POST /api/cron/digest — trigger weekly digest send
// Designed to be called by an external cron service (e.g., cron-job.org, Vercel Cron)
export async function POST(req: NextRequest) {
  try {
    // Rate-limit: allow at most once per 24 hours
    const { allowed, waitMs } = checkDigestRateLimit('weekly-cron');

    if (!allowed) {
      const hours = Math.ceil(waitMs / (1000 * 60 * 60));
      console.log(`[cron/digest] Rate limited — next run in ~${hours}h`);
      return NextResponse.json({
        success: false,
        message: `Rate limited. Next digest can be sent in ~${hours} hours.`,
        waitMs,
      });
    }

    console.log('[cron/digest] Starting weekly digest send...');

    const result = await sendDigestToAll({ frequency: 'weekly' });

    console.log(`[cron/digest] Complete: ${result.successCount}/${result.totalSent} sent`);

    return NextResponse.json({
      success: true,
      triggeredBy: 'cron',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (e: any) {
    console.error('[cron/digest]', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

// GET /api/cron/digest — health check / status (non-mutating)
export async function GET() {
  const totalSubscribers = await db.digestSubscription.count({
    where: { isActive: true },
  });

  const lastIssue = await db.digestIssue.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { issueDate: true, sentCount: true },
  });

  return NextResponse.json({
    service: 'afrispine-digest-cron',
    status: 'healthy',
    totalSubscribers,
    lastIssueSent: lastIssue?.issueDate || null,
    lastIssueCount: lastIssue?.sentCount || 0,
    timestamp: new Date().toISOString(),
  });
}