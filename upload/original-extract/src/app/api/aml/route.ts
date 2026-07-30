import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { transactionId } = await req.json();
  const clear = Math.random() > 0.05;
  const result = clear ? 'clear' : 'flagged';
  await db.transaction.update({ where: { id: transactionId }, data: { amlResult: result } });
  if (!clear) {
    const txn = await db.transaction.findUnique({ where: { id: transactionId } });
    if (txn) await db.amlFlag.create({ data: { transactionId, senderId: txn.senderId, flagReason: 'Watchlist match', status: 'pending_review' } });
  }
  return NextResponse.json({ success: true, amlResult: result });
}
