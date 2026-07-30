import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { id } = await params;
  const notes = await db.senderNote.findMany({
    where: { senderId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { id } = await params;
  const { note, adminName } = await req.json();
  if (!note) return NextResponse.json({ error: 'Note required' }, { status: 400 });
  const created = await db.senderNote.create({
    data: { senderId: id, note, createdByName: adminName || 'Admin' },
  });
  return NextResponse.json({ note: created }, { status: 201 });
}