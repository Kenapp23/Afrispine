import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifySender, notifyRecipient } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const { transactionId, trigger } = await req.json();
  const txn = await db.transaction.findUnique({ where: { id: transactionId }, include: { sender: true, recipient: true } });
  if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (txn.sender?.email) notifySender(txn.sender.email, `${txn.sender?.firstName} ${txn.sender?.lastName}`, trigger, { reference: txn.reference, amount: String(txn.amountSend), currency: txn.currencySend, recipientName: txn.recipient?.fullName || '', eta: '~15 minutes' });
  if (txn.recipient?.phone) notifyRecipient(txn.recipient.phone, txn.recipient?.fullName || '', trigger, { senderName: txn.sender?.firstName || '', amount: `${txn.amountReceive} ${txn.currencyReceive}`, currency: txn.currencyReceive, reference: txn.reference, eta: '~15 minutes' });
  return NextResponse.json({ sent: true });
}
