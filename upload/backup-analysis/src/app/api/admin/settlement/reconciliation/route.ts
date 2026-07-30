import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const auth = await requireAdmin(req as any);
  if (auth.error) return auth.res;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const period = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const txns = await db.transaction.findMany({
    where: {
      feeConfirmed: true,
      createdAt: { gte: monthStart, lte: monthEnd },
    },
  });

  const feesCollected = txns.reduce((s, t) => s + t.feeAmount, 0);

  return NextResponse.json({ feesCollected, period });
}