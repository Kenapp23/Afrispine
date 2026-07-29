import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Try to get sender from session token first
  const sender = getSenderFromRequest(req);
  if (sender) {
    const transactions = await db.transaction.findMany({
      where: { senderId: sender.id },
      orderBy: { createdAt: 'desc' },
      include: { provider: true, recipient: true },
    });
    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        id: tx.reference || tx.id,
        reference: tx.reference,
        recipient: tx.recipient?.fullName || 'Unknown',
        amount: `${tx.currencySend} ${tx.amountSend.toFixed(2)}`,
        receiveAmount: `${tx.currencyReceive} ${tx.amountReceive.toFixed(2)}`,
        receiveCurrency: tx.currencyReceive,
        status: tx.status,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        corridor: `${tx.currencySend} → ${tx.currencyReceive}`,
        createdAt: tx.createdAt,
        senderId: tx.senderId,
      })),
    });
  }

  // Fallback: check for senderId query param
  const senderId = req.nextUrl.searchParams.get('senderId');
  if (!senderId) {
    return NextResponse.json({ transactions: [] });
  }
  const transactions = await db.transaction.findMany({
    where: { senderId },
    orderBy: { createdAt: 'desc' },
    include: { provider: true, recipient: true },
  });
  return NextResponse.json({
    transactions: transactions.map((tx) => ({
      id: tx.reference || tx.id,
      reference: tx.reference,
      recipient: tx.recipient?.fullName || 'Unknown',
      amount: `${tx.currencySend} ${tx.amountSend.toFixed(2)}`,
      receiveAmount: `${tx.currencyReceive} ${tx.amountReceive.toFixed(2)}`,
      receiveCurrency: tx.currencyReceive,
      status: tx.status,
      date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      corridor: `${tx.currencySend} → ${tx.currencyReceive}`,
      createdAt: tx.createdAt,
      senderId: tx.senderId,
    })),
  });
}