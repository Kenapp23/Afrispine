import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const recurring = await db.recurringSend.findFirst({ where: { id, senderId: sender.id } });
  if (!recurring) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.recurringSend.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.amount && { amount: parseFloat(body.amount) }),
      ...(body.frequency && { frequency: body.frequency }),
      ...(body.dayOfMonth && { dayOfMonth: body.dayOfMonth }),
    },
  });

  return NextResponse.json({ recurringSend: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const recurring = await db.recurringSend.findFirst({ where: { id, senderId: sender.id } });
  if (!recurring) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.recurringSend.delete({ where: { id } });
  return NextResponse.json({ success: true });
}