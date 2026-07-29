import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// List sender's group sends
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const groups = await db.groupSend.findMany({
    where: { createdBy: sender.id },
    include: {
      recipient: true,
      contributions: true,
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ groupSends: groups });
}

// Create a new group send
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { title, description, targetAmount, currency, recipientId, rail, deadlineAt } = await req.json();

  if (!title || !targetAmount || !recipientId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const recipient = await db.recipient.findFirst({ where: { id: recipientId, senderId: sender.id } });
  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

  const group = await db.groupSend.create({
    data: {
      createdBy: sender.id,
      title,
      description: description || '',
      targetAmount: parseFloat(targetAmount),
      currency: currency || 'GBP',
      recipientId,
      rail: rail || 'mobile_money',
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
    },
  });

  return NextResponse.json({ groupSend: group }, { status: 201 });
}