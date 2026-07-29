import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await db.groupSend.findUnique({
    where: { id },
    include: {
      recipient: true,
      contributions: { orderBy: { createdAt: 'desc' } },
      creator: { select: { firstName: true, lastName: true } },
    },
  });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Calculate totals
  const totalContributed = group.contributions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return NextResponse.json({ groupSend: { ...group, totalContributed, contributorCount: group.contributions.length } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const group = await db.groupSend.findFirst({ where: { id, createdBy: sender.id } });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.groupSend.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });

  return NextResponse.json({ groupSend: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const group = await db.groupSend.findFirst({ where: { id, createdBy: sender.id } });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.groupSend.update({ where: { id }, data: { status: 'cancelled' } });
  return NextResponse.json({ success: true });
}