import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = getSenderFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const sender = await db.sender.findUnique({ where: { id: payload.id } });
  if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
  const { passwordHash: _, ...safe } = sender;
  return NextResponse.json({ sender: safe });
}