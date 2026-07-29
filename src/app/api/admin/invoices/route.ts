import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  const where: any = {};
  if (status && status !== 'all') {
    where.status = status;
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const providers = await db.provider.findMany({ where: { isActive: true } });
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const yyyy = periodStart.getFullYear();
  const mm = String(periodStart.getMonth() + 1).padStart(2, '0');
  const prefix = 'INV-' + yyyy + '-' + mm + '-';

  // Count existing invoices with this prefix to get next NNN
  const existing = await db.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });
  const nextNum = existing.length > 0
    ? parseInt(existing[0].invoiceNumber.slice(prefix.length)) + 1
    : 1;

  let generated = 0;
  let invoiceNum = nextNum;

  for (const p of providers) {
    const txns = await db.transaction.findMany({
      where: {
        providerId: p.id,
        status: 'delivered',
        feeConfirmed: true,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const count = txns.length;
    const volume = txns.reduce((s, t) => s + t.amountSend, 0);

    if (count === 0) continue;

    let subtotal = 0;
    if (p.billingModel === 'volume_pct') {
      subtotal = volume * (p.billingRate / 100);
    } else {
      subtotal = count * p.billingRate;
    }

    const vatAmount = subtotal * 0.2; // 20% VAT
    const totalDue = subtotal + vatAmount;

    const invoiceNumber = prefix + String(invoiceNum).padStart(3, '0');
    invoiceNum++;

    await db.invoice.create({
      data: {
        invoiceNumber,
        providerId: p.id,
        periodStart,
        periodEnd,
        transactionCount: count,
        volumeGbp: volume,
        subtotal: Math.round(subtotal * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
        currency: 'USD',
        status: 'draft',
      },
    });

    generated++;
  }

  return NextResponse.json({ success: true, generated });
}