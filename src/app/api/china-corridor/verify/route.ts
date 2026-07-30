import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';

const verifySchema = z.object({
  reference: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    let senderId: string | null = null;
    try {
      const sender = await requireSenderAuth(req);
      senderId = sender.id;
    } catch {
      // Allow unauthenticated for beta
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const { reference } = parsed.data;

    // Verify with Paystack
    const result = await verifyTransaction(reference);

    // Update local record
    const payment = await db.chinaCorridorPayment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (result.status === 'success') {
      await db.chinaCorridorPayment.update({
        where: { reference },
        data: {
          status: 'completed',
          paystackTxId: String(result.id),
          paymentConfirmedAt: new Date(result.paidAt),
          completedAt: new Date(),
        },
      });
    } else if (result.status === 'failed' || result.status === 'abandoned') {
      await db.chinaCorridorPayment.update({
        where: { reference },
        data: {
          status: 'failed',
          paystackTxId: String(result.id),
          failedAt: new Date(),
          failureReason: result.status,
        },
      });
    }

    return NextResponse.json({
      status: result.status,
      amount: result.amount,
      channel: result.channel,
      paidAt: result.paidAt,
    });
  } catch (e: any) {
    console.error('[chinaCorridorVerify]', e);
    const message = e.message || 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}