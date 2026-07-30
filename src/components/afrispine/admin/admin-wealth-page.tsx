'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Wallet,
  Users,
  ShoppingCart,
  DollarSign,
  Globe,
  TrendingUp,
  Building2,
  FileDown,
  Package,
  CreditCard,
  ArrowRightLeft,
  Landmark,
  PiggyBank,
  Crown,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { EXCHANGES, getIpoRegistrationStats, STOCKS, type StockQuote } from '@/lib/wealth-data';
import { useAppStore } from '@/stores/app';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IpoRegistration {
  id: string;
  email: string;
  fullName: string;
  country: string;
  intendedAmountUsd: string;
  currency: string;
  createdAt: string;
}

interface AdminStats {
  totalAumUsd: number;
  totalInvestors: number;
  totalOrders: number;
  revenueThisMonth: number;
}

interface AdminOrder {
  id: string;
  reference: string;
  senderId: string;
  sender?: { email: string };
  ticker: string;
  exchange: string;
  companyName: string;
  orderDirection: string;
  status: string;
  amountGbp: number;
  totalChargedGbp: number;
  sharesRequested: number;
  assetType: string;
  createdAt: string;
}

interface AdminPortfolio {
  id: string;
  senderId: string;
  sender?: { email: string; firstName: string; lastName: string };
  status: string;
  totalInvestedUsd: number;
  totalValueUsd: number;
  totalGainLossUsd: number;
  dividendsEarnedUsd: number;
  createdAt: string;
}

interface AdminDividend {
  id: string;
  senderId: string;
  sender?: { email: string };
  ticker: string;
  companyName: string;
  sharesHeld: number;
  amountUsd: number;
  withheldTaxPct: number;
  withheldTaxAmountUsd: number;
  netUsd: number;
  reinvested: boolean;
  payDate: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Tab config                                                         */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'ipo', label: 'IPO Registrations', icon: FileDown },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'portfolios', label: 'Portfolios', icon: Users },
  { key: 'bonds', label: 'Bonds', icon: Building2 },
  { key: 'dividends', label: 'Dividends', icon: PiggyBank },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'top-picks', label: 'Top Picks', icon: TrendingUp },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ------------------------------------------------------------------ */
/*  Revenue streams data                                               */
/* ------------------------------------------------------------------ */

const REVENUE_STREAMS = [
  {
    name: 'Trading Fees',
    description: 'Flat fee or percentage per equity trade',
    tiers: '£1.50 flat (< £500) · 0.5% (£500–£10k) · 0.3% (> £10k)',
    frequency: 'Per trade',
    icon: ArrowRightLeft,
  },
  {
    name: 'FX Conversion Margin',
    description: 'Margin on GBP → local currency conversion for trade settlement',
    tiers: '1.5% per trade',
    frequency: 'Per trade',
    icon: CreditCard,
  },
  {
    name: 'AUM Management Fee',
    description: 'Annual fee on assets under management, billed quarterly',
    tiers: '0.5% per year (billed quarterly)',
    frequency: 'Quarterly',
    icon: Landmark,
  },
  {
    name: 'IPO Subscription Fee',
    description: 'Fee applied to IPO allotment subscriptions',
    tiers: '$5 flat + 0.5% of subscription amount',
    frequency: 'Per IPO',
    icon: Building2,
  },
  {
    name: 'Dividend Reinvestment',
    description: 'Fee on automatic dividend reinvestment plans (DRIP)',
    tiers: '0.25% of dividend amount',
    frequency: 'Per dividend',
    icon: PiggyBank,
  },
  {
    name: 'Premium (Wealth Pro)',
    description: 'Monthly subscription for premium features: real-time data, research, priority support',
    tiers: '£9.99/month',
    frequency: 'Monthly',
    icon: Crown,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtGbp(n: number) {
  return `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function orderStatusBadge(status: string) {
  switch (status) {
    case 'pending':
    case 'payment_pending':
      return <Badge className="bg-amber-100 text-amber-700 text-xs">{status === 'payment_pending' ? 'PAYMENT PENDING' : 'PENDING'}</Badge>;
    case 'submitted':
      return <Badge className="bg-blue-100 text-blue-700 text-xs">SUBMITTED</Badge>;
    case 'filled':
      return <Badge className="bg-emerald-100 text-emerald-700 text-xs">FILLED</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 text-xs">FAILED</Badge>;
    case 'settled':
      return <Badge className="bg-emerald-100 text-emerald-700 text-xs">SETTLED</Badge>;
    case 'refunded':
      return <Badge variant="outline" className="text-xs">REFUNDED</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{(status || '').toUpperCase()}</Badge>;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminWealthPage() {
  const { navigate } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // IPO registrations state
  const [registrations, setRegistrations] = useState<IpoRegistration[]>([]);
  const [ipoCount, setIpoCount] = useState<number>(0);
  const [ipoLoading, setIpoLoading] = useState(true);

  // Admin stats
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalAumUsd: 0,
    totalInvestors: 0,
    totalOrders: 0,
    revenueThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Portfolios state
  const [portfolios, setPortfolios] = useState<AdminPortfolio[]>([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);

  // Bonds state
  const [bondOrders, setBondOrders] = useState<AdminOrder[]>([]);
  const [bondsLoading, setBondsLoading] = useState(false);

  // Dividends state
  const [dividends, setDividends] = useState<AdminDividend[]>([]);
  const [dividendsLoading, setDividendsLoading] = useState(false);

  // Top picks featured state (UI only)
  const [featuredTickers, setFeaturedTickers] = useState<Set<string>>(new Set());

  const ipoStats = getIpoRegistrationStats();

  /* ── Fetchers ──────────────────────────────────────────────── */

  const fetchRegistrations = useCallback(async () => {
    try {
      setIpoLoading(true);
      const res = await fetch('/api/markets/dangote-ipo/register');
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations ?? []);
        setIpoCount(data.count ?? 0);
      }
    } catch {
      // Silently fail
    } finally {
      setIpoLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/wealth/stats');
      if (res.ok) {
        const data = await res.json();
        setAdminStats({
          totalAumUsd: data.totalAumUsd ?? 0,
          totalInvestors: data.totalInvestors ?? 0,
          totalOrders: data.totalOrders ?? 0,
          revenueThisMonth: data.revenueThisMonth ?? 0,
        });
      }
    } catch {
      // Endpoints may not exist yet — show defaults
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/admin/wealth/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      // Endpoint may not exist
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchPortfolios = useCallback(async () => {
    setPortfoliosLoading(true);
    try {
      const res = await fetch('/api/admin/wealth/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data.accounts ?? []);
      }
    } catch {
      // Endpoint may not exist
    } finally {
      setPortfoliosLoading(false);
    }
  }, []);

  const fetchBonds = useCallback(async () => {
    setBondsLoading(true);
    try {
      const res = await fetch('/api/admin/wealth/orders');
      if (res.ok) {
        const data = await res.json();
        setBondOrders((data.orders ?? []).filter((o: AdminOrder) => o.assetType === 'bond'));
      }
    } catch {
      // Endpoint may not exist
    } finally {
      setBondsLoading(false);
    }
  }, []);

  const fetchDividends = useCallback(async () => {
    setDividendsLoading(true);
    try {
      const res = await fetch('/api/admin/wealth/dividends');
      if (res.ok) {
        const data = await res.json();
        setDividends(data.dividends ?? []);
      }
    } catch {
      // Endpoint may not exist
    } finally {
      setDividendsLoading(false);
    }
  }, []);

  /* ── Tab effects ───────────────────────────────────────────── */

  useEffect(() => {
    if (activeTab === 'ipo') fetchRegistrations();
  }, [activeTab, fetchRegistrations]);

  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === 'portfolios') fetchPortfolios();
  }, [activeTab, fetchPortfolios]);

  useEffect(() => {
    if (activeTab === 'bonds') fetchBonds();
  }, [activeTab, fetchBonds]);

  useEffect(() => {
    if (activeTab === 'dividends') fetchDividends();
  }, [activeTab, fetchDividends]);

  const handleExportCsv = () => {
    console.log('Export CSV — registrations:', registrations);
  };

  const toggleFeatured = (ticker: string) => {
    setFeaturedTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Overview tab                                                     */
  /* ---------------------------------------------------------------- */

  const renderOverview = () => {
    const stats = [
      {
        label: 'Total AUM',
        value: statsLoading ? undefined : (adminStats.totalAumUsd > 0 ? fmtUsd(adminStats.totalAumUsd) : '$0'),
        sub: adminStats.totalAumUsd > 0 ? 'Live investments' : 'No investments yet',
        icon: Wallet,
      },
      {
        label: 'Total Investors',
        value: statsLoading ? undefined : String(adminStats.totalInvestors || 0),
        sub: adminStats.totalInvestors > 0 ? 'Active accounts' : 'Awaiting launch',
        icon: Users,
      },
      {
        label: 'Total Orders',
        value: statsLoading ? undefined : String(adminStats.totalOrders || 0),
        sub: adminStats.totalOrders > 0 ? 'All time' : 'Phase 2',
        icon: ShoppingCart,
      },
      {
        label: 'Revenue This Month',
        value: statsLoading ? undefined : (adminStats.revenueThisMonth > 0 ? fmtGbp(adminStats.revenueThisMonth) : '£0'),
        sub: adminStats.revenueThisMonth > 0 ? 'Fees collected' : 'No activity yet',
        icon: DollarSign,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    {stat.value === undefined ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Phase note — updated to Phase 2 */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <p className="text-sm text-emerald-800">
              Wealth product is in <span className="font-semibold">Phase 2 — Live investing active</span>.
              Users can browse exchanges, place orders, and track portfolios.
            </p>
          </CardContent>
        </Card>

        {/* Exchange coverage grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exchange Coverage</CardTitle>
            <CardDescription>
              {EXCHANGES.length} African exchanges available — 2025 year-to-date returns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXCHANGES.map((ex) => {
                const stockCount = (STOCKS[ex.id] ?? []).length;
                const isPositive = ex.return2025.startsWith('+');
                return (
                  <div
                    key={ex.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">
                      {ex.flag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.indexName} · {stockCount} stocks · MCap {ex.marketCapUsd}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                    >
                      {ex.return2025}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  IPO Registrations tab                                            */
  /* ---------------------------------------------------------------- */

  const renderIpoRegistrations = () => (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Registrations (Live DB)</p>
              <p className="text-xl font-bold text-gray-900">
                {ipoLoading ? <Skeleton className="inline-block h-7 w-12" /> : ipoCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diaspora Demand (Simulated)</p>
              <p className="text-xl font-bold text-gray-900">
                {ipoStats.total.toLocaleString()} from {ipoStats.countries} countries
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Country</p>
              <p className="text-xl font-bold text-gray-900">
                {ipoStats.byCountry[0]?.country ?? '—'} ({ipoStats.byCountry[0]?.count ?? 0})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration table */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Dangote IPO Registrations</CardTitle>
            <CardDescription>
              {ipoLoading
                ? 'Loading registrations…'
                : `Showing ${registrations.length} registration${registrations.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-fit shrink-0"
            onClick={handleExportCsv}
            disabled={ipoLoading || registrations.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {ipoLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm">No IPO registrations yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border">
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Country</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Amount</th>
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-muted-foreground">{r.email}</td>
                        <td className="py-3 pr-4 font-medium">{r.fullName || '—'}</td>
                        <td className="py-3 pr-4">{r.country || '—'}</td>
                        <td className="py-3 pr-4 text-right font-medium">
                          {r.intendedAmountUsd
                            ? `${r.currency === 'USD' ? '$' : r.currency}${Number(r.intendedAmountUsd).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diaspora demand breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diaspora Demand by Country (Simulated)</CardTitle>
          <CardDescription>Estimated demand from getIpoRegistrationStats()</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ipoStats.byCountry.map((c) => {
              const pct = Math.round((c.count / ipoStats.total) * 100);
              return (
                <div key={c.country} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-sm text-gray-700 truncate">{c.country}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-semibold text-gray-900">
                    {c.count.toLocaleString()}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Orders tab                                                       */
  /* ---------------------------------------------------------------- */

  const renderOrders = () => {
    if (ordersLoading) {
      return (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (orders.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Investment orders will appear here once users start trading.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Investment Orders</CardTitle>
          <CardDescription>Showing {orders.length} order{orders.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Sender</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Ticker</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Direction</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Amount (GBP)</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.reference}</td>
                      <td className="px-4 py-3 text-xs">{o.sender?.email ?? o.senderId.slice(0, 8) + '...'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-xs">
                          {o.ticker}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={o.orderDirection === 'BUY' ? 'default' : 'secondary'} className={`text-xs ${o.orderDirection === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {o.orderDirection}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{orderStatusBadge(o.status)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{fmtGbp(o.totalChargedGbp || o.amountGbp)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Portfolios tab                                                   */
  /* ---------------------------------------------------------------- */

  const renderPortfolios = () => {
    if (portfoliosLoading) {
      return (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (portfolios.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No portfolios yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Investment portfolios will appear here once users activate their accounts.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investment Portfolios</CardTitle>
          <CardDescription>Showing {portfolios.length} account{portfolios.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Sender</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Joined</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Total Invested</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Total Value</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Gain/Loss</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Dividends</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((p) => {
                    const isUp = p.totalGainLossUsd >= 0;
                    const gainPct = p.totalInvestedUsd > 0 ? (p.totalGainLossUsd / p.totalInvestedUsd) * 100 : 0;
                    return (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-medium">
                          {p.sender?.email ?? p.senderId.slice(0, 8) + '...'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={p.status === 'active' ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{fmtUsd(p.totalInvestedUsd)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-medium">{fmtUsd(p.totalValueUsd)}</td>
                        <td className={`px-4 py-3 text-right font-mono text-xs ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isUp ? '+' : ''}{fmtUsd(p.totalGainLossUsd)} ({isUp ? '+' : ''}{gainPct.toFixed(1)}%)
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{fmtUsd(p.dividendsEarnedUsd)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Bonds tab                                                        */
  /* ---------------------------------------------------------------- */

  const renderBonds = () => {
    if (bondsLoading) {
      return (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (bondOrders.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No bond orders yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Bond orders will appear here once users invest in bonds.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bond Orders</CardTitle>
          <CardDescription>Showing {bondOrders.length} bond order{bondOrders.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Sender</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Bond</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Direction</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Amount (GBP)</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bondOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.reference}</td>
                      <td className="px-4 py-3 text-xs">{o.sender?.email ?? o.senderId.slice(0, 8) + '...'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-mono text-xs">{o.ticker}</Badge>
                          <span className="text-xs text-muted-foreground">{o.companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={o.orderDirection === 'BUY' ? 'default' : 'secondary'} className={`text-xs ${o.orderDirection === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {o.orderDirection}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{orderStatusBadge(o.status)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{fmtGbp(o.totalChargedGbp || o.amountGbp)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Dividends tab                                                    */
  /* ---------------------------------------------------------------- */

  const renderDividends = () => {
    if (dividendsLoading) {
      return (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (dividends.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                <PiggyBank className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No dividends yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Dividend payments will appear here once they are distributed to investors.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dividend Payments</CardTitle>
          <CardDescription>Showing {dividends.length} payment{dividends.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Sender</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Stock</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Shares</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Amount (USD)</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Tax</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Net (USD)</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">Reinvested?</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {d.payDate
                          ? new Date(d.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : d.createdAt
                            ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">{d.sender?.email ?? d.senderId.slice(0, 8) + '...'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-[10px] px-1.5 py-0">{d.ticker}</Badge>
                          <span className="text-xs">{d.companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{Math.floor(d.sharesHeld).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{fmtUsd(d.amountUsd)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-red-500">
                        {d.withheldTaxPct > 0 ? `-${fmtUsd(d.withheldTaxAmountUsd)} (${d.withheldTaxPct}%)` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{fmtUsd(d.netUsd)}</td>
                      <td className="px-4 py-3 text-center">
                        {d.reinvested ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">No</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Revenue tab                                                      */
  /* ---------------------------------------------------------------- */

  const renderRevenue = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Streams</CardTitle>
          <CardDescription>
            6 planned revenue streams for the AfriSpine Wealth product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Stream</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Fee Structure</th>
                  <th className="pb-3 font-medium text-muted-foreground">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_STREAMS.map((stream) => {
                  const Icon = stream.icon;
                  return (
                    <tr
                      key={stream.name}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">{stream.name}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground max-w-xs">{stream.description}</td>
                      <td className="py-4 pr-4">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          {stream.tiers}
                        </Badge>
                      </td>
                      <td className="py-4 text-muted-foreground whitespace-nowrap">{stream.frequency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue potential note */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-start gap-3 pt-6">
          <TrendingUp className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 mb-1">Revenue Potential</p>
            <p className="text-sm text-emerald-700">
              With {ipoStats.total.toLocaleString()} pre-registrations and an estimated 15% conversion,
              projected first-year revenue from trading fees alone could reach
              <span className="font-bold"> £45,000+ </span>
              assuming an average trade size of £2,000. Premium subscriptions at £9.99/month
              with 200 subscribers add an additional <span className="font-bold">£23,976/year</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Top Picks tab                                                    */
  /* ---------------------------------------------------------------- */

  const renderTopPicks = () => {
    const allStocks: (StockQuote & { exchangeId: string })[] = [];
    for (const [exchangeId, stocks] of Object.entries(STOCKS)) {
      for (const stock of stocks) {
        allStocks.push({ ...stock, exchangeId });
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Stock Curation — Top Picks</CardTitle>
            <CardDescription>
              {allStocks.length} stocks across {EXCHANGES.length} exchanges. Toggle &quot;Featured&quot; to highlight for users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap w-16">Featured</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Stock</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Exchange</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Sector</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Price</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">YTD Return</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Div Yield</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">P/E</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStocks.map((s) => {
                      const exchange = EXCHANGES.find((e) => e.id === s.exchangeId);
                      const returnPct = s.changePct;
                      const isUp = returnPct >= 0;
                      const isFeatured = featuredTickers.has(s.ticker);

                      return (
                        <tr key={`${s.ticker}-${s.exchangeId}`} className={`border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${isFeatured ? 'bg-emerald-50/50' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            <Switch
                              checked={isFeatured}
                              onCheckedChange={() => toggleFeatured(s.ticker)}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 text-xs">{s.name}</span>
                                <Badge variant="secondary" className="ml-1.5 bg-emerald-100 text-emerald-700 font-mono text-[10px] px-1 py-0">
                                  {s.ticker}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {exchange?.name ?? s.exchange}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.sector}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {exchange?.currency ?? ''} {s.price.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isUp ? '+' : ''}{returnPct.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                            {s.dividendYield !== null ? `${s.dividendYield}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                            {s.peRatio !== null ? s.peRatio.toFixed(1) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wealth Management</h1>
        <p className="text-muted-foreground">
          African equities, IPO management, and investment revenue
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-background text-gray-900 shadow-sm'
                  : 'text-muted-foreground hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'ipo' && renderIpoRegistrations()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'portfolios' && renderPortfolios()}
      {activeTab === 'bonds' && renderBonds()}
      {activeTab === 'dividends' && renderDividends()}
      {activeTab === 'revenue' && renderRevenue()}
      {activeTab === 'top-picks' && renderTopPicks()}
    </div>
  );
}