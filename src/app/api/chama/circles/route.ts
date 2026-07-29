import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { trackGrowthEvent } from '@/lib/whatsapp';

// List circles where sender is organiser or member
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const circles = await db.savingsCircle.findMany({
    where: {
      OR: [
        { organiserId: sender.id },
        { members: { some: { senderId: sender.id } } },
      ],
    },
    include: {
      members: true,
      _count: { select: { members: true, payments: true } },
      organiser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ circles });
}

// Create a new savings circle
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json();
  const { name, type, contributionAmount, contributionCurrency, frequency } = body;

  if (!name || !contributionAmount) {
    return NextResponse.json({ error: 'Name and contribution amount are required' }, { status: 400 });
  }

  const validTypes = ['chama', 'esusu', 'susu', 'roscas'];
  const validFrequencies = ['monthly', 'weekly'];
  const validCurrencies = ['GBP', 'USD', 'EUR', 'KES', 'NGN'];

  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Must be chama, esusu, susu, or roscas' }, { status: 400 });
  }
  if (frequency && !validFrequencies.includes(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency. Must be monthly or weekly' }, { status: 400 });
  }
  if (contributionCurrency && !validCurrencies.includes(contributionCurrency)) {
    return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  const fullName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;

  // Calculate next payment due date based on frequency
  const now = new Date();
  const nextDue = new Date(now);
  if (frequency === 'weekly') {
    nextDue.setDate(nextDue.getDate() + 7);
  } else {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  const circle = await db.savingsCircle.create({
    data: {
      name,
      slug,
      organiserId: sender.id,
      type: type || 'chama',
      contributionAmount: parseFloat(contributionAmount),
      contributionCurrency: contributionCurrency || 'GBP',
      frequency: frequency || 'monthly',
      memberCount: 1,
      members: {
        create: {
          senderId: sender.id,
          memberName: fullName,
          phone: sender.phone || '',
          email: sender.email,
          positionInRotation: 1,
          nextPaymentDue: nextDue,
        },
      },
    },
    include: {
      members: true,
      organiser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Track growth event
  await trackGrowthEvent(db, 'chama_joined', sender.id, { circleId: circle.id, circleName: circle.name });

  return NextResponse.json({ circle }, { status: 201 });
}