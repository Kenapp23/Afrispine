import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { trackGrowthEvent } from '@/lib/whatsapp';

// Record a contribution payment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const circle = await db.savingsCircle.findUnique({
    where: { id },
    include: { members: true, payments: true },
  });
  if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

  // Check access: organiser or member
  const isMember = circle.members.some((m) => m.senderId === sender.id);
  if (circle.organiserId !== sender.id && !isMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const { memberName } = body;

  if (!memberName) {
    return NextResponse.json({ error: 'Member name is required' }, { status: 400 });
  }

  const member = circle.members.find((m) => m.memberName === memberName);
  if (!member) {
    return NextResponse.json({ error: 'Member not found in this circle' }, { status: 404 });
  }

  // Check if already paid this cycle
  const cycleKey = getCycleKey(circle.currentCycle, circle.frequency);
  const alreadyPaid = circle.payments.some(
    (p) => p.memberName === memberName && p.cycleMonth === cycleKey && p.status === 'paid'
  );
  if (alreadyPaid) {
    return NextResponse.json({ error: 'Payment already recorded for this cycle' }, { status: 409 });
  }

  // Create payment record
  const payment = await db.savingsCirclePayment.create({
    data: {
      circleId: id,
      memberName,
      amount: circle.contributionAmount,
      currency: circle.contributionCurrency,
      cycleMonth: cycleKey,
      status: 'paid',
      paidAt: new Date(),
    },
  });

  // Update member stats
  await db.savingsCircleMember.update({
    where: { id: member.id },
    data: {
      totalContributed: { increment: circle.contributionAmount },
      lastPaymentAt: new Date(),
    },
  });

  // Update circle total pot
  await db.savingsCircle.update({
    where: { id },
    data: { totalPot: { increment: circle.contributionAmount } },
  });

  // Check if all members have paid this cycle
  const updatedCircle = await db.savingsCircle.findUnique({
    where: { id },
    include: { members: true, payments: true },
  });

  if (updatedCircle) {
    const cyclePayments = updatedCircle.payments.filter(
      (p) => p.cycleMonth === cycleKey && p.status === 'paid'
    );
    const paidNames = new Set(cyclePayments.map((p) => p.memberName));
    const allPaid = updatedCircle.members.every((m) => paidNames.has(m.memberName));

    if (allPaid && updatedCircle.members.length > 0) {
      // Determine payout recipient by rotation position
      const payoutPosition = updatedCircle.currentCycle % updatedCircle.members.length || updatedCircle.members.length;
      const payoutMember = updatedCircle.members.find((m) => m.positionInRotation === payoutPosition);

      if (payoutMember) {
        await db.savingsCircleMember.update({
          where: { id: payoutMember.id },
          data: { hasReceivedPayout: true },
        });

        // Advance to next cycle
        const nextPayoutDate = new Date();
        if (updatedCircle.frequency === 'weekly') {
          nextPayoutDate.setDate(nextPayoutDate.getDate() + 7 * updatedCircle.members.length);
        } else {
          nextPayoutDate.setMonth(nextPayoutDate.getMonth() + updatedCircle.members.length);
        }

        await db.savingsCircle.update({
          where: { id },
          data: {
            currentCycle: { increment: 1 },
            nextPayoutDate,
          },
        });
      }
    }
  }

  // Track growth event
  await trackGrowthEvent(db, 'chama_contribution', sender.id, {
    circleId: id,
    memberName,
    amount: circle.contributionAmount,
    currency: circle.contributionCurrency,
  });

  return NextResponse.json({ payment }, { status: 201 });
}

function getCycleKey(cycle: number, frequency: string): string {
  const now = new Date();
  if (frequency === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return `cycle-${cycle}-${weekStart.toISOString().slice(0, 10)}`;
  }
  return `cycle-${cycle}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}