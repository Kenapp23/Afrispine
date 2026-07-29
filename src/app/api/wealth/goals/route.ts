import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// GET — list sender's investment goals
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const goals = await db.investmentGoal.findMany({
    where: { senderId: sender.id, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
    include: { autoInvestRules: true },
  });

  return NextResponse.json({ goals });
}

// POST — create a new investment goal
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const {
    goalType,
    goalName,
    targetAmountUsd,
    targetDate,
    monthlyContributionUsd,
    autoInvestEnabled,
    autoInvestDayOfMonth,
  } = body;

  if (!goalName || goalName.trim().length === 0) {
    return NextResponse.json({ error: 'Goal name is required' }, { status: 400 });
  }

  const goal = await db.investmentGoal.create({
    data: {
      senderId: sender.id,
      goalType: goalType || 'wealth',
      goalName: goalName.trim(),
      targetAmountUsd: targetAmountUsd ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      monthlyContributionUsd: monthlyContributionUsd ?? 0,
      autoInvestEnabled: autoInvestEnabled ?? false,
      autoInvestDayOfMonth: autoInvestDayOfMonth ?? 1,
    },
  });

  return NextResponse.json({ goal }, { status: 201 });
}