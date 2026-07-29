import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txn = await db.transaction.findUnique({ where: { id }, include: { sender: true, recipient: true, provider: true, events: true, amlFlags: true } });
  if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction: txn });
}
