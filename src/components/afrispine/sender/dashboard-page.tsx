'use client';

import React from 'react';
import { useAppStore, ViewName } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, ArrowUpRight, Users, TrendingUp, Smartphone, Receipt, RefreshCw, UserPlus, Wallet, ArrowRight } from 'lucide-react';
import { ImpactWidget } from '@/components/afrispine/sender/impact-widget';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
};

export function DashboardPage() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const name = sender?.fullName || sender?.email || 'there';
  const firstName = name.split(' ')[0];

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
      } catch {
        // silent – card will default to "no portfolio" state
      } finally {
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
        if (!cancelled) {
          setPortfolioSummary(`£${val} · ${change} · ${count} holdings`);
        }
      } catch {
        // silent – keep summary empty, card still shows
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    }

    fetchWealthStatus();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { label: 'Total sent', value: '£2,450.00', icon: ArrowUpRight, change: '+12%' },
    { label: 'This month', value: '£320.00', icon: TrendingUp, change: '+8%' },
    { label: 'Recipients', value: '4', icon: Users, change: '' },
  ];

  const recentTransfers = [
    { id: 'TXN-001', recipient: 'Jane Wanjiku', amount: '£100.00', status: 'delivered', date: '28 Jun 2025' },
    { id: 'TXN-002', recipient: 'Emeka Okafor', amount: '£250.00', status: 'processing', date: '29 Jun 2025' },
    { id: 'TXN-003', recipient: 'Kwame Asante', amount: '£75.00', status: 'delivered', date: '25 Jun 2025' },
    { id: 'TXN-004', recipient: 'Amina Hassan', amount: '£50.00', status: 'pending', date: '30 Jun 2025' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {firstName}
          </h1>
          <p className="text-muted-foreground">Here is an overview of your account</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button
            onClick={() => navigate('send')}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Send money
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('bills')}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Pay a bill
          </Button>
        </div>
      </div>

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
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-emerald-600">{stat.change} this month</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { label: 'Top up airtime', icon: Smartphone, view: 'airtime' as const },
            { label: 'Pay a bill', icon: Receipt, view: 'bills' as const },
            { label: 'Set up recurring', icon: RefreshCw, view: 'recurring-sends' as const },
            { label: 'Start group send', icon: UserPlus, view: 'group-sends' as const },
          ] as { label: string; icon: React.ElementType; view: ViewName }[]).map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.view}
                className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
                onClick={() => navigate(action.view)}
              >
                <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {action.label}
                  </span>
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
                    ? portfolioLoading
                      ? 'Loading portfolio…'
                      : portfolioSummary || 'View your holdings'
                    : 'From £10. NSE, NGX, JSE and more.'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate(hasWealthAccount ? 'wealth-portfolio' : 'wealth-landing')}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
            >
              {hasWealthAccount ? 'View portfolio' : 'Start investing'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Your AfriSpine Impact */}
      <ImpactWidget />

      {/* Recent transfers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent transfers</CardTitle>
          <button
            onClick={() => navigate('transfers')}
            className="text-sm text-emerald-600 hover:underline"
          >
            View all
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50"
                    onClick={() => navigate('transfer-detail', { id: t.id })}
                  >
                    <td className="py-3">
                      <span className="font-medium">{t.recipient}</span>
                    </td>
                    <td className="py-3 font-medium">{t.amount}</td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={statusColor[t.status] || ''}
                      >
                        {t.status}
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
