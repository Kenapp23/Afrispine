import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || '30d';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let startDate: Date;
  let endDate: Date = new Date();

  if (fromParam && toParam) {
    startDate = new Date(fromParam);
    endDate = new Date(toParam);
  } else {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  // ─── Consumer Remittances ───────────────────────────────────────────────
  const txns = await db.transaction.findMany({
    where: {
      status: 'delivered',
      feeConfirmed: true,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // ─── Bill Payments ──────────────────────────────────────────────────────
  const bills = await db.billPayment.findMany({
    where: {
      status: 'delivered',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // ─── Build CSV ──────────────────────────────────────────────────────────
  const lines: string[] = [];

  // Section 1: Summary by P&L Track
  lines.push('=== REVENUE BY P&L TRACK ===');
  lines.push('Track,Transactions,Volume,Gross Fees,Provider Cost,Net Revenue,Margin %');

  const remitVol = txns.reduce((s, t) => s + t.amountSend, 0);
  const remitFees = txns.reduce((s, t) => s + t.feeAmount, 0);
  const remitCost = remitFees * 0.3;
  const remitNet = remitFees - remitCost;
  lines.push(`Consumer Remittances,${txns.length},${remitVol.toFixed(2)},${remitFees.toFixed(2)},${remitCost.toFixed(2)},${remitNet.toFixed(2)},${remitVol > 0 ? ((remitNet / remitVol) * 100).toFixed(2) : '0.00'}`);

  const billsVol = bills.reduce((s, b) => s + b.totalChargedUsd, 0);
  const billsFees = bills.reduce((s, b) => s + b.convenienceFeeUsd, 0);
  const billsCost = bills.reduce((s, b) => s + b.billAmountUsd, 0);
  lines.push(`Bill Payments,${bills.length},${billsVol.toFixed(2)},${billsFees.toFixed(2)},${billsCost.toFixed(2)},${billsFees.toFixed(2)},${billsVol > 0 ? ((billsFees / billsVol) * 100).toFixed(2) : '0.00'}`);

  const bfxTxns = txns.filter(t => (t as any).isBusiness || t.amountSend >= 1000);
  const bfxVol = bfxTxns.reduce((s, t) => s + t.amountSend, 0);
  const bfxFees = bfxTxns.reduce((s, t) => s + t.feeAmount, 0);
  const bfxCost = bfxFees * 0.5;
  const bfxNet = bfxFees - bfxCost;
  lines.push(`Business FX,${bfxTxns.length},${bfxVol.toFixed(2)},${bfxFees.toFixed(2)},${bfxCost.toFixed(2)},${bfxNet.toFixed(2)},${bfxVol > 0 ? ((bfxNet / bfxVol) * 100).toFixed(2) : '0.00'}`);

  // Section 2: Corridor breakdown
  lines.push('');
  lines.push('=== P&L BY CORRIDOR (Remittances) ===');
  lines.push('Corridor,Transactions,Volume,Gross Fees,Provider Cost,Net Revenue,Margin %');

  const corridorMap = new Map<string, { fees: number; volume: number; count: number }>();
  for (const t of txns) {
    const key = t.currencySend + '→' + t.currencyReceive;
    const existing = corridorMap.get(key) || { fees: 0, volume: 0, count: 0 };
    existing.fees += t.feeAmount;
    existing.volume += t.amountSend;
    existing.count += 1;
    corridorMap.set(key, existing);
  }

  for (const [corridor, data] of corridorMap) {
    const cost = data.fees * 0.3;
    const net = data.fees - cost;
    const margin = data.volume > 0 ? (net / data.volume) * 100 : 0;
    lines.push(`${corridor},${data.count},${data.volume.toFixed(2)},${data.fees.toFixed(2)},${cost.toFixed(2)},${net.toFixed(2)},${margin.toFixed(2)}`);
  }

  // Section 3: Bill type breakdown
  lines.push('');
  lines.push('=== BILL PAYMENTS BY BILLER ===');
  lines.push('Biller,Payments,Total Collected,Fees Earned');

  const billerMap = new Map<string, { count: number; volume: number; fees: number }>();
  for (const b of bills) {
    const key = b.billerName || b.billType;
    const existing = billerMap.get(key) || { count: 0, volume: 0, fees: 0 };
    existing.count += 1;
    existing.volume += b.totalChargedUsd;
    existing.fees += b.convenienceFeeUsd;
    billerMap.set(key, existing);
  }

  for (const [biller, data] of billerMap) {
    lines.push(`${biller},${data.count},${data.volume.toFixed(2)},${data.fees.toFixed(2)}`);
  }

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=revenue-3-tracks.csv',
    },
  });
}