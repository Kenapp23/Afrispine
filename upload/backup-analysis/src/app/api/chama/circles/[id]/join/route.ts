import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { trackGrowthEvent } from '@/lib/whatsapp';

// Join an existing circle via slug
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json();
  const { slug } = body;

  if (!slug) {
    return NextResponse.json({ error: 'Invite code (slug) is required' }, { status: 400 });
  }

  const circle = await db.savingsCircle.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!circle) {
    return NextResponse.json({ error: 'No savings circle found with this invite code' }, { status: 404 });
  }

  if (circle.status !== 'active') {
    return NextResponse.json({ error: 'This circle is not currently accepting new members' }, { status: 400 });
  }

  // Check if already a member
  const alreadyMember = circle.members.some((m) => m.senderId === sender.id);
  if (alreadyMember) {
    return NextResponse.json({ error: 'You are already a member of this circle' }, { status: 409 });
  }

  // Also check by organiser
  if (circle.organiserId === sender.id) {
    return NextResponse.json({ error: 'You are the organiser of this circle' }, { status: 409 });
  }

  const fullName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;

  // Calculate next payment due based on frequency
  const now = new Date();
  const nextDue = new Date(now);
  if (circle.frequency === 'weekly') {
    nextDue.setDate(nextDue.getDate() + 7);
  } else {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  const nextPosition = circle.members.length + 1;

  const member = await db.savingsCircleMember.create({
    data: {
      circleId: circle.id,
      senderId: sender.id,
      memberName: fullName,
      phone: sender.phone || '',
      email: sender.email,
      positionInRotation: nextPosition,
      nextPaymentDue: nextDue,
    },
  });

  // Increment member count
  await db.savingsCircle.update({
    where: { id: circle.id },
    data: { memberCount: { increment: 1 } },
  });

  // Track growth event
  await trackGrowthEvent(db, 'chama_joined', sender.id, {
    circleId: circle.id,
    circleName: circle.name,
    method: 'invite_link',
  });

  return NextResponse.json({ member, circleId: circle.id }, { status: 201 });
}