'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Banknote,
  BarChart3,
  ArrowLeftRight,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  Receipt,
  Building2,
  SendHorizonal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Currency flag emoji map ───
const flagEmoji: Record<string, string> = {
  GBP: '🇬🇧',
  KES: '🇰🇪',
  GHS: '🇬🇭',
  NGN: '🇳🇬',
  UGX: '🇺🇬',
  TZS: '🇹🇿',
  RWF: '🇷🇼',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  ZAR: '🇿🇦',
  XOF: '🇸🇳',
  XAF: '🇨🇲',
  CAD: '🇨🇦',
};

function getFlag(currency: string) {
  return flagEmoji[currency] || '🌍';
}

function fmtMoney(val: number) {
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'K';
  return '$' + val.toFixed(2);
}

function fmtPct(val: number) {
  return val.toFixed(2) + '%';
}

interface CorridorRow {
  corridor: string;
  fees: number;
  volume: number;
  count: number;
  providerCost: number;
  netRevenue: number;
  marginPct: number;
}

interface RailRow {
  rail: string;
  fees: number;
  volume: number;
  count: number;
}

interface DailyRow {
  date: string;
  fees: number;
  volume: number;
  count: number;
  remitFees: number;
  billFees: number;
  bfxFees: number;
}

interface ProviderRow {
  provider: string;
  fees: number;
  volume: number;
  count: number;
}

interface PnlTrack {
  grossFees: number;
  totalVolume: number;
  txCount: number;
  providerCost: number;
  netRevenue: number;
  marginPct: number;
}

interface BillTypeRow {
  biller: string;
  count: number;
  volume: number;
  fees: number;
}

interface BillsTrack extends PnlTrack {
  byType: BillTypeRow[];
}

interface RevenueData {
  grossFees: number;
  totalVolume: number;
  transactionCount: number;
  providerCosts: number;
  netMargin: number;
  marginPct: number;
  remit: PnlTrack;
  bills: BillsTrack;
  bfx: PnlTrack;
  byCorridor: CorridorRow[];
  byRail: RailRow[];
  byProvider: ProviderRow[];
  dailyFees: DailyRow[];
}

const RAIL_COLORS = ['#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#c026d3'];

