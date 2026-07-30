import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if account already exists for this sender
  const existing = await db.investmentAccount.findUnique({
    where: { senderId: sender.id },
  });

  if (existing) {
    return NextResponse.json({ success: true, accountId: existing.id });
  }

  // Create a new investment account with a placeholder mystocks ID
  const mystocksAccountId = `MYSTOCKS-${sender.id.slice(0, 8)}-${Date.now()}`;

  const account = await db.investmentAccount.create({
    data: {
      senderId: sender.id,
      mystocksAccountId,
      status: 'active',
    },
  });

  return NextResponse.json({ success: true, accountId: account.id });
}