/**
 * Reject Campaign — Admin rejects a pending campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { adminAuth } from '@/lib/admin-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await adminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = await params;

    const campaign = await db.sponsorCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'Only pending_review campaigns can be rejected' },
        { status: 400 },
      );
    }

    await db.sponsorCampaign.update({
      where: { id },
      data: { status: 'rejected' },
    });

    // Also reject all pending slots
    await db.sponsorSlot.updateMany({
      where: { campaignId: id, status: 'pending' },
      data: { status: 'rejected' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[sponsor/campaigns/reject] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
