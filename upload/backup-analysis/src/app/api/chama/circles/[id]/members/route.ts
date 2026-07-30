import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// Add a member to a circle (organiser only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const circle = await db.savingsCircle.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  if (circle.organiserId !== sender.id) {
    return NextResponse.json({ error: 'Only the organiser can add members' }, { status: 403 });
  }

  const body = await req.json();
  const { memberName, phone, email } = body;

  if (!memberName) {
    return NextResponse.json({ error: 'Member name is required' }, { status: 400 });
  }

  // Check if member name already exists in this circle
  const existingMember = circle.members.find((m) => m.memberName.toLowerCase() === memberName.toLowerCase());
  if (existingMember) {
    return NextResponse.json({ error: 'A member with this name already exists in the circle' }, { status: 409 });
  }

  const nextPosition = circle.members.length + 1;

  // Calculate next payment due based on frequency
  const now = new Date();
  const nextDue = new Date(now);
  if (circle.frequency === 'weekly') {
    nextDue.setDate(nextDue.getDate() + 7);
  } else {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  const member = await db.savingsCircleMember.create({
    data: {
      circleId: id,
      memberName,
      phone: phone || '',
      email: email || '',
      positionInRotation: nextPosition,
      nextPaymentDue: nextDue,
    },
  });

  // Increment member count
  await db.savingsCircle.update({
    where: { id },
    data: { memberCount: { increment: 1 } },
  });

  return NextResponse.json({ member }, { status: 201 });
}