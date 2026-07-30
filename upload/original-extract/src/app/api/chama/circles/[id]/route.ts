import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// Get full circle details with members and recent payments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const circle = await db.savingsCircle.findUnique({
    where: { id },
    include: {
      members: { orderBy: { positionInRotation: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' }, take: 50 },
      organiser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

  // Check access: organiser or member
  const isMember = circle.members.some((m) => m.senderId === sender.id);
  if (circle.organiserId !== sender.id && !isMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Determine who has paid this cycle
  const cycleKey = getCycleKey(circle.currentCycle, circle.frequency);
  const cyclePayments = circle.payments.filter((p) => p.cycleMonth === cycleKey && p.status === 'paid');
  const paidMemberNames = new Set(cyclePayments.map((p) => p.memberName));

  return NextResponse.json({
    circle: {
      ...circle,
      paidThisCycle: paidMemberNames,
    },
  });
}

// Update circle settings (organiser only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const circle = await db.savingsCircle.findUnique({ where: { id } });
  if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  if (circle.organiserId !== sender.id) {
    return NextResponse.json({ error: 'Only the organiser can update circle settings' }, { status: 403 });
  }

  const body = await req.json();
  const { name, contributionAmount, frequency } = body;

  const updateData: Record<string, unknown> = {};
  if (name) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }
  if (contributionAmount !== undefined) {
    updateData.contributionAmount = parseFloat(contributionAmount);
  }
  if (frequency) {
    const validFrequencies = ['monthly', 'weekly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }
    updateData.frequency = frequency;
  }

  const updated = await db.savingsCircle.update({
    where: { id },
    data: updateData,
    include: {
      members: true,
      organiser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return NextResponse.json({ circle: updated });
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