import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFxRate, applyMargin } from '@/lib/fx';
import { generateReference } from '@/lib/providers';

export async function POST(req: NextRequest) {
  try {
    const { amountSend, currencySend, currencyReceive, rail, senderId } = await req.json();
    if (!amountSend || amountSend <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const rawRate = await getFxRate(currencySend, currencyReceive);
    const corridor = `${currencySend.substring(0,2).toUpperCase()}-${currencyReceive.substring(0,2).toUpperCase()}`;
    const rate = await applyMargin(rawRate, corridor);
    const feePct = 1.5;
    const feeAmount = Math.round(amountSend * feePct / 100 * 100) / 100;
    const totalCharged = Math.round((amountSend + feeAmount) * 100) / 100;
    const amountReceive = Math.round(amountSend * rate * 100) / 100;
    const reference = generateReference();
    const quoteExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const transaction = await db.transaction.create({
      data: { reference, senderId, amountSend, currencySend, amountReceive, currencyReceive, fxRate: rate, feePct, feeAmount, totalCharged, rail: rail || 'mobile_money', status: 'quote', quoteExpiresAt, amlResult: 'pending' }
    });
    await db.transactionEvent.create({ data: { transactionId: transaction.id, eventType: 'quote_created', payload: JSON.stringify({ rate, feeAmount }), actor: 'system' } });
    return NextResponse.json({ transaction });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
