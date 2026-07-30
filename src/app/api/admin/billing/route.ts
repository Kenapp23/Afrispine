import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireAdmin(req);
  const invoices = await db.invoice.findMany({ orderBy: { createdAt: 'desc' }, include: { provider: { select: { name: true } } } });
  return Response.json(invoices);
}

export async function POST(req: Request) {
  await requireAdmin(req);
  const { action, providerId } = await req.json();
  if (action === 'generate') {
    const providers = providerId ? [await db.provider.findUnique({ where: { id: providerId } })] : await db.provider.findMany({ where: { isActive: true } });
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1);
    const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const ym = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    for (const p of providers) {
      if (!p) continue;
      const txns = await db.transaction.count({ where: { providerId: p.id, status: 'delivered', createdAt: { gte: periodStart, lt: periodEnd } } });
      const vol = await db.transaction.aggregate({ _sum: { chargeAmountUsd: true }, where: { providerId: p.id, status: 'delivered', createdAt: { gte: periodStart, lt: periodEnd } } });
      const amountDue = (vol._sum.chargeAmountUsd ?? 0) * (p.billingRate / 100);
      const invNum = `INV-${ym}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      await db.invoice.create({
        data: { invoiceNumber: invNum, providerId: p.id, periodStart, periodEnd, transactionCount: txns, volumeUsd: vol._sum.chargeAmountUsd ?? 0, billingRate: p.billingRate, amountDue, currency: 'USD', status: 'draft' },
      });
    }
  }
  return Response.json({ ok: true });
}