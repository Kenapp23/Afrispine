import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || '';

  const where: any = {};
  if (statusFilter) {
    where.outcome = statusFilter;
  }

  const [flags, total] = await Promise.all([
    db.amlFlag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          include: {
            sender: true,
            recipient: true,
            provider: true,
          },
        },
        sender: true,
      },
    }),
    db.amlFlag.count({ where }),
  ]);

  return NextResponse.json({ flags, total });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id, status, notes } = await req.json();
  const data: any = {};
  if (status) data.outcome = status;
  if (notes !== undefined) data.notes = notes;
  const flag = await db.amlFlag.update({ where: { id }, data });
  return NextResponse.json({ flag });
}