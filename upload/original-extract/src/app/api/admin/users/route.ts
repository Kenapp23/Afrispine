import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '20');
  const search = url.searchParams.get('search') ?? '';
  const where: any = {};
  if (search) where.OR = [
    { email: { contains: search } },
    { firstName: { contains: search } },
    { lastName: { contains: search } },
  ];
  const [items, total] = await Promise.all([
    db.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, country: true, role: true, kycStatus: true, createdAt: true } }),
    db.user.count({ where }),
  ]);
  return Response.json({ items, total, page, limit });
}