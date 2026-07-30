import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  const { id } = await params;
  const body = await req.json();
  const r = await db.recipient.findUnique({ where: { id } });
  if (!r || r.userId !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });
  const updated = await db.recipient.update({ where: { id }, data: body });
  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  const { id } = await params;
  const r = await db.recipient.findUnique({ where: { id } });
  if (!r || r.userId !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });
  await db.recipient.delete({ where: { id } });
  return Response.json({ ok: true });
}