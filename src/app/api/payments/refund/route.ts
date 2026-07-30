import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { refundTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.res!;

    const { transactionId, amount } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const txn = await db.transaction.findUnique({ where: { id: transactionId } });
    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    if (!txn.paystackTxId) {
      return NextResponse.json({ error: 'No Paystack transaction ID found' }, { status: 400 });
    }

    const result = await refundTransaction(parseInt(txn.paystackTxId), amount ? Math.round(amount * 100) : undefined);

    if (result.status) {
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: 'refunded', failedAt: new Date(), failureReason: 'Refunded by admin' },
      });
      await db.transactionEvent.create({
        data: { transactionId, eventType: 'refunded', payload: JSON.stringify(result), actor: `admin:${auth.admin?.id}` },
      });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}