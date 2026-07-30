import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { id } = await params;

  const sender = await db.sender.findUnique({
    where: { id },
    include: {
      _count: { select: { transactions: true, recipients: true } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
  const { passwordHash: _, ...safe } = sender;
  return NextResponse.json({ sender: safe });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  for (const key of ['kycStatus', 'accountStatus', 'dailyLimitGbp', 'firstName', 'lastName', 'phone', 'countryOfResidence']) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  const sender = await db.sender.update({ where: { id }, data });
  const { passwordHash: _, ...safe } = sender;
  return NextResponse.json({ sender: safe });
}