import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// GET /api/wealth/orders — list sender's own orders
export async function GET(req: NextRequest) {
  try {
    const sender = await getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db.investmentOrder.findMany({
      where: { senderId: sender.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (e: any) {
    console.error('[wealth/orders]', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}