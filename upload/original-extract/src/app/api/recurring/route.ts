import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// List sender's recurring sends
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const sends = await db.recurringSend.findMany({
    where: { senderId: sender.id },
    include: { recipient: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ recurringSends: sends });
}

// Create a new recurring send
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { recipientId, amount, currencySend, currencyReceive, rail, network, frequency, dayOfMonth } = await req.json();

  if (!recipientId || !amount || !frequency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate recipient belongs to sender
  const recipient = await db.recipient.findFirst({
    where: { id: recipientId, senderId: sender.id },
  });
  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

  // Calculate next run
  const nextRunAt = calculateNextRun(frequency, dayOfMonth || 1);

  const recurring = await db.recurringSend.create({
    data: {
      senderId: sender.id,
      recipientId,
      amount: parseFloat(amount),
      currencySend: currencySend || 'GBP',
      currencyReceive: currencyReceive || 'KES',
      rail: rail || 'mobile_money',
      network: network || null,
      frequency,
      dayOfMonth: dayOfMonth || 1,
      nextRunAt,
      isActive: true,
    },
  });

  return NextResponse.json({ recurringSend: recurring }, { status: 201 });
}

function calculateNextRun(frequency: string, dayOfMonth: number): Date {
  const now = new Date();
  if (frequency === 'weekly') {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(9, 0, 0, 0);
    return next;
  }
  // monthly
  const targetDay = Math.min(dayOfMonth, 28);
  let month = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() >= targetDay) {
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return new Date(year, month, targetDay, 9, 0, 0, 0);
}