'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Banknote,
  TrendingUp,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

const kpis = [
  {
    label: 'Total Revenue (30d)',
    value: '£12,710',
    change: '+16%',
    icon: Banknote,
    positive: true,
  },
  {
    label: 'Fee Income',
    value: '£8,432',
    change: '+12%',
    icon: TrendingUp,
    positive: true,
  },
  {
    label: 'Volume Processed',
    value: '£847,320',
    change: '+14%',
    icon: BarChart3,
    positive: true,
  },
  {
    label: 'Avg Fee Rate',
    value: '1.5%',
    change: '-0.1%',
    icon: Percent,
    positive: true,
  },
];

const corridors = [
  { corridor: 'GB → KE', flag1: '🇬🇧', flag2: '🇰🇪', volume: '£312,400', fees: '£4,686', net: '£3,412', txns: 1247, growth: '+18%' },
  { corridor: 'GB → NG', flag1: '🇬🇧', flag2: '🇳🇬', volume: '£245,800', fees: '£3,687', net: '£2,691', txns: 892, growth: '+11%' },
  { corridor: 'US → KE', flag1: '🇺🇸', flag2: '🇰🇪', volume: '£134,200', fees: '£2,013', net: '£1,466', txns: 534, growth: '+24%' },
  { corridor: 'GB → GH', flag1: '🇬🇧', flag2: '🇬🇭', volume: '£89,600', fees: '£1,344', net: '£980', txns: 312, growth: '+8%' },
  { corridor: 'GB → TZ', flag1: '🇬🇧', flag2: '🇹🇿', volume: '£65,320', fees: '£980', net: '£714', txns: 256, growth: '+32%' },
];

export function AdminRevenuePage() {
  const { navigate } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-muted-foreground">Revenue breakdown, fee income, and corridor analytics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className={`text-xs font-medium ${kpi.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {kpi.positive ? (
                      <ArrowUpRight className="inline h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="inline h-3 w-3" />
                    )}
                    {' '}
                    {kpi.change} vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue by Corridor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Corridor</CardTitle>
          <CardDescription>Fee income and net revenue per remittance corridor (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Corridor</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Volume</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Fees</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Net Revenue</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Transactions</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c) => (
                  <tr
                    key={c.corridor}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3">
                      <span className="font-medium">
                        {c.flag1} → {c.flag2} {c.corridor}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{c.volume}</td>
                    <td className="py-3 text-right text-emerald-600 font-medium">{c.fees}</td>
                    <td className="py-3 text-right font-bold">{c.net}</td>
                    <td className="py-3 text-right text-muted-foreground">{c.txns.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        {c.growth}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="pt-3 font-bold">Total</td>
                  <td className="pt-3 text-right font-bold">£847,320</td>
                  <td className="pt-3 text-right font-bold text-emerald-600">£12,710</td>
                  <td className="pt-3 text-right font-bold">£9,263</td>
                  <td className="pt-3 text-right font-bold">3,241</td>
                  <td className="pt-3 text-right">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      +14%
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}