export function AdminRevenuePage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>('remit');

  // Corridor sort
  const [corrSortKey, setCorrSortKey] = useState<keyof CorridorRow>('volume');
  const [corrSortDir, setCorrSortDir] = useState<'asc' | 'desc'>('desc');

  // Provider sort
  const [provSortKey, setProvSortKey] = useState<keyof ProviderRow>('count');
  const [provSortDir, setProvSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/revenue?period=' + p);
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/revenue/export?period=' + period);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'revenue-by-corridor.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      toast.error(msg);
    }
  };

  const toggleCorrSort = (key: keyof CorridorRow) => {
    if (corrSortKey === key) {
      setCorrSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setCorrSortKey(key);
      setCorrSortDir('desc');
    }
  };

  const toggleProvSort = (key: keyof ProviderRow) => {
    if (provSortKey === key) {
      setProvSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setProvSortKey(key);
      setProvSortDir('desc');
    }
  };

  // ─── Loading state ───
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  // ─── Error state ───
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-muted-foreground">Financial overview and analytics</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchData(period)}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // ─── Computed sorted data ───
  const sortedCorridors = [...data.byCorridor].map(c => ({
    ...c,
    providerCost: c.fees * 0.3,
    netRevenue: c.fees - c.fees * 0.3,
    marginPct: c.volume > 0 ? (c.fees - c.fees * 0.3) / c.volume * 100 : 0,
  })).sort((a, b) => {
    const aVal = a[corrSortKey];
    const bVal = b[corrSortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return corrSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return corrSortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const sortedProviders = [...data.byProvider].sort((a, b) => {
    const aVal = a[provSortKey];
    const bVal = b[provSortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return provSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return provSortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  // ─── Chart data ───
  const maxDailyFee = data.dailyFees.length > 0 ? Math.max(...data.dailyFees.map(d => d.fees), 1) : 1;
  const totalRailVolume = data.byRail.reduce((s, r) => s + r.volume, 0);

  let donutAngle = 0;
  const donutSegments = data.byRail.map((r, i) => {
    const pct = totalRailVolume > 0 ? (r.volume / totalRailVolume) * 100 : 0;
    const start = donutAngle;
    donutAngle += pct;
    return { ...r, pct, start, color: RAIL_COLORS[i % RAIL_COLORS.length] };
  });

  const donutGradient = donutSegments.map(s => s.color + ' ' + s.start + '% ' + (s.start + s.pct) + '%').join(', ');

  const periodBtnCls = (active: boolean) =>
    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' +
    (active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200');

  const sortIconCls = 'inline h-3 w-3 ml-1 opacity-60';

  const toggleTrack = (track: string) => {
    setExpandedTrack(prev => prev === track ? null : track);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
            <p className="text-muted-foreground">Financial overview — 3 P&L tracks</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              {['7d', '30d', '90d'].map(p => (
                <button
                  key={p}
                  className={periodBtnCls(period === p)}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ─── 3 P&L TRACK CARDS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Track 1: Consumer Transfers */}
          <Card className={expandedTrack === 'remit' ? 'ring-2 ring-emerald-500' : ''}>
            <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => toggleTrack('remit')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <SendHorizonal className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Consumer Transfers</CardTitle>
                    <p className="text-xs text-muted-foreground">Person-to-person transfers</p>
                  </div>
                </div>
                {expandedTrack === 'remit' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gross Fees</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.remit.grossFees)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.remit.totalVolume)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Revenue</p>
                  <p className="text-lg font-bold text-emerald-700">{fmtMoney(data.remit.netRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margin</p>
                  <p className="text-lg font-bold text-gray-900">{fmtPct(data.remit.marginPct)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                <span>{data.remit.txCount} transactions</span>
                <span>Provider cost: {fmtMoney(data.remit.providerCost)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Track 2: Bill Payments */}
          <Card className={expandedTrack === 'bills' ? 'ring-2 ring-amber-500' : ''}>
            <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => toggleTrack('bills')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Bill Payments</CardTitle>
                    <p className="text-xs text-muted-foreground">M-Pesa Paybill / Airtime</p>
                  </div>
                </div>
                {expandedTrack === 'bills' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Convenience Fees</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.bills.grossFees)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Collected</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.bills.totalVolume)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Revenue</p>
                  <p className="text-lg font-bold text-amber-700">{fmtMoney(data.bills.netRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Fee/Txn</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.bills.txCount > 0 ? '$' + (data.bills.grossFees / data.bills.txCount).toFixed(2) : '$0.00'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                <span>{data.bills.txCount} payments</span>
                <span>Flat fee model ($1.50/txn)</span>
              </div>
            </CardContent>
          </Card>

          {/* Track 3: Business FX */}
          <Card className={expandedTrack === 'bfx' ? 'ring-2 ring-violet-500' : ''}>
            <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => toggleTrack('bfx')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Business FX</CardTitle>
                    <p className="text-xs text-muted-foreground">Corporate &amp; bulk trades</p>
                  </div>
                </div>
                {expandedTrack === 'bfx' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gross Fees</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.bfx.grossFees)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(data.bfx.totalVolume)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Revenue</p>
                  <p className="text-lg font-bold text-violet-700">{fmtMoney(data.bfx.netRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margin</p>
                  <p className="text-lg font-bold text-gray-900">{fmtPct(data.bfx.marginPct)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                <span>{data.bfx.txCount} trades</span>
                <span>Provider cost: {fmtMoney(data.bfx.providerCost)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── EXPANDED TRACK DETAILS ────────────────────────────────────── */}
        {expandedTrack === 'bills' && data.bills.byType && data.bills.byType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill Payments Breakdown by Biller</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Biller</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Payments</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Total Collected</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Fees Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bills.byType.map(b => (
                    <tr key={b.biller} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium">{b.biller}</td>
                      <td className="py-3 pr-4 text-right">{b.count}</td>
                      <td className="py-3 pr-4 text-right">{fmtMoney(b.volume)}</td>
                      <td className="py-3 text-right font-medium text-amber-700">{fmtMoney(b.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* ─── COMBINED SUMMARY CARDS ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total Gross Fees</p>
                <p className="text-xl font-bold text-gray-900">{fmtMoney(data.grossFees)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total Volume</p>
                <p className="text-xl font-bold text-gray-900">{fmtMoney(data.totalVolume)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{data.transactionCount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Blended Net Margin</p>
                <p className="text-xl font-bold text-gray-900">{fmtPct(data.marginPct)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── STACKED DAILY CHART (3 tracks) ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CardTitle className="text-base">Daily Revenue by Stream</CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Transfers</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Bills</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-500" /> Business FX</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.dailyFees.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data for this period</p>
            ) : (
              <div className="flex items-end gap-1 h-52">
                {data.dailyFees.map(d => {
                  const total = d.remitFees + d.billFees + d.bfxFees;
                  const heightPct = maxDailyFee > 0 ? (total / maxDailyFee) * 100 : 0;
                  const billPct = total > 0 ? (d.billFees / total) * 100 : 0;
                  const bfxPct = total > 0 ? (d.bfxFees / total) * 100 : 0;
                  const remitPct = total > 0 ? (d.remitFees / total) * 100 : 0;
                  return (
                    <Tooltip key={d.date}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex-1 min-w-[2px] rounded-t overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
                          style={{
                            height: Math.max(heightPct, 2) + '%',
                            background: `linear-gradient(to top, #059669 ${remitPct}%, #059669 ${remitPct}%, #f59e0b ${remitPct + billPct}%, #f59e0b ${remitPct + billPct}%, #8b5cf6 ${remitPct + billPct + bfxPct}%)`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{d.date}</p>
                        <p>Remit: {fmtMoney(d.remitFees)}</p>
                        <p>Bills: {fmtMoney(d.billFees)}</p>
                        <p>BFX: {fmtMoney(d.bfxFees)}</p>
                        <p className="font-medium mt-1">Total: {fmtMoney(total)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
            {data.dailyFees.length > 1 && (
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">{data.dailyFees[0].date}</span>
                <span className="text-[10px] text-muted-foreground">{data.dailyFees[data.dailyFees.length - 1].date}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Daily fee bar chart - 60% (3/5) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Daily Fee Revenue (Total)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyFees.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data for this period</p>
              ) : (
                <div className="flex items-end gap-1 h-52">
                  {data.dailyFees.map(d => {
                    const heightPct = (d.fees / maxDailyFee) * 100;
                    return (
                      <Tooltip key={d.date}>
                        <TooltipTrigger asChild>
                          <div
                            className="flex-1 min-w-[2px] rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                            style={{ height: Math.max(heightPct, 2) + '%' }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{d.date}</p>
                          <p>Fees: {fmtMoney(d.fees)}</p>
                          <p>Volume: {fmtMoney(d.volume)}</p>
                          <p>Txns: {d.count}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              {data.dailyFees.length > 1 && (
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{data.dailyFees[0].date}</span>
                  <span className="text-[10px] text-muted-foreground">{data.dailyFees[data.dailyFees.length - 1].date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume by rail donut - 40% (2/5) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Volume by Rail</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byRail.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data for this period</p>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="relative h-40 w-40 rounded-full"
                    style={{
                      background: 'conic-gradient(' + (donutGradient || '#e5e7eb 0% 100%') + ')',
                    }}
                  >
                    <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{fmtMoney(totalRailVolume)}</p>
                        <p className="text-[10px] text-muted-foreground">Total Volume</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    {donutSegments.map(s => (
                      <div key={s.rail} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="capitalize text-muted-foreground">{s.rail.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{fmtMoney(s.volume)}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">{s.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* P&L by Corridor table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">P&L by Corridor (Transfers)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-border">
                    {[
                      { key: 'corridor' as const, label: 'Corridor' },
                      { key: 'count' as const, label: 'Transactions' },
                      { key: 'volume' as const, label: 'Volume' },
                      { key: 'fees' as const, label: 'Gross Fees' },
                      { key: 'providerCost' as const, label: 'Provider Cost' },
                      { key: 'netRevenue' as const, label: 'Net Revenue' },
                      { key: 'marginPct' as const, label: 'Margin' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className="pb-3 pr-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
                        onClick={() => toggleCorrSort(col.key)}
                      >
                        {col.label}
                        {corrSortKey === col.key && (
                          <ArrowUpDown className={sortIconCls} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCorridors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">No corridor data</td>
                    </tr>
                  ) : sortedCorridors.map(c => {
                    const parts = c.corridor.split('→');
                    const sendCur = parts[0] || '???';
                    const recvCur = parts[1] || '???';
                    return (
                      <tr key={c.corridor} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 whitespace-nowrap font-medium">
                          {getFlag(sendCur)} {sendCur} → {getFlag(recvCur)} {recvCur}
                        </td>
                        <td className="py-3 pr-4">{c.count}</td>
                        <td className="py-3 pr-4">{fmtMoney(c.volume)}</td>
                        <td className="py-3 pr-4">{fmtMoney(c.fees)}</td>
                        <td className="py-3 pr-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dashed underline-offset-2">
                                {fmtMoney(c.providerCost)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Simulated (30% of gross fees)</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="py-3 pr-4 font-medium text-emerald-700">{fmtMoney(c.netRevenue)}</td>
                        <td className="py-3 pr-4">{fmtPct(c.marginPct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Provider table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-border">
                    {[
                      { key: 'provider' as const, label: 'Provider' },
                      { key: 'count' as const, label: 'Transactions Routed' },
                      { key: 'volume' as const, label: 'Volume' },
                      { key: 'fees' as const, label: 'Fees Collected' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className="pb-3 pr-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
                        onClick={() => toggleProvSort(col.key)}
                      >
                        {col.label}
                        {provSortKey === col.key && (
                          <ArrowUpDown className={sortIconCls} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProviders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No provider data</td>
                    </tr>
                  ) : sortedProviders.map(p => (
                    <tr key={p.provider} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium">{p.provider}</td>
                      <td className="py-3 pr-4">{p.count}</td>
                      <td className="py-3 pr-4">{fmtMoney(p.volume)}</td>
                      <td className="py-3 pr-4 font-medium text-emerald-700">{fmtMoney(p.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}