import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initPayment } from '@/lib/flutterwave';

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();
    const txn = await db.transaction.findUnique({ where: { id: transactionId }, include: { sender: true, recipient: true } });
    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    const flwRef = `FLW-${txn.reference}`;
    const payment = await initPayment({ tx_ref: txn.reference, amount: txn.totalCharged, currency: txn.currencySend, email: txn.sender?.email || '', name: `${txn.sender?.firstName} ${txn.sender?.lastName}`, phone: txn.sender?.phone || '' });
    await db.transaction.update({ where: { id: transactionId }, data: { status: 'payment_pending', flwRef } });
    await db.transactionEvent.create({ data: { transactionId, eventType: 'payment_initiated', payload: JSON.stringify({ flwRef }), actor: 'system' } });
    return NextResponse.json({ paymentLink: payment.paymentLink, flwRef });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
