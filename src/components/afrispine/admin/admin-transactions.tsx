'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app';
import {
  Download,
  Search,
  X,
  MoreVertical,
  Eye,
  Copy,
  ArrowLeft,
  ArrowRight,
  Inbox,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Banknote,
  User,
  Phone,
  Globe,
  CreditCard,
  FileText,
  Hash,
} from 'lucide-react';

/* ─── Types ─── */
interface Transaction {
  id: string;
  reference: string;
  status: string;
  amountSend: number;
  currencySend: string;
  amountReceive: number;
  currencyReceive: string;
  fxRate: number;
  feePct: number;
  feeAmount: number;
  totalCharged: number;
  rail: string;
  providerRef: string | null;
  flwRef: string | null;
  failureReason: string | null;
  amlResult: string;
  feeConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  failedAt: string | null;
  paymentConfirmedAt: string | null;
  providerInstructedAt: string | null;
  sender: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  recipient: {
    id: string;
    fullName: string;
    phone: string;
    country: string;
    deliveryMethod: string;
  } | null;
  provider: {
    id: string;
    name: string;
    displayName: string;
  } | null;
}

interface DashboardSummary {
  todayTxns: number;
  todayVolume: number;
  todayFees: number;
  inFlight: number;
  failed: number;
}

/* ─── Status color mapping ─── */
const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  payment_pending: 'bg-gray-100 text-gray-700',
  pending: 'bg-gray-100 text-gray-700',
  quote: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
  flagged: 'bg-orange-100 text-orange-700',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'quote', label: 'Quote' },
  { value: 'payment_pending', label: 'Payment pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'flagged', label: 'Flagged' },
];

const RAIL_OPTIONS = [
  { value: 'all', label: 'All rails' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'papss', label: 'PAPSS' },
];

const RAIL_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank: 'Bank Transfer',
  ripple: 'Ripple',
  papss: 'PAPSS',
};

const RAIL_COLORS: Record<string, string> = {
  mobile_money: 'bg-emerald-100 text-emerald-700',
  bank: 'bg-blue-100 text-blue-700',
  ripple: 'bg-amber-100 text-amber-700',
  papss: 'bg-violet-100 text-violet-700',
};

/* ─── Helpers ─── */
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { GBP: '\u00a3', KES: 'KSh', USD: '$', EUR: '\u20ac', NGN: '\u20a6', GHS: 'GH\u00a2', UGX: 'USh', TZS: 'TSh' };
  const sym = symbols[currency] || currency + ' ';
  return sym + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Component ─── */
