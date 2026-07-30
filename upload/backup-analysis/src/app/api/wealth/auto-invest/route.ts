import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// GET — list sender's auto-invest rules
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const rules = await db.autoInvestRule.findMany({
    where: { senderId: sender.id },
    orderBy: { createdAt: 'desc' },
    include: { goal: { select: { id: true, goalName: true, goalType: true } } },
  });

  return NextResponse.json({ rules });
}

// POST — create a new auto-invest rule
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { goalId, ticker, exchange, amountGbp, frequency, dayOfMonth } = body;

  if (!ticker || !exchange) {
    return NextResponse.json({ error: 'ticker and exchange are required' }, { status: 400 });
  }
  if (!amountGbp || amountGbp <= 0) {
    return NextResponse.json({ error: 'A valid amount (GBP) is required' }, { status: 400 });
  }

  // If goalId is provided, verify ownership
  if (goalId) {
    const goal = await db.investmentGoal.findFirst({
      where: { id: goalId, senderId: sender.id },
    });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
  }

  // Get the sender's investment account
  const account = await db.investmentAccount.findUnique({
    where: { senderId: sender.id },
    select: { id: true },
  });

  const rule = await db.autoInvestRule.create({
    data: {
      senderId: sender.id,
      investmentAccountId: account?.id ?? '',
      goalId: goalId || null,
      ticker,
      exchange,
      amountGbp,
      frequency: frequency || 'monthly',
      dayOfMonth: dayOfMonth ?? 1,
      isActive: true,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}