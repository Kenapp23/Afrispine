import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayTxns = await db.transaction.findMany({ where: { createdAt: { gte: today } } });
  const todayVolume = todayTxns.reduce((s, t) => s + t.amountSend, 0);
  const todayFees = todayTxns.reduce((s, t) => s + t.feeAmount, 0);
  const inFlight = todayTxns.filter(t => t.status === 'processing').length;
  const failed = todayTxns.filter(t => t.status === 'failed').length;
  const recent = await db.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { sender: true, provider: true } });
  return NextResponse.json({ todayVolume, todayTxns: todayTxns.length, todayFees, inFlight, failed, avgDeliveryTime: '15 min', recentTransactions: recent });
}
