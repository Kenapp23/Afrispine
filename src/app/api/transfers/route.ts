/**
 * Transfer History
 *
 * Returns recent Transaction records where purpose='send'.
 */

import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET() {
  if (!dbReady) {
    return NextResponse.json({ transfers: [] });
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { purpose: 'send' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      transfers: transactions.map((t) => ({
        id: t.id,
        reference: t.reference,
        status: t.status,
        sendCurrency: t.sendCurrency,
        sendAmount: t.sendAmount,
        receiveCurrency: t.receiveCurrency,
        receiveAmount: t.receiveAmount,
        corridor: t.corridor,
        rail: t.rail,
        recipientName: t.recipientName,
        recipientPhone: t.recipientPhone,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('[transfers] DB error:', err);
    return NextResponse.json({ transfers: [] });
  }
}
