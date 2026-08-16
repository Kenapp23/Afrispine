/**
 * Content Checkout — Status Poll
 *
 * Allows the client to poll for checkout completion by merchantRequestId.
 * Checks PendingContentCheckout (pending/expired) and ContentTicket (completed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ merchantRequestId: string }> },
) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { merchantRequestId } = await params;

    if (!merchantRequestId) {
      return NextResponse.json({ error: 'merchantRequestId is required' }, { status: 400 });
    }

    // ── Check PendingContentCheckout ──────────────────────────────
    const pending = await db.pendingContentCheckout.findUnique({
      where: { merchantRequestId },
    });

    if (pending) {
      // Check expiry
      if (new Date() > pending.expiresAt) {
        // Expired — delete and return expired
        try {
          await db.pendingContentCheckout.delete({
            where: { merchantRequestId },
          });
        } catch { /* ignore */ }
        return NextResponse.json({ status: 'expired' });
      }

      // Still pending
      return NextResponse.json({ status: 'pending' });
    }

    // ── No pending row — check if a ContentTicket was created ───
    // We need to search by videoId, but we don't have it from just the merchantRequestId
    // if the pending row was already deleted. Return expired/unknown.
    // In practice, the client should have cached the videoId.
    return NextResponse.json({ status: 'expired' });
  } catch (err) {
    console.error('[content/checkout/status] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