export function AdminTransactionsPage() {
  const adminSessionToken = useAppStore((s) => s.adminSessionToken);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [railFilter, setRailFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Detail drawer
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerEvents, setDrawerEvents] = useState<Array<{ eventType: string; payload: string; actor: string; createdAt: string }>>([]);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, railFilter, debouncedSearch]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!adminSessionToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (railFilter !== 'all') {
        params.set('rail', railFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const res = await fetch('/api/admin/transactions?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + adminSessionToken },
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [adminSessionToken, page, statusFilter, railFilter, debouncedSearch]);

  // Fetch dashboard summary for today stats
  const fetchSummary = useCallback(async () => {
    if (!adminSessionToken) return;
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: 'Bearer ' + adminSessionToken },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary({
          todayTxns: data.todayTxns || 0,
          todayVolume: data.todayVolume || 0,
          todayFees: data.todayFees || 0,
          inFlight: data.inFlight || 0,
          failed: data.failed || 0,
        });
      }
    } catch {
      // silently fail — summary cards are non-critical
    }
  }, [adminSessionToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handlers
  const handleExport = async () => {
    if (!adminSessionToken) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      const res = await fetch('/api/admin/transactions/export?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + adminSessionToken },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'afri-spine-transactions-' + new Date().toISOString().split('T')[0] + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Reference copied: ' + ref);
  };

  const handleOpenDetail = async (txn: Transaction) => {
    setSelectedTxn(txn);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerEvents([]);
    try {
      if (!adminSessionToken) return;
      const res = await fetch('/api/admin/transactions/' + txn.id, {
        headers: { Authorization: 'Bearer ' + adminSessionToken },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transaction) {
          setSelectedTxn(data.transaction);
          setDrawerEvents(data.transaction.events || []);
        }
      }
    } catch {
      // keep the row-level data
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRailFilter('all');
    setSearchInput('');
    setDebouncedSearch('');
  };

  const hasFilters = statusFilter !== 'all' || railFilter !== 'all' || debouncedSearch !== '';

  // Compute today delivered from summary
  const todayDelivered = summary ? (summary.todayTxns - summary.inFlight - summary.failed) : 0;

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-muted-foreground">Monitor and manage all money transfer transactions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total today</p>
              <p className="text-lg font-bold text-gray-900">
                {summary ? String(summary.todayTxns) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary ? ('\u00a3' + summary.todayVolume.toLocaleString('en-GB', { minimumFractionDigits: 2 })) : ''}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Delivered today</p>
              <p className="text-lg font-bold text-gray-900">
                {summary ? String(todayDelivered) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Failed today</p>
              <p className="text-lg font-bold text-gray-900">
                {summary ? String(summary.failed) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Loader2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">In-flight</p>
              <p className="text-lg font-bold text-gray-900">
                {summary ? String(summary.inFlight) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={railFilter}
            onValueChange={setRailFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All rails" />
            </SelectTrigger>
            <SelectContent>
              {RAIL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reference, sender, recipient..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filters
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTransactions}
            className="shrink-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Transactions table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 pb-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Reference</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Sender</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Corridor</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground text-right">Send</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground text-right">Receive</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Rail</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Provider</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground text-right">Fee</th>
                <th className="px-4 pb-3 font-medium text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={'skel-' + i} className="border-b border-border/50">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                      {hasFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          Clear filters to see all transactions
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && transactions.map((txn) => (
                <tr
                  key={txn.id}
                  onClick={() => handleOpenDetail(txn)}
                  className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatShortDate(txn.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {txn.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {txn.sender
                          ? [txn.sender.firstName, txn.sender.lastName].filter(Boolean).join(' ')
                          : 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.sender?.email || ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm">
                      {txn.currencySend} <ChevronRight className="inline h-3 w-3 text-muted-foreground mx-0.5" /> {txn.currencyReceive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    {formatCurrency(txn.amountSend, txn.currencySend)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    {formatCurrency(txn.amountReceive, txn.currencyReceive)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={RAIL_COLORS[txn.rail] || 'bg-gray-100 text-gray-700'}
                    >
                      {txn.rail === 'ripple' && '⚡ '}
                      {RAIL_LABELS[txn.rail] || txn.rail.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {txn.provider?.displayName || txn.provider?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[txn.status] || 'bg-gray-100 text-gray-700'}
                    >
                      {txn.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {formatCurrency(txn.feeAmount, txn.currencySend)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDetail(txn)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyReference(txn.reference)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy reference
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {'Showing ' + ((page - 1) * 25 + 1) + '–' + Math.min(page * 25, total) + ' of ' + total + ' transactions'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {'Page ' + page + ' of ' + pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[480px] p-0 sm:max-w-[480px]">
          {selectedTxn && (
            <>
              <SheetHeader className="px-6 pt-6 pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                    {selectedTxn.reference}
                  </span>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[selectedTxn.status] || 'bg-gray-100 text-gray-700'}
                  >
                    {selectedTxn.status.replace('_', ' ')}
                  </Badge>
                </SheetTitle>
                <SheetDescription>Transaction details</SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="px-6 py-4 space-y-6">
                  {drawerLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={'dskel-' + i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Amounts */}
                      <div className="rounded-xl border border-border p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Amounts</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Sent</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(selectedTxn.amountSend, selectedTxn.currencySend)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Received</p>
                            <p className="text-xl font-bold text-emerald-600">
                              {formatCurrency(selectedTxn.amountReceive, selectedTxn.currencyReceive)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">FX Rate</p>
                            <p className="text-sm font-medium">{selectedTxn.fxRate.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fee</p>
                            <p className="text-sm font-medium">
                              {formatCurrency(selectedTxn.feeAmount, selectedTxn.currencySend)}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({selectedTxn.feePct}%)
                              </span>
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Total charged</p>
                            <p className="text-sm font-medium">
                              {formatCurrency(selectedTxn.totalCharged, selectedTxn.currencySend)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Corridor & Rail */}
                      <div className="rounded-xl border border-border p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Routing</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Corridor</p>
                              <p className="text-sm font-medium">
                                {selectedTxn.currencySend} → {selectedTxn.currencyReceive}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Rail</p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTxn.rail.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Provider</p>
                              <p className="text-sm font-medium">
                                {selectedTxn.provider?.displayName || selectedTxn.provider?.name || 'Not assigned'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sender */}
                      {selectedTxn.sender && (
                        <div className="rounded-xl border border-border p-4">
                          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Sender</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="text-sm font-medium">
                                  {[selectedTxn.sender.firstName, selectedTxn.sender.lastName].filter(Boolean).join(' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium">{selectedTxn.sender.email}</p>
                              </div>
                            </div>
                            {selectedTxn.sender.phone && (
                              <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-sm font-medium">{selectedTxn.sender.phone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recipient */}
                      {selectedTxn.recipient && (
                        <div className="rounded-xl border border-border p-4">
                          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Recipient</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="text-sm font-medium">{selectedTxn.recipient.fullName}</p>
                              </div>
                            </div>
                            {selectedTxn.recipient.phone && (
                              <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-sm font-medium">{selectedTxn.recipient.phone}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Country</p>
                                <p className="text-sm font-medium">{selectedTxn.recipient.country}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Delivery method</p>
                                <p className="text-sm font-medium capitalize">
                                  {selectedTxn.recipient.deliveryMethod.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timeline / Events */}
                      {drawerEvents.length > 0 && (
                        <div className="rounded-xl border border-border p-4">
                          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Timeline</h3>
                          <div className="space-y-3">
                            {drawerEvents.map((evt, idx) => (
                              <div key={idx} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={'h-2.5 w-2.5 rounded-full mt-1 shrink-0 ' + (idx === drawerEvents.length - 1 ? 'bg-emerald-500' : 'bg-gray-300')} />
                                  {idx < drawerEvents.length - 1 && (
                                    <div className="w-px flex-1 bg-border mt-1" />
                                  )}
                                </div>
                                <div className="pb-3">
                                  <p className="text-sm font-medium capitalize">
                                    {evt.eventType.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(evt.createdAt)}
                                    {evt.actor && evt.actor !== 'system' ? ' by ' + evt.actor : ''}
                                  </p>
                                  {evt.payload && evt.payload !== '{}' && (() => {
                                    try {
                                      const parsed = JSON.parse(evt.payload);
                                      if (parsed.from && parsed.to) {
                                        return (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {'Status changed: ' + parsed.from + ' → ' + parsed.to}
                                            {parsed.notes ? ' (' + parsed.notes + ')' : ''}
                                          </p>
                                        );
                                      }
                                    } catch {
                                      // not JSON
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional info */}
                      <div className="rounded-xl border border-border p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Additional Info</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AML Result</span>
                            <span className="font-medium capitalize">{selectedTxn.amlResult}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee confirmed</span>
                            <span className="font-medium">{selectedTxn.feeConfirmed ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider ref</span>
                            <span className="font-mono text-xs">{selectedTxn.providerRef || selectedTxn.flwRef || '—'}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created</span>
                            <span className="text-xs">{formatDate(selectedTxn.createdAt)}</span>
                          </div>
                          {selectedTxn.paymentConfirmedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment confirmed</span>
                              <span className="text-xs">{formatDate(selectedTxn.paymentConfirmedAt)}</span>
                            </div>
                          )}
                          {selectedTxn.providerInstructedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Provider instructed</span>
                              <span className="text-xs">{formatDate(selectedTxn.providerInstructedAt)}</span>
                            </div>
                          )}
                          {selectedTxn.deliveredAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Delivered</span>
                              <span className="text-xs">{formatDate(selectedTxn.deliveredAt)}</span>
                            </div>
                          )}
                          {selectedTxn.failedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Failed</span>
                              <span className="text-xs">{formatDate(selectedTxn.failedAt)}</span>
                            </div>
                          )}
                          {selectedTxn.failureReason && (
                            <div className="mt-2">
                              <span className="text-muted-foreground text-xs">Failure reason</span>
                              <div className="flex items-center gap-1.5 mt-1 rounded-md bg-red-50 p-2 text-xs text-red-700">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {selectedTxn.failureReason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}