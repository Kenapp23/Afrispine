import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(req: NextRequest) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [transactions, total] = await Promise.all([
      db.settlementTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.settlementTransaction.count({ where }),
    ]);

    return NextResponse.json({ success: true, transactions, total });
  } catch (e: any) {
    console.error('[settlement/transactions]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
