import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeTransaction } from '@/lib/paystack';

// Public view — no auth needed to view group send
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await db.groupSend.findUnique({
    where: { id, status: 'collecting' },
    include: {
      recipient: true,
      contributions: true,
      creator: { select: { firstName: true, lastName: true } },
    },
  });
  if (!group) return NextResponse.json({ error: 'Not found or closed' }, { status: 404 });

  const totalContributed = group.contributions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return NextResponse.json({
    groupSend: {
      id: group.id,
      title: group.title,
      description: group.description,
      targetAmount: group.targetAmount,
      currency: group.currency,
      totalContributed,
      progress: Math.min(100, (totalContributed / group.targetAmount) * 100),
      contributorCount: group.contributions.filter(c => c.status === 'paid').length,
      deadlineAt: group.deadlineAt,
      recipientName: group.recipient?.fullName,
      country: group.recipient?.country,
      creatorName: `${group.creator.firstName} ${group.creator.lastName}`,
    },
  });
}

// Contribute — initialize Paystack for guest checkout
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { contributorName, contributorEmail, amount } = await req.json();

    if (!contributorName || !contributorEmail || !amount) {
      return NextResponse.json({ error: 'Name, email, and amount are required' }, { status: 400 });
    }

    const group = await db.groupSend.findUnique({
      where: { id, status: 'collecting' },
    });
    if (!group) return NextResponse.json({ error: 'Group send not found or closed' }, { status: 404 });

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const reference = `AFSP-GROUP-${id}-${Date.now()}`;

    // Add 1.5% + £0.50 contribution fee
    const fee = (amountNum * 0.015) + 0.50;
    const totalCharged = amountNum + fee;

    const result = await initializeTransaction({
      email: contributorEmail,
      amount: totalCharged,
      reference,
      metadata: {
        groupSendId: id,
        contributorName,
        contributorEmail,
        baseAmount: amountNum,
        fee: Math.round(fee * 100) / 100,
        type: 'group_contribution',
      },
    });

    // Create pending contribution record
    await db.groupSendContribution.create({
      data: {
        groupSendId: id,
        contributorEmail,
        contributorName,
        amount: amountNum,
        paystackRef: reference,
        status: 'pending',
      },
    });

    return NextResponse.json({ access_code: result.access_code, reference });
  } catch (e: any) {
    console.error('[group-sends/contribute]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}