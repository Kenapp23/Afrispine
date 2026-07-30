'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Banknote,
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
};

const kpis = [
  { label: 'Total volume (30d)', value: '£847,320', change: '+14%', icon: Banknote, positive: true },
  { label: 'Transfers (30d)', value: '3,241', change: '+8%', icon: ArrowLeftRight, positive: true },
  { label: 'Active senders', value: '1,847', change: '+22%', icon: Users, positive: true },
  { label: 'Revenue (30d)', value: '£12,710', change: '+16%', icon: TrendingUp, positive: true },
  { label: 'Avg delivery time', value: '4.2 min', change: '-12%', icon: ArrowUpRight, positive: true },
  { label: 'Failed rate', value: '1.8%', change: '+0.3%', icon: AlertTriangle, positive: false },
];

const recentTxns = [
  { id: 'TXN-101', sender: 'John D.', recipient: 'Jane W.', amount: '£100.00', status: 'delivered', date: '30 Jun 2025' },
  { id: 'TXN-102', sender: 'Sarah M.', recipient: 'Emeka O.', amount: '£250.00', status: 'processing', date: '30 Jun 2025' },
  { id: 'TXN-103', sender: 'David K.', recipient: 'Kwame A.', amount: '£75.00', status: 'delivered', date: '30 Jun 2025' },
  { id: 'TXN-104', sender: 'Lisa P.', recipient: 'Amina H.', amount: '£50.00', status: 'failed', date: '29 Jun 2025' },
  { id: 'TXN-105', sender: 'Mark T.', recipient: 'Fatou D.', amount: '£300.00', status: 'pending', date: '29 Jun 2025' },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    {kpi.positive ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                    {' '}{kpi.change} vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Volume by Rail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's volume by rail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Mobile Money', pct: 52, color: 'bg-emerald-500', bgLight: 'bg-emerald-50' },
            { label: 'Bank Transfer', pct: 28, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
            { label: 'Ripple', pct: 14, color: 'bg-amber-500', bgLight: 'bg-amber-50' },
            { label: 'PAPSS', pct: 6, color: 'bg-violet-500', bgLight: 'bg-violet-50' },
          ].map((rail) => (
            <div key={rail.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{rail.label}</span>
                <span className="text-muted-foreground">{rail.pct}%</span>
              </div>
              <div className={`h-3 w-full rounded-full ${rail.bgLight}`}>
                <div
                  className={`h-full rounded-full ${rail.color} transition-all duration-500`}
                  style={{ width: `${rail.pct}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Reference</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sender</th>
                  <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-mono text-xs">{t.id}</td>
                    <td className="py-3">{t.sender}</td>
                    <td className="py-3">{t.recipient}</td>
                    <td className="py-3 font-medium">{t.amount}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={statusColor[t.status] || ''}>
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