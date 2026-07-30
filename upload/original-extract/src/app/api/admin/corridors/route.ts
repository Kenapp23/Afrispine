import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireAdmin(req);
  const list = await db.corridor.findMany({
    include: { provider: { select: { name: true } }, _count: { select: { transactions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(list);
}

export async function POST(req: Request) {
  await requireAdmin(req);
  const body = await req.json();
  const c = await db.corridor.create({ data: body });
  return Response.json(c, { status: 201 });
}