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

  // ─── 1. Consumer Remittances (Transaction table) ────────────────────────
  const txns = await db.transaction.findMany({
    where: {
      status: 'delivered',
      feeConfirmed: true,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { provider: true },
  });

  const remitGrossFees = txns.reduce((s, t) => s + t.feeAmount, 0);
  const remitTotalVolume = txns.reduce((s, t) => s + t.amountSend, 0);
  const remitTxCount = txns.length;
  const remitProviderCost = remitGrossFees * 0.3;
  const remitNetRevenue = remitGrossFees - remitProviderCost;
  const remitMarginPct = remitTotalVolume > 0 ? (remitNetRevenue / remitTotalVolume) * 100 : 0;

  // ─── 2. Bill Payments (BillPayment table) ───────────────────────────────
  const bills = await db.billPayment.findMany({
    where: {
      status: 'delivered',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const billsGrossFees = bills.reduce((s, b) => s + b.convenienceFeeUsd, 0);
  const billsTotalVolume = bills.reduce((s, b) => s + b.totalChargedUsd, 0);
  const billsTxCount = bills.length;
  // Bill payments: provider cost is the billAmountUsd (the actual bill paid)
  const billsProviderCost = bills.reduce((s, b) => s + b.billAmountUsd, 0);
  const billsNetRevenue = billsGrossFees; // Net = convenience fee only (we pass through the bill amount)
  const billsMarginPct = billsTotalVolume > 0 ? (billsNetRevenue / billsTotalVolume) * 100 : 0;

  // Bill payments by type
  const billsByTypeMap = new Map<string, { count: number; volume: number; fees: number }>();
  for (const b of bills) {
    const key = b.billerName || b.billType;
    const existing = billsByTypeMap.get(key) || { count: 0, volume: 0, fees: 0 };
    existing.count += 1;
    existing.volume += b.totalChargedUsd;
    existing.fees += b.convenienceFeeUsd;
    billsByTypeMap.set(key, existing);
  }
  const billsByType = Array.from(billsByTypeMap.entries())
    .map(([biller, data]) => ({ biller, ...data }))
    .sort((a, b) => b.fees - a.fees);

  // ─── 3. Business FX (Transactions with business flag or large amounts) ──
  // For now, Business FX are transactions with amountSend >= 1000 (corporate-sized)
  const businessTxns = txns.filter(t => (t as any).isBusiness || t.amountSend >= 1000);
  const bfxGrossFees = businessTxns.reduce((s, t) => s + t.feeAmount, 0);
  const bfxTotalVolume = businessTxns.reduce((s, t) => s + t.amountSend, 0);
  const bfxTxCount = businessTxns.length;
  const bfxProviderCost = bfxGrossFees * 0.5; // Higher provider cost for FX
  const bfxNetRevenue = bfxGrossFees - bfxProviderCost;
  const bfxMarginPct = bfxTotalVolume > 0 ? (bfxNetRevenue / bfxTotalVolume) * 100 : 0;

  // ─── Combined totals ────────────────────────────────────────────────────
  const grossFees = remitGrossFees + billsGrossFees + bfxGrossFees;
  const totalVolume = remitTotalVolume + billsTotalVolume + bfxTotalVolume;
  const transactionCount = remitTxCount + billsTxCount + bfxTxCount;
  const providerCosts = remitProviderCost + billsProviderCost + bfxProviderCost;
  const netMargin = remitNetRevenue + billsNetRevenue + bfxNetRevenue;
  const marginPct = totalVolume > 0 ? (netMargin / totalVolume) * 100 : 0;

  // ─── By corridor (remittances only) ─────────────────────────────────────
  const corridorMap = new Map<string, { fees: number; volume: number; count: number }>();
  for (const t of txns) {
    const key = t.currencySend + '→' + t.currencyReceive;
    const existing = corridorMap.get(key) || { fees: 0, volume: 0, count: 0 };
    existing.fees += t.feeAmount;
    existing.volume += t.amountSend;
    existing.count += 1;
    corridorMap.set(key, existing);
  }
  const byCorridor = Array.from(corridorMap.entries()).map(([corridor, data]) => ({
    corridor,
    ...data,
  }));

  // ─── By rail (remittances only) ─────────────────────────────────────────
  const railMap = new Map<string, { fees: number; volume: number; count: number }>();
  for (const t of txns) {
    const key = t.rail || 'unknown';
    const existing = railMap.get(key) || { fees: 0, volume: 0, count: 0 };
    existing.fees += t.feeAmount;
    existing.volume += t.amountSend;
    existing.count += 1;
    railMap.set(key, existing);
  }
  const byRail = Array.from(railMap.entries()).map(([rail, data]) => ({
    rail,
    ...data,
  }));

  // ─── By provider (remittances only) ─────────────────────────────────────
  const providerMap = new Map<string, { provider: string; fees: number; volume: number; count: number }>();
  for (const t of txns) {
    const key = t.providerId || 'unassigned';
    const existing = providerMap.get(key) || { provider: t.provider?.displayName || 'Unassigned', fees: 0, volume: 0, count: 0 };
    existing.fees += t.feeAmount;
    existing.volume += t.amountSend;
    existing.count += 1;
    providerMap.set(key, existing);
  }
  const byProvider = Array.from(providerMap.values()).sort((a, b) => b.count - a.count);

  // ─── Daily fees (all revenue streams combined) ──────────────────────────
  const dailyMap = new Map<string, { fees: number; volume: number; count: number; remitFees: number; billFees: number; bfxFees: number }>();
  for (const t of txns) {
    const dateStr = t.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateStr) || { fees: 0, volume: 0, count: 0, remitFees: 0, billFees: 0, bfxFees: 0 };
    existing.fees += t.feeAmount;
    existing.volume += t.amountSend;
    existing.count += 1;
    existing.remitFees += t.feeAmount;
    if ((t as any).isBusiness || t.amountSend >= 1000) {
      existing.bfxFees += t.feeAmount;
      existing.remitFees -= t.feeAmount; // subtract from remit
    }
    dailyMap.set(dateStr, existing);
  }
  for (const b of bills) {
    const dateStr = b.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateStr) || { fees: 0, volume: 0, count: 0, remitFees: 0, billFees: 0, bfxFees: 0 };
    existing.fees += b.convenienceFeeUsd;
    existing.volume += b.totalChargedUsd;
    existing.count += 1;
    existing.billFees += b.convenienceFeeUsd;
    dailyMap.set(dateStr, existing);
  }
  const dailyFees = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    // Combined
    grossFees,
    totalVolume,
    transactionCount,
    providerCosts,
    netMargin,
    marginPct,

    // Track 1: Consumer Remittances
    remit: {
      grossFees: remitGrossFees,
      totalVolume: remitTotalVolume,
      txCount: remitTxCount,
      providerCost: remitProviderCost,
      netRevenue: remitNetRevenue,
      marginPct: remitMarginPct,
    },

    // Track 2: Bill Payments
    bills: {
      grossFees: billsGrossFees,
      totalVolume: billsTotalVolume,
      txCount: billsTxCount,
      providerCost: billsProviderCost,
      netRevenue: billsNetRevenue,
      marginPct: billsMarginPct,
      byType: billsByType,
    },

    // Track 3: Business FX
    bfx: {
      grossFees: bfxGrossFees,
      totalVolume: bfxTotalVolume,
      txCount: bfxTxCount,
      providerCost: bfxProviderCost,
      netRevenue: bfxNetRevenue,
      marginPct: bfxMarginPct,
    },

    // Breakdowns
    byCorridor,
    byRail,
    byProvider,
    dailyFees,
  });
}