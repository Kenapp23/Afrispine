import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(req);
  const { id } = await params;
  const body = await req.json();
  const updated = await db.corridor.update({ where: { id }, data: body });
  return Response.json(updated);
}