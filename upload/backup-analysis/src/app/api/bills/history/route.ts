import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await db.billPayment.findMany({
      where: { senderId: sender.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('[bills/history]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}