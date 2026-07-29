import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireAdmin(req);
  const [userCount, txCount, activeCount, volume, recent] = await Promise.all([
    db.user.count(),
    db.transaction.count(),
    db.transaction.count({ where: { status: { in: ['payment_pending', 'processing'] } } }),
    db.transaction.aggregate({ _sum: { sourceAmount: true } }),
    db.transaction.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { corridor: true, user: { select: { firstName: true, lastName: true } } } }),
  ]);
  return Response.json({
    totalUsers: userCount,
    totalTransactions: txCount,
    totalVolume: volume._sum.sourceAmount ?? 0,
    activeTransfers: activeCount,
    recentTransactions: recent,
  });
}