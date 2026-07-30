import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH — update an investment goal
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await db.investmentGoal.findFirst({
    where: { id, senderId: sender.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  const body = await req.json();
  const {
    goalName,
    status,
    targetAmountUsd,
    monthlyContributionUsd,
    autoInvestEnabled,
    autoInvestDayOfMonth,
    targetDate,
    currentValueUsd,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (goalName !== undefined) updateData.goalName = goalName.trim();
  if (status !== undefined) updateData.status = status;
  if (targetAmountUsd !== undefined) updateData.targetAmountUsd = targetAmountUsd;
  if (monthlyContributionUsd !== undefined) updateData.monthlyContributionUsd = monthlyContributionUsd;
  if (autoInvestEnabled !== undefined) updateData.autoInvestEnabled = autoInvestEnabled;
  if (autoInvestDayOfMonth !== undefined) updateData.autoInvestDayOfMonth = autoInvestDayOfMonth;
  if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
  if (currentValueUsd !== undefined) updateData.currentValueUsd = currentValueUsd;

  // If marked as achieved, set achievedAt
  if (status === 'achieved') {
    updateData.achievedAt = new Date();
  }

  const goal = await db.investmentGoal.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ goal });
}

// DELETE — archive an investment goal
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await db.investmentGoal.findFirst({
    where: { id, senderId: sender.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  await db.investmentGoal.update({
    where: { id },
    data: { status: 'archived' },
  });

  return NextResponse.json({ success: true });
}