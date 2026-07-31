'use client';

import React from 'react';
import { useAppStore, ViewName } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, ArrowUpRight, Users, TrendingUp, Smartphone, Receipt, RefreshCw, UserPlus, Wallet, ArrowRight, Gift, Sun, Moon, Clock } from 'lucide-react';
import { ImpactWidget } from '@/components/afrispine/sender/impact-widget';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
};

const statusIcon: Record<string, string> = {
  delivered: '✅',
  processing: '⏳',
  pending: '⏳',
  failed: '❌',
  refunded: '↩',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: Sun };
  if (h < 18) return { text: 'Good afternoon', icon: Clock };
  return { text: 'Good evening', icon: Moon };
}

export function DashboardPage() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const name = sender?.fullName || sender?.email || 'there';
  const firstName = name.split(' ')[0];
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // ── Wealth / portfolio state ──
  const [wealthLoading, setWealthLoading] = React.useState(true);
  const [hasWealthAccount, setHasWealthAccount] = React.useState(false);
  const [portfolioLoading, setPortfolioLoading] = React.useState(false);
  const [portfolioSummary, setPortfolioSummary] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function fetchWealthStatus() {
      try {
        const res = await fetch('/api/wealth/account/status');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.hasAccount && !cancelled) {
          setHasWealthAccount(true);
          fetchPortfolio();
        }
      } catch { /* silent */ } finally {
        if (!cancelled) setWealthLoading(false);
      }
    }
    async function fetchPortfolio() {
      try {
        setPortfolioLoading(true);
        const res = await fetch('/api/wealth/portfolio');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const val = data.totalValue ?? '4,820';
        const change = data.totalChange ?? '+14.8%';
        const count = data.holdingsCount ?? 0;
        if (!cancelled) setPortfolioSummary(`£${val} \u00b7 ${change} \u00b7 ${count} holdings`);
      } catch { /* silent */ } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    }
    fetchWealthStatus();
    return () => { cancelled = true; };
  }, []);

  const totalSent = 2450;
  const monthGoal = 1000;
  const monthSent = 320;
  const goalPct = Math.min(Math.round((monthSent / monthGoal) * 100), 100);

  const stats = [
    { label: 'Total sent', value: '£2,450.00', icon: ArrowUpRight, change: '+12%', sub: 'lifetime' },
    { label: 'This month', value: '£320.00', icon: TrendingUp, change: '+8%', sub: 'vs £296 last month' },
    { label: 'Recipients', value: '4', icon: Users, change: '+1', sub: 'new this month' },
  ];

  const recentTransfers = [
    { id: 'TXN-001', recipient: 'Jane Wanjiku', amount: '£100.00', receiveAmount: 'KES 19,342', status: 'delivered', date: '28 Jun 2025', corridor: 'GB \u2192 KE' },
    { id: 'TXN-002', recipient: 'Emeka Okafor', amount: '£250.00', receiveAmount: 'NGN 496,875', status: 'processing', date: '29 Jun 2025', corridor: 'GB \u2192 NG' },
    { id: 'TXN-003', recipient: 'Kwame Asante', amount: '£75.00', receiveAmount: 'GHS 1,149', status: 'delivered', date: '25 Jun 2025', corridor: 'GB \u2192 GH' },
    { id: 'TXN-004', recipient: 'Amina Hassan', amount: '£50.00', receiveAmount: 'KES 9,671', status: 'pending', date: '30 Jun 2025', corridor: 'GB \u2192 KE' },
    { id: 'TXN-005', recipient: 'Fatou Diallo', amount: '£200.00', receiveAmount: 'GHS 3,064', status: 'delivered', date: '24 Jun 2025', corridor: 'GB \u2192 GH' },
  ];

  const quickActions: { label: string; icon: React.ElementType; view: ViewName; color?: string }[] = [
    { label: 'Top up airtime', icon: Smartphone, view: 'airtime' },
    { label: 'Pay a bill', icon: Receipt, view: 'bills' },
    { label: 'Set up recurring', icon: RefreshCw, view: 'recurring-sends' },
    { label: 'Start group send', icon: UserPlus, view: 'group-sends' },
    { label: 'Send a gift', icon: Gift, view: 'gifts' },
  { label: 'Rate alerts', icon: TrendingUp, view: 'rate-alerts' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <GreetingIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting.text}, {firstName}
            </h1>
            <p className="text-muted-foreground">Here&apos;s your account overview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('send')} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Send className="mr-2 h-4 w-4" />Send money
          </Button>
          <Button variant="outline" onClick={() => navigate('bills')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Receipt className="mr-2 h-4 w-4" />Pay bill
          </Button>
        </div>
      </div>

      {/* Monthly goal */}
      <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">Monthly send goal</p>
            <p className="text-sm font-semibold text-emerald-700">£{monthSent} / £{monthGoal}</p>
          </div>
          <Progress value={goalPct} className="h-2.5 [&>div]:bg-emerald-500" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {goalPct >= 100
              ? 'Target reached! You saved an estimated £{(monthSent * 0.055).toFixed(0)} vs traditional providers.'
              : `£${monthGoal - monthSent} more to reach your target. Save up to ${((monthGoal - monthSent) * 0.055).toFixed(0)} in fees with AfriSpine.`}
          </p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    {stat.change && (
                      <p className="text-xs text-emerald-600 font-medium">{stat.change}</p>
                    )}
                    {stat.sub && (
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.view} className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200" onClick={() => navigate(action.view)}>
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Wealth / Portfolio card */}
      {!wealthLoading && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                {hasWealthAccount ? <Wallet className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {hasWealthAccount ? 'My Portfolio' : 'Invest in African stocks'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {hasWealthAccount
                    ? portfolioLoading ? 'Loading portfolio...' : portfolioSummary || 'View your holdings'
                    : 'From £10. NSE, NGX, JSE and more.'}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate(hasWealthAccount ? 'wealth-portfolio' : 'wealth-landing')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0">
              {hasWealthAccount ? 'View portfolio' : 'Start investing'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Impact */}
      <ImpactWidget />

      {/* Recent transfers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent transfers</CardTitle>
          <button onClick={() => navigate('transfers')} className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          {/* Mobile: card layout */}
          <div className="space-y-3 sm:hidden">
            {recentTransfers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('transfer-detail', { id: t.id })}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {t.recipient.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.recipient}</p>
                  <p className="text-xs text-muted-foreground">{t.corridor} \u00b7 {t.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{t.amount}</p>
                  <p className="text-xs text-muted-foreground">{t.receiveAmount}</p>
                </div>
                <span className="text-sm">{statusIcon[t.status] || ''}</span>
              </div>
            ))}
          </div>
          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="pb-3 font-medium text-muted-foreground">You send</th>
                  <th className="pb-3 font-medium text-muted-foreground">They receive</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.map((t) => (
                  <tr key={t.id} className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors" onClick={() => navigate('transfer-detail', { id: t.id })}>
                    <td className="py-3">
                      <span className="font-medium">{t.recipient}</span>
                      <p className="text-xs text-muted-foreground">{t.corridor}</p>
                    </td>
                    <td className="py-3 font-medium">{t.amount}</td>
                    <td className="py-3 text-emerald-700 font-medium">{t.receiveAmount}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={statusColor[t.status] || ''}>
                        {statusIcon[t.status]} {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
