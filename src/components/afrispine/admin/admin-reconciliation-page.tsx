'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Wallet,
  Banknote,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

interface ReconciliationTotals {
  ticketSales: number;
  platformFees: number;
  creatorPayouts: number;
}

interface CreatorBreakdown {
  creatorId: string;
  handle: string;
  ledgerBalance: number;
  walletBalance: number;
  difference: number;
}

interface LedgerEntry {
  id: string;
  createdAt: string;
  entryType: string;
  direction: string;
  amountKes: number;
  creatorHandle: string;
  reference: string;
}

interface ReconciliationData {
  totals: ReconciliationTotals;
  creatorBreakdown: CreatorBreakdown[];
  entries: LedgerEntry[];
  totalEntries: number;
}

function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const ENTRY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'ticket_sale', label: 'Ticket Sale' },
  { value: 'platform_fee', label: 'Platform Fee' },
  { value: 'creator_payout', label: 'Creator Payout' },
  { value: 'referral_commission', label: 'Referral Commission' },
];

const PAGE_SIZE = 50;

export function AdminReconciliationPage() {
  const navigate = useAppStore((s) => s.navigate);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [entryFilter, setEntryFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortDesc, setSortDesc] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reconciliation');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logoutAdmin();
          return;
        }
        toast.error('Failed to load reconciliation data');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [logoutAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEntries = data?.entries.filter((e) =>
    entryFilter === 'all' ? true : e.entryType === entryFilter
  ) ?? [];

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const sortedBreakdown = [...(data?.creatorBreakdown ?? [])].sort((a, b) => {
    const absDiff = (v: CreatorBreakdown) => Math.abs(v.difference);
    return sortDesc ? absDiff(b) - absDiff(a) : absDiff(a) - absDiff(b);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">Failed to load reconciliation data.</div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Ticket Sales',
      value: data.totals.ticketSales,
      icon: TrendingUp,
      iconBg: 'bg-emerald-900/50',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Total Platform Fees',
      value: data.totals.platformFees,
      icon: Banknote,
      iconBg: 'bg-amber-900/40',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-400',
    },
    {
      label: 'Total Creator Payouts',
      value: data.totals.creatorPayouts,
      icon: Wallet,
      iconBg: 'bg-red-900/40',
      iconColor: 'text-red-400',
      valueColor: 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ledger Reconciliation</h1>
        <p className="text-gray-400">Compare ledger balances with creator wallet balances</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-gray-800 border-gray-700">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">{card.label}</p>
                  <p className={`text-xl font-bold ${card.valueColor}`}>{formatKes(card.value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-Creator Breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-400" />
            Per-Creator Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No creator data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 pr-4 font-medium text-gray-400">Creator Handle</th>
                    <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Ledger Balance</th>
                    <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Wallet Balance</th>
                    <th
                      className="pb-3 font-medium text-gray-400 text-right cursor-pointer hover:text-gray-200 transition-colors"
                      onClick={() => setSortDesc(!sortDesc)}
                    >
                      Difference {sortDesc ? '↓' : '↑'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((row) => {
                    const hasDiscrepancy = row.difference !== 0;
                    return (
                      <tr
                        key={row.creatorId}
                        className={`border-b border-gray-700/50 last:border-0 transition-colors ${
                          hasDiscrepancy
                            ? 'bg-amber-900/15 hover:bg-amber-900/25'
                            : 'hover:bg-gray-700/40'
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <span className="text-gray-200 font-medium">@{row.handle}</span>
                          {hasDiscrepancy && (
                            <AlertTriangle className="inline h-3.5 w-3.5 text-amber-400 ml-2" />
                          )}
                        </td>
                        <td className="py-3 pr-4 font-mono text-gray-300 text-right">
                          {formatKes(row.ledgerBalance)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-gray-300 text-right">
                          {formatKes(row.walletBalance)}
                        </td>
                        <td className={`py-3 font-mono text-right font-medium ${
                          row.difference > 0
                            ? 'text-emerald-400'
                            : row.difference < 0
                              ? 'text-red-400'
                              : 'text-gray-500'
                        }`}>
                          {row.difference > 0 ? '+' : ''}{formatKes(row.difference)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Ledger Entries */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base text-white">Recent Ledger Entries</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{filteredEntries.length} entries</span>
            <Select value={entryFilter} onValueChange={(v) => { setEntryFilter(v); setVisibleCount(PAGE_SIZE); }}>
              <SelectTrigger className="w-[160px] border-gray-600 bg-gray-900 text-gray-200 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-gray-200 focus:bg-gray-800 focus:text-white">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {visibleEntries.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No entries found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 pr-4 font-medium text-gray-400">Date</th>
                      <th className="pb-3 pr-4 font-medium text-gray-400">Type</th>
                      <th className="pb-3 pr-4 font-medium text-gray-400">Direction</th>
                      <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Amount (KES)</th>
                      <th className="pb-3 pr-4 font-medium text-gray-400">Creator</th>
                      <th className="pb-3 font-medium text-gray-400">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEntries.map((entry) => {
                      const typeBadge: Record<string, string> = {
                        ticket_sale: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
                        platform_fee: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
                        creator_payout: 'bg-red-900/60 text-red-300 border border-red-700/50',
                        referral_commission: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
                      };
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors"
                        >
                          <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="secondary" className={typeBadge[entry.entryType] || 'bg-gray-700 text-gray-300'}>
                              {entry.entryType.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {entry.direction === 'credit' ? (
                              <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Credit
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                                <ArrowDownRight className="h-3.5 w-3.5" /> Debit
                              </span>
                            )}
                          </td>
                          <td className={`py-3 pr-4 font-mono text-right font-medium ${
                            entry.direction === 'credit' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {entry.direction === 'credit' ? '+' : '-'}{formatKes(entry.amountKes)}
                          </td>
                          <td className="py-3 pr-4 text-gray-300">@{entry.creatorHandle}</td>
                          <td className="py-3 font-mono text-xs text-gray-500 max-w-[180px] truncate">
                            {entry.reference}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-sm"
                  >
                    Load More ({filteredEntries.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
