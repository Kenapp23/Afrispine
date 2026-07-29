import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(req);
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, country: true, role: true, kycStatus: true, createdAt: true, _count: { select: { transactions: true, recipients: true } } },
  });
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(user);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(req);
  const { id } = await params;
  const { kycStatus } = await req.json();
  if (!kycStatus) return Response.json({ error: 'Missing kycStatus' }, { status: 400 });
  const updated = await db.user.update({ where: { id }, data: { kycStatus } });
  const { passwordHash: _, ...safe } = updated;
  return Response.json(safe);
}