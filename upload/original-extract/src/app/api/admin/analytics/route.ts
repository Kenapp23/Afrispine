import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireAdmin(req);
  const [statusBreakdown, volumeByCorridor, totalVol] = await Promise.all([
    db.transaction.groupBy({ by: ['status'], _count: true, _sum: { sourceAmount: true } }),
    db.transaction.groupBy({ by: ['corridorId'], _sum: { sourceAmount: true, destAmount: true } }),
    db.transaction.aggregate({ _sum: { sourceAmount: true, feeAmount: true } }),
  ]);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const dayTx = await db.transaction.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { sourceAmount: true, feeAmount: true, status: true } });
    last7.push({
      date: start.toISOString().slice(0, 10),
      volume: dayTx.reduce((s, t) => s + t.sourceAmount, 0),
      fees: dayTx.reduce((s, t) => s + t.feeAmount, 0),
      count: dayTx.length,
    });
  }

  return Response.json({
    statusBreakdown,
    volumeByCorridor,
    totalVolume: totalVol._sum.sourceAmount ?? 0,
    totalFees: totalVol._sum.feeAmount ?? 0,
    volumeByDay: last7,
  });
}