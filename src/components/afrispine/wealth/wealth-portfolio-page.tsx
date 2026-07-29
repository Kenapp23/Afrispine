'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  BarChart3,
  Loader2,
  Clock,
  Package,
  Target,
  Plus,
  Pause,
  PlayCircle,
  Settings2,
  CircleDollarSign,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────── */

interface Holding {
  ticker: string;
  exchange: string;
  companyName: string;
  shares: number;
  avgCostUsd: number;
  currentPriceUsd: number;
  marketValueUsd: number;
  gainLossUsd: number;
  gainLossPct: number;
}

interface AccountInfo {
  id: string;
  status: string;
  totalInvestedUsd: number;
  totalValueUsd: number;
  totalGainLossUsd: number;
  dividendsEarnedUsd: number;
  autoReinvestDividends: boolean;
  createdAt: string;
}

interface PortfolioData {
  totalValueUsd: number;
  cashBalanceUsd: number;
  holdings: Holding[];
  source: string;
}

interface PendingOrder {
  id: string;
  reference: string;
  ticker: string;
  exchange: string;
  companyName: string;
  orderDirection: string;
  status: string;
  sharesRequested: number;
  amountGbp: number;
  totalChargedGbp: number;
  createdAt: string;
}

interface InvestmentGoalData {
  id: string;
  goalType: string;
  goalName: string;
  targetAmountUsd: number;
  targetDate: string | null;
  currentValueUsd: number;
  monthlyContributionUsd: number;
  autoInvestEnabled: boolean;
  autoInvestDayOfMonth: number;
  status: string;
  achievedAt: string | null;
  createdAt: string;
  autoInvestRules: { id: string; ticker: string; exchange: string; amountGbp: number; isActive: boolean }[];
}

interface DividendRecord {
  id: string;
  ticker: string;
  exchange: string;
  companyName: string;
  sharesHeld: number;
  dividendPerShareLocal: number;
  amountLocal: number;
  currencyLocal: string;
  amountUsd: number;
  withheldTaxPct: number;
  withheldTaxAmountUsd: number;
  netUsd: number;
  exDate: string | null;
  payDate: string | null;
  receivedAt: string | null;
  reinvested: boolean;
  createdAt: string;
}

/* ── Helpers ──────────────────────────────────────────────────── */

const GBP_USD = 1.27;

function usdToGbp(usd: number) {
  return usd / GBP_USD;
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtGbp(n: number) {
  return `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCompanyInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase();
}

function getStatusTag(status: string) {
  switch (status) {
    case 'submitted':
      return <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">SUBMITTED</Badge>;
    case 'payment_pending':
      return <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">PENDING</Badge>;
    case 'filled':
      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">LIVE</Badge>;
    case 'settled':
      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">SETTLED</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{(status || '').toUpperCase()}</Badge>;
  }
}

/* ── Bar chart SVG ────────────────────────────────────────────── */

function PerformanceBarChart({ data }: { data: { month: string; value: number }[] }) {
  const hasValues = data.some((d) => d.value > 0);
  if (!hasValues) {
    return (
      <div className="flex items-end justify-between h-48 px-4">
        {data.map((d) => (
          <div key={d.month} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-6 sm:w-10 bg-gray-200 rounded-t" style={{ height: '4px' }} />
            <span className="text-xs text-muted-foreground">{d.month}</span>
          </div>
        ))}
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const h = 192;

  return (
    <div className="flex items-end justify-between h-48 px-4">
      {data.map((d) => {
        const barH = Math.max(4, (d.value / maxVal) * h);
        const isUp = d.value >= 0;
        return (
          <div key={d.month} className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-6 sm:w-10 rounded-t transition-all ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ height: `${barH}px` }}
            />
            <span className="text-xs text-muted-foreground">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────── */

export function WealthPortfolioPage() {
  const navigate = useAppStore((s) => s.navigate);

  // State
  const [loading, setLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [autoReinvestLoading, setAutoReinvestLoading] = useState(false);

  // Sell modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [sellShares, setSellShares] = useState('');
  const [sellSubmitting, setSellSubmitting] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<InvestmentGoalData[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [newGoalType, setNewGoalType] = useState('wealth');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newGoalMonthly, setNewGoalMonthly] = useState('');
  const [newGoalAutoInvest, setNewGoalAutoInvest] = useState(false);
  const [newGoalAutoInvestDay, setNewGoalAutoInvestDay] = useState('1');

  // Monthly performance (from portfolio data if available, else defaults)
  const monthlyPerformance = [
    { month: 'Jan', value: 0 },
    { month: 'Feb', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Apr', value: 0 },
    { month: 'May', value: 0 },
    { month: 'Jun', value: 0 },
  ];

  // Quick-pick goal options
  const quickPickGoals = [
    { icon: '🎓', label: 'Education fund', type: 'education', name: "Children's Education Fund" },
    { icon: '🏠', label: 'Land/property', type: 'property', name: 'Land or Property Purchase' },
    { icon: '🌍', label: 'Retirement', type: 'retirement', name: 'Retirement Savings' },
    { icon: '💼', label: 'Business capital', type: 'business', name: 'Business Capital Fund' },
    { icon: '📈', label: 'Wealth building', type: 'wealth', name: 'General Wealth Building' },
    { icon: '🎁', label: 'Legacy', type: 'legacy', name: 'Family Legacy Fund' },
  ];

  const goalTypeLabels: Record<string, string> = {
    education: 'Education',
    property: 'Property',
    retirement: 'Retirement',
    business: 'Business',
    wealth: 'Wealth',
    legacy: 'Legacy',
  };

  // Derived
  const hasInvestments = (portfolio?.holdings?.length ?? 0) > 0;
  const holdings = portfolio?.holdings ?? [];
  const totalValueUsd = portfolio?.totalValueUsd ?? accountInfo?.totalValueUsd ?? 0;
  const totalInvestedUsd = accountInfo?.totalInvestedUsd ?? 0;
  const totalGainLossUsd = accountInfo?.totalGainLossUsd ?? 0;
  const totalGainLossPct = totalInvestedUsd > 0 ? (totalGainLossUsd / totalInvestedUsd) * 100 : 0;
  const isProfit = totalGainLossUsd >= 0;
  const dividendsEarnedUsd = accountInfo?.dividendsEarnedUsd ?? 0;

  // Show pending orders in 'submitted' or 'payment_pending' state
  const visiblePendingOrders = pendingOrders.filter(
    (o) => o.status === 'submitted' || o.status === 'payment_pending'
  );

  /* ── Fetch account status ───────────────────────────────────── */
  const fetchAccountStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wealth/account/status');
      if (!res.ok) throw new Error('Failed to fetch account status');
      const data = await res.json();
      if (!data.hasAccount) {
        navigate('wealth-landing');
        return;
      }
      setAccountInfo(data.account);
      setAutoReinvest(data.account?.autoReinvestDividends ?? false);
      return data.account;
    } catch (e) {
      console.error('[portfolio] account status error:', e);
      navigate('wealth-landing');
      return null;
    }
  }, [navigate]);

  /* ── Fetch portfolio ────────────────────────────────────────── */
  const fetchPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const res = await fetch('/api/wealth/portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.dividends) setDividends(data.dividends);
      if (data.pendingOrders) setPendingOrders(data.pendingOrders);
      if (data.account) {
        setAccountInfo((prev) => (prev ? { ...prev, ...data.account } : data.account));
        setAutoReinvest(data.account.autoReinvestDividends ?? false);
      }
    } catch (e) {
      console.error('[portfolio] fetch error:', e);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  /* ── Fetch goals ────────────────────────────────────────────── */
  const fetchGoals = useCallback(async () => {
    setGoalsLoading(true);
    try {
      const res = await fetch('/api/wealth/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals ?? []);
      }
    } catch (e) {
      console.error('[goals] fetch error:', e);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  /* ── On mount ───────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const acct = await fetchAccountStatus();
      if (acct) await fetchPortfolio();
      await fetchGoals();
      setLoading(false);
    })();
  }, [fetchAccountStatus, fetchPortfolio, fetchGoals]);

  /* ── Auto-reinvest toggle ───────────────────────────────────── */
  const handleAutoReinvestToggle = async (checked: boolean) => {
    setAutoReinvestLoading(true);
    try {
      const res = await fetch('/api/wealth/auto-reinvest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      });
      if (res.ok) {
        setAutoReinvest(checked);
      }
    } catch (e) {
      console.error('[auto-reinvest] toggle error:', e);
    } finally {
      setAutoReinvestLoading(false);
    }
  };

  /* ── Sell modal handlers ────────────────────────────────────── */
  const openSellModal = (holding: Holding) => {
    setSellHolding(holding);
    setSellShares(String(Math.floor(holding.shares)));
    setSellModalOpen(true);
  };

  const handleSellConfirm = async () => {
    if (!sellHolding || !accountInfo || !sellShares) return;
    const shares = parseFloat(sellShares);
    if (isNaN(shares) || shares <= 0) return;

    setSellSubmitting(true);
    try {
      const res = await fetch('/api/wealth/order/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: sellHolding.ticker,
          exchange: sellHolding.exchange,
          shares,
          investmentAccountId: accountInfo.id,
        }),
      });
      if (res.ok) {
        setSellModalOpen(false);
        setSellHolding(null);
        // Refresh portfolio
        await fetchPortfolio();
      }
    } catch (e) {
      console.error('[sell] error:', e);
    } finally {
      setSellSubmitting(false);
    }
  };

  const estimatedProceeds = (() => {
    if (!sellHolding || !sellShares) return 0;
    const shares = parseFloat(sellShares) || 0;
    return shares * sellHolding.currentPriceUsd;
  })();

  /* ── Goal handlers ─────────────────────────────────────────── */
  const openCreateGoalDialog = (type?: string, name?: string) => {
    if (type) setNewGoalType(type);
    if (name) setNewGoalName(name);
    setCreateGoalDialogOpen(true);
  };

  const resetGoalForm = () => {
    setNewGoalType('wealth');
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setNewGoalMonthly('');
    setNewGoalAutoInvest(false);
    setNewGoalAutoInvestDay('1');
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim()) return;
    setGoalSubmitting(true);
    try {
      const res = await fetch('/api/wealth/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalType: newGoalType,
          goalName: newGoalName.trim(),
          targetAmountUsd: parseFloat(newGoalTarget) || 0,
          targetDate: newGoalDate || null,
          monthlyContributionUsd: parseFloat(newGoalMonthly) || 0,
          autoInvestEnabled: newGoalAutoInvest,
          autoInvestDayOfMonth: parseInt(newGoalAutoInvestDay) || 1,
        }),
      });
      if (res.ok) {
        setCreateGoalDialogOpen(false);
        resetGoalForm();
        await fetchGoals();
      }
    } catch (e) {
      console.error('[goals] create error:', e);
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handlePauseGoal = async (goal: InvestmentGoalData) => {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch(`/api/wealth/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchGoals();
    } catch (e) {
      console.error('[goals] pause error:', e);
    }
  };

  const handleArchiveGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/wealth/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (res.ok) await fetchGoals();
    } catch (e) {
      console.error('[goals] archive error:', e);
    }
  };

  const handleAddFunds = (goal: InvestmentGoalData) => {
    // Navigate to buy flow with goal context
    navigate('wealth-landing');
  };

  /* ── Goal status helper ────────────────────────────────────── */
  const getGoalStatus = (goal: InvestmentGoalData) => {
    if (goal.status === 'achieved') return { label: 'Achieved', onTrack: true, icon: '✅' };
    if (goal.status === 'paused') return { label: 'Paused', onTrack: false, icon: '⏸️' };

    const pct = goal.targetAmountUsd > 0 ? (goal.currentValueUsd / goal.targetAmountUsd) * 100 : 0;
    if (pct >= 100) return { label: 'Target reached!', onTrack: true, icon: '🎉' };

    if (goal.targetDate && goal.monthlyContributionUsd > 0) {
      const now = new Date();
      const target = new Date(goal.targetDate);
      const totalMonths = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
      const remainingUsd = Math.max(0, goal.targetAmountUsd - goal.currentValueUsd);
      const requiredMonthly = remainingUsd / totalMonths;
      const onTrack = goal.monthlyContributionUsd >= requiredMonthly * 0.9;

      if (onTrack) {
        const yearsAhead = Math.round((remainingUsd / goal.monthlyContributionUsd - totalMonths) / 12 * -1);
        const monthsAhead = Math.round((remainingUsd / goal.monthlyContributionUsd - totalMonths));
        let timeLabel = '';
        if (monthsAhead > 0) timeLabel = `${monthsAhead} month${monthsAhead > 1 ? 's' : ''} ahead`;
        else if (yearsAhead > 0) timeLabel = `${yearsAhead} year${yearsAhead > 1 ? 's' : ''} ahead`;
        else timeLabel = 'on schedule';
        return { label: `On track — ${timeLabel}`, onTrack: true, icon: '✅' };
      } else {
        return { label: 'Behind schedule', onTrack: false, icon: '⚠️' };
      }
    }

    return { label: 'In progress', onTrack: true, icon: '📈' };
  };

  const getGoalIcon = (type: string) => {
    const map: Record<string, string> = {
      education: '🎓', property: '🏠', retirement: '🌍',
      business: '💼', wealth: '📈', legacy: '🎁',
    };
    return map[type] || '🎯';
  };

  /* ── Loading state ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Investments</h1>
        <p className="text-sm text-muted-foreground">Track your African stock portfolio</p>
      </div>

      {/* Empty state */}
      {!hasInvestments && !portfolioLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">You haven&apos;t made any investments yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Start by browsing African stock exchanges and picking your first investment.
              We&apos;ll handle the FX conversion and settlement for you.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => navigate('wealth-landing')}
              >
                Explore markets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => navigate('wealth-market')}
              >
                Browse stocks
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Portfolio summary cards — 4 cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Value */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-2xl font-bold text-gray-900">{fmtUsd(totalValueUsd)}</p>
                    <p className="text-xs text-muted-foreground">{fmtGbp(usdToGbp(totalValueUsd))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Total Invested */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold text-gray-900">{fmtUsd(totalInvestedUsd)}</p>
                    <p className="text-xs text-muted-foreground">{fmtGbp(usdToGbp(totalInvestedUsd))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Gain/Loss */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isProfit ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gain / Loss</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{fmtUsd(Math.abs(totalGainLossUsd))}
                      </p>
                      <span className={`text-sm font-medium ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                        ({isProfit ? '+' : ''}{totalGainLossPct.toFixed(1)}%)
                      </span>
                    </div>
                    <p className={`text-xs text-muted-foreground ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : ''}{fmtGbp(usdToGbp(Math.abs(totalGainLossUsd)))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Dividends */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dividends Earned</p>
                    <p className="text-2xl font-bold text-gray-900">{fmtUsd(dividendsEarnedUsd)}</p>
                    <p className="text-xs text-muted-foreground">{fmtGbp(usdToGbp(dividendsEarnedUsd))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Goals section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Investment Goals
              </CardTitle>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs"
                onClick={() => openCreateGoalDialog()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Goal
              </Button>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <div className="py-6">
                  <p className="text-sm text-muted-foreground mb-4 text-center">What are you investing for?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {quickPickGoals.map((qp) => (
                      <button
                        key={qp.type}
                        onClick={() => openCreateGoalDialog(qp.type, qp.name)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer"
                      >
                        <span className="text-2xl">{qp.icon}</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{qp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {goals.map((goal) => {
                    const pct = goal.targetAmountUsd > 0
                      ? Math.min(100, (goal.currentValueUsd / goal.targetAmountUsd) * 100)
                      : 0;
                    const status = getGoalStatus(goal);
                    const targetDateStr = goal.targetDate
                      ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : null;

                    return (
                      <div
                        key={goal.id}
                        className="rounded-xl border border-border p-4 sm:p-5 hover:border-emerald-200 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-xl shrink-0 mt-0.5">{getGoalIcon(goal.goalType)}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">{goal.goalName}</h3>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                  {goalTypeLabels[goal.goalType] || goal.goalType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Target: {fmtUsd(goal.targetAmountUsd)}{targetDateStr ? ` by ${targetDateStr}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-gray-700">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="relative h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {fmtUsd(goal.currentValueUsd)} of {fmtUsd(goal.targetAmountUsd)}
                          </p>
                        </div>

                        {/* Status row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span>{status.icon}</span>
                            <span className={status.onTrack ? 'text-emerald-700 font-medium' : 'text-amber-600 font-medium'}>
                              {status.label}
                            </span>
                            {goal.autoInvestEnabled && goal.monthlyContributionUsd > 0 && (
                              <span className="text-muted-foreground ml-1">
                                — {fmtUsd(goal.monthlyContributionUsd)}/mo auto-investing
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
                              onClick={() => openCreateGoalDialog(goal.goalType, goal.goalName)}
                            >
                              <Settings2 className="mr-1 h-3 w-3" />
                              Adjust
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-7 text-xs ${goal.status === 'paused' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                              onClick={() => handlePauseGoal(goal)}
                            >
                              {goal.status === 'paused' ? (
                                <><PlayCircle className="mr-1 h-3 w-3" />Resume</>
                              ) : (
                                <><Pause className="mr-1 h-3 w-3" />Pause</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleAddFunds(goal)}
                            >
                              <CircleDollarSign className="mr-1 h-3 w-3" />
                              Add funds
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleArchiveGoal(goal.id)}
                            >
                              Archive
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Holdings table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Holdings</CardTitle>
              {portfolioLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              {portfolioLoading && holdings.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : holdings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm">No holdings yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Stock</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Shares</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Avg Cost</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Price</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Value</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Gain/Loss</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">%</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h) => {
                          const isUp = h.gainLossUsd >= 0;
                          return (
                            <tr
                              key={`${h.ticker}-${h.exchange}`}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => navigate('wealth-stock', { ticker: h.ticker })}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                    {getCompanyInitial(h.companyName)}
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-gray-900">{h.companyName || h.ticker}</span>
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-[10px] px-1.5 py-0">
                                        {h.ticker}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                        {h.exchange}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {getStatusTag('filled')}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">{Math.floor(h.shares).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmtUsd(h.avgCostUsd)}</td>
                              <td className="px-4 py-3 text-right font-mono font-medium">{fmtUsd(h.currentPriceUsd)}</td>
                              <td className="px-4 py-3 text-right font-mono font-medium">{fmtUsd(h.marketValueUsd)}</td>
                              <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                <span className="flex items-center justify-end gap-1">
                                  {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                  {isUp ? '+' : ''}{fmtUsd(Math.abs(h.gainLossUsd))}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-right font-mono font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isUp ? '+' : ''}{h.gainLossPct.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs h-7"
                                    onClick={() => navigate('wealth-buy', { ticker: h.ticker })}
                                  >
                                    Buy more
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-7"
                                    onClick={() => openSellModal(h)}
                                  >
                                    Sell
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending orders */}
          {visiblePendingOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2 font-medium text-muted-foreground">Ref</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground">Stock</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground">Dir</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground text-right">Shares</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground text-right">Amount</th>
                          <th className="px-4 py-2 font-medium text-muted-foreground">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePendingOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{o.reference}</td>
                            <td className="px-4 py-2 font-medium">{o.ticker}</td>
                            <td className="px-4 py-2">
                              <Badge variant={o.orderDirection === 'BUY' ? 'default' : 'secondary'} className={`text-xs ${o.orderDirection === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {o.orderDirection}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{Math.floor(o.sharesRequested).toLocaleString()}</td>
                            <td className="px-4 py-2">{getStatusTag(o.status)}</td>
                            <td className="px-4 py-2 text-right font-mono">{fmtGbp(o.totalChargedGbp || o.amountGbp)}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
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
          )}

          {/* Performance chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Portfolio Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceBarChart data={monthlyPerformance} />
            </CardContent>
          </Card>

          {/* Dividends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dividends Received</CardTitle>
            </CardHeader>
            <CardContent>
              {dividends.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <PiggyBank className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p>Dividend payments will appear here once you receive them.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Stock</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Shares</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Div/Share</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Total (USD)</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Tax</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Net (USD)</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">Reinvested?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividends.map((d) => (
                          <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                              {d.payDate
                                ? new Date(d.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : d.createdAt
                                  ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-[10px] px-1.5 py-0">
                                  {d.ticker}
                                </Badge>
                                <span className="font-medium text-gray-900 text-xs">{d.companyName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">{Math.floor(d.sharesHeld).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                              {d.dividendPerShareLocal.toFixed(4)} {d.currencyLocal}
                            </td>
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
              )}
            </CardContent>
          </Card>

          {/* Auto-reinvest toggle */}
          <Card>
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div>
                  <Label htmlFor="auto-reinvest" className="font-medium text-gray-900 cursor-pointer">Auto-reinvest dividends</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically use dividend income to buy more of the same stock.
                  </p>
                </div>
              </div>
              <Switch
                id="auto-reinvest"
                checked={autoReinvest}
                onCheckedChange={handleAutoReinvestToggle}
                disabled={autoReinvestLoading}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Risk disclaimer */}
      <div className="flex gap-3 text-sm text-muted-foreground pt-4 border-t">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <p className="leading-relaxed">
          Investing in African stock markets carries risk including possible loss of principal. Past performance is not indicative of future results.
          All data is delayed by at least 15 minutes. AfriSpine acts as an intermediary and does not provide investment advice.
        </p>
      </div>

      {/* ── Sell Modal ─────────────────────────────────────────── */}
      <Dialog open={sellModalOpen} onOpenChange={setSellModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell {sellHolding?.companyName || sellHolding?.ticker} ({sellHolding?.ticker})</DialogTitle>
            <DialogDescription>
              You hold {Math.floor(sellHolding?.shares ?? 0).toLocaleString()} shares of {sellHolding?.companyName || sellHolding?.ticker} on {sellHolding?.exchange}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Shares input */}
            <div className="space-y-2">
              <Label htmlFor="sell-shares" className="text-sm font-medium">Number of shares to sell</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sell-shares"
                  type="number"
                  min={1}
                  max={Math.floor(sellHolding?.shares ?? 0)}
                  value={sellShares}
                  onChange={(e) => setSellShares(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSellShares(String(Math.floor(sellHolding?.shares ?? 0)))}
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Estimated proceeds */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current price</span>
                <span className="font-mono font-medium">{sellHolding ? fmtUsd(sellHolding.currentPriceUsd) : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shares to sell</span>
                <span className="font-mono">{sellShares || '0'}</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium text-gray-900">Estimated proceeds (USD)</span>
                <span className="text-lg font-bold text-emerald-600">{fmtUsd(estimatedProceeds)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Estimated proceeds (GBP)</span>
                <span className="font-mono">{fmtGbp(usdToGbp(estimatedProceeds))}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSellModalOpen(false)}
              disabled={sellSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleSellConfirm}
              disabled={sellSubmitting || !sellShares || parseFloat(sellShares) <= 0}
            >
              {sellSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm sale →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Goal Dialog ─────────────────────────────────── */}
      <Dialog open={createGoalDialogOpen} onOpenChange={(open) => {
        if (!open) resetGoalForm();
        setCreateGoalDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              Create Investment Goal
            </DialogTitle>
            <DialogDescription>
              Set a target and track your progress towards your financial goals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Goal name */}
            <div className="space-y-2">
              <Label htmlFor="goal-name" className="text-sm font-medium">Goal name</Label>
              <Input
                id="goal-name"
                placeholder="e.g. Amara's University Fund"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
              />
            </div>

            {/* Goal type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Goal type</Label>
              <Select value={newGoalType} onValueChange={setNewGoalType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">🎓 Education</SelectItem>
                  <SelectItem value="property">🏠 Land / Property</SelectItem>
                  <SelectItem value="retirement">🌍 Retirement</SelectItem>
                  <SelectItem value="business">💼 Business Capital</SelectItem>
                  <SelectItem value="wealth">📈 Wealth Building</SelectItem>
                  <SelectItem value="legacy">🎁 Legacy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target amount */}
            <div className="space-y-2">
              <Label htmlFor="goal-target" className="text-sm font-medium">Target amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="goal-target"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="10,000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Target date */}
            <div className="space-y-2">
              <Label htmlFor="goal-date" className="text-sm font-medium">Target date</Label>
              <Input
                id="goal-date"
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
              />
            </div>

            {/* Monthly contribution */}
            <div className="space-y-2">
              <Label htmlFor="goal-monthly" className="text-sm font-medium">Monthly contribution (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="goal-monthly"
                  type="number"
                  min={0}
                  step={10}
                  placeholder="100"
                  value={newGoalMonthly}
                  onChange={(e) => setNewGoalMonthly(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Auto-invest toggle + day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Auto-invest</Label>
                  <p className="text-xs text-muted-foreground">Automatically invest your monthly contribution</p>
                </div>
                <Switch
                  checked={newGoalAutoInvest}
                  onCheckedChange={setNewGoalAutoInvest}
                />
              </div>
              {newGoalAutoInvest && (
                <div className="space-y-2 pl-0">
                  <Label className="text-sm font-medium">Day of month</Label>
                  <Select value={newGoalAutoInvestDay} onValueChange={setNewGoalAutoInvestDay}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { resetGoalForm(); setCreateGoalDialogOpen(false); }}
              disabled={goalSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCreateGoal}
              disabled={goalSubmitting || !newGoalName.trim()}
            >
              {goalSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}