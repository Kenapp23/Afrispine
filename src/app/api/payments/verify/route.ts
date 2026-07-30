import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Find transaction by Paystack reference
    const txn = await db.transaction.findFirst({
      where: { paystackRef: reference },
      include: { sender: true, recipient: true },
    });

    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (txn.senderId !== senderPayload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await verifyTransaction(reference);

    if (result.status === 'success') {
      // Don't change status here — the webhook handles that
      return NextResponse.json({
        status: 'success',
        amount: result.amount / 100,
        fees: result.fees / 100,
        channel: result.channel,
        paidAt: result.paidAt,
      });
    }

    return NextResponse.json({ status: result.status }, { status: 400 });
  } catch (e: any) {
    console.error('[payments/verify]', e);
    return NextResponse.json({ error: e.message || 'Verification failed' }, { status: 500 });
  }
}