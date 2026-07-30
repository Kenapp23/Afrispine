import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { selectBestProvider, instructProvider } from '@/lib/providers';
import { notifySender, notifyRecipient } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txRef = body.tx_ref || body.data?.tx_ref;
    if (!txRef) return NextResponse.json({ received: true });
    const txn = await db.transaction.findUnique({ where: { reference: txRef }, include: { sender: true, recipient: true, provider: true } });
    if (!txn) return NextResponse.json({ received: true });

    const status = body.status || body.data?.status;
    if (status === 'successful') {
      const flwTxId = body.id || body.data?.id || `FLW-${Date.now()}`;
      // AML screen (simulated - 95% clear)
      const amlClear = Math.random() > 0.05;
      if (!amlClear) {
        await db.transaction.update({ where: { id: txn.id }, data: { status: 'flagged', amlResult: 'flagged', paymentConfirmedAt: new Date() } });
        await db.amlFlag.create({ data: { transactionId: txn.id, senderId: txn.senderId, flagReason: 'Watchlist match', status: 'pending_review' } });
        await db.transactionEvent.create({ data: { transactionId: txn.id, eventType: 'aml_flagged', payload: '{}', actor: 'system' } });
        return NextResponse.json({ received: true });
      }

      // Route to provider
      const corridor = `${txn.currencySend.substring(0,2).toUpperCase()}-${txn.currencyReceive.substring(0,2).toUpperCase()}`;
      const provider = await selectBestProvider(corridor, txn.rail);
      if (!provider) {
        await db.transaction.update({ where: { id: txn.id }, data: { status: 'failed', failureReason: 'No provider available', paymentConfirmedAt: new Date(), failedAt: new Date() } });
        return NextResponse.json({ received: true });
      }

      const result = await instructProvider(provider, txn);
      await db.transaction.update({ where: { id: txn.id }, data: { status: 'processing', paymentConfirmedAt: new Date(), providerInstructedAt: new Date(), flwTxId, providerId: provider.id, providerRef: result.reference, amlResult: 'clear' } });
      await db.transactionEvent.create({ data: { transactionId: txn.id, eventType: 'provider_instructed', payload: JSON.stringify({ provider: provider.name, ref: result.reference }), actor: 'system' } });

      // Notify
      if (txn.sender?.email) notifySender(txn.sender.email, `${txn.sender.firstName} ${txn.sender.lastName}`, 'payment_confirmed', { reference: txn.reference, amount: String(txn.amountSend), currency: txn.currencySend });
      if (txn.recipient?.phone) notifyRecipient(txn.recipient.phone, txn.recipient.fullName, 'processing', { senderName: txn.sender?.firstName || 'Someone', amount: `${txn.amountReceive} ${txn.currencyReceive}`, currency: txn.currencyReceive, eta: '~15 minutes', reference: txn.reference });
    } else if (status === 'failed') {
      await db.transaction.update({ where: { id: txn.id }, data: { status: 'failed', failureReason: 'Payment failed', failedAt: new Date() } });
    }
    return NextResponse.json({ received: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
