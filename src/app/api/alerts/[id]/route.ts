import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  const alert = await db.rateAlert.findFirst({ where: { id, senderId: sender.id } });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.rateAlert.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}