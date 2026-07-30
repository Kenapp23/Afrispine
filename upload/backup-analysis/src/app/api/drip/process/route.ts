import { NextRequest, NextResponse } from 'next/server';
import { processDripQueue } from '@/lib/drip-engine';
import { requireSenderAuth } from '@/lib/auth';

/**
 * POST /api/drip/process
 *
 * Triggers the drip email processing queue.
 * Authenticated via requireSenderAuth (sender JWT) or CRON_SECRET Bearer token.
 * If CRON_SECRET env var is not set, all requests are allowed (dev mode).
 */
export async function POST(req: NextRequest) {
  try {
    // Try sender auth first
    let authorized = false;

    try {
      await requireSenderAuth(req);
      authorized = true;
    } catch {
      // Sender auth failed — try CRON_SECRET
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret) {
        // No CRON_SECRET set — allow all (dev mode)
        authorized = true;
      } else {
        const authHeader = req.headers.get('authorization');
        if (authHeader === `Bearer ${cronSecret}`) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processDripQueue();

    return NextResponse.json({
      processed: result.processed,
      results: [
        { status: 'sent', count: result.sent },
        { status: 'errors', count: result.errors },
      ],
    });
  } catch (e: any) {
    console.error('[drip-api] Process failed:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/drip/process
 *
 * Health check — returns queue status info.
 */
export async function GET() {
  try {
    const cronSecret = process.env.CRON_SECRET;
    return NextResponse.json({
      status: 'ok',
      service: 'drip-engine',
      authConfigured: !!cronSecret,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}