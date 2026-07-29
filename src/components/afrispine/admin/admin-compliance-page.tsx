'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Search,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

const kpis = [
  {
    label: 'Total Screened',
    value: '3,241',
    sub: 'Last 30 days',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Flagged',
    value: '18',
    sub: '0.56% rate',
    icon: ShieldAlert,
    color: 'bg-red-100 text-red-600',
  },
  {
    label: 'Cleared',
    value: '14',
    sub: 'After manual review',
    icon: ShieldCheck,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Pending Review',
    value: '4',
    sub: 'Awaiting action',
    icon: Clock,
    color: 'bg-amber-100 text-amber-600',
  },
];

const amlEvents = [
  {
    date: '30 Jun 2025, 13:22',
    sender: 'Lisa Petersen',
    transaction: 'TXN-20250629-004',
    amount: '£500.00',
    result: 'flagged',
    rule: 'Large amount (>£400)',
    reviewer: '—',
    outcome: 'Pending',
  },
  {
    date: '29 Jun 2025, 11:45',
    sender: 'Chidi Nwosu',
    transaction: 'TXN-20250628-012',
    amount: '£350.00',
    result: 'flagged',
    rule: 'KYC not verified',
    reviewer: 'Sarah A.',
    outcome: 'Blocked',
  },
  {
    date: '29 Jun 2025, 09:10',
    sender: 'Mark Thompson',
    transaction: 'TXN-20250628-009',
    amount: '£150.00',
    result: 'clear',
    rule: 'Standard screening',
    reviewer: 'Auto',
    outcome: 'Approved',
  },
  {
    date: '28 Jun 2025, 17:33',
    sender: 'Elena Mwangi',
    transaction: 'TXN-20250627-010',
    amount: '£200.00',
    result: 'flagged',
    rule: 'Sanctions list match',
    reviewer: 'James K.',
    outcome: 'Cleared',
  },
  {
    date: '28 Jun 2025, 14:18',
    sender: 'Amara Osei',
    transaction: 'TXN-20250627-007',
    amount: '£1,200.00',
    result: 'clear',
    rule: 'VIP sender (exempt)',
    reviewer: 'Auto',
    outcome: 'Approved',
  },
  {
    date: '27 Jun 2025, 16:02',
    sender: 'Paul Okafor',
    transaction: 'TXN-20250627-005',
    amount: '£800.00',
    result: 'flagged',
    rule: 'Rapid successive transfers',
    reviewer: 'Sarah A.',
    outcome: 'Cleared',
  },
  {
    date: '27 Jun 2025, 10:40',
    sender: 'Rachel Brown',
    transaction: 'TXN-20250628-008',
    amount: '£45.00',
    result: 'clear',
    rule: 'Standard screening',
    reviewer: 'Auto',
    outcome: 'Approved',
  },
  {
    date: '26 Jun 2025, 08:55',
    sender: 'John Doherty',
    transaction: 'TXN-20250626-003',
    amount: '£100.00',
    result: 'flagged',
    rule: 'New device login',
    reviewer: 'James K.',
    outcome: 'Cleared',
  },
];

const resultColor: Record<string, string> = {
  clear: 'bg-emerald-100 text-emerald-700',
  flagged: 'bg-red-100 text-red-700',
};

const outcomeColor: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Blocked: 'bg-red-100 text-red-700',
  Cleared: 'bg-sky-100 text-sky-700',
  Pending: 'bg-amber-100 text-amber-700',
};

export function AdminCompliancePage() {
  const { navigate } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance &amp; AML</h1>
          <p className="text-muted-foreground">Anti-money laundering screening, sanctions checks, and compliance monitoring</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit">
          <Shield className="mr-2 h-4 w-4" />
          Run AML Scan
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AML Alert Banner */}
      {kpis[3].value !== '0' && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {kpis[3].value} events pending manual review
              </p>
              <p className="text-xs text-amber-700">
                Flagged transactions require compliance officer review before processing.
              </p>
            </div>
            <Button size="sm" className="ml-auto bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              Review Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AML Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AML Screening Events</CardTitle>
          <CardDescription>Transaction screening results and compliance actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sender</th>
                  <th className="pb-3 font-medium text-muted-foreground">Transaction</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Rule Triggered</th>
                  <th className="pb-3 font-medium text-muted-foreground">Result</th>
                  <th className="pb-3 font-medium text-muted-foreground">Reviewer</th>
                  <th className="pb-3 font-medium text-muted-foreground">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {amlEvents.map((event, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${
                      event.result === 'flagged' && event.outcome === 'Pending' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{event.date}</td>
                    <td className="py-3 font-medium">{event.sender}</td>
                    <td className="py-3 font-mono text-xs text-emerald-600">{event.transaction}</td>
                    <td className="py-3 text-right font-medium">{event.amount}</td>
                    <td className="py-3 text-muted-foreground">{event.rule}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={resultColor[event.result] || ''}>
                        {event.result === 'flagged' && <ShieldAlert className="mr-1 h-3 w-3" />}
                        {event.result === 'clear' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {event.result}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{event.reviewer}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={outcomeColor[event.outcome] || ''}>
                        {event.outcome}
                      </Badge>
                    </td>
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