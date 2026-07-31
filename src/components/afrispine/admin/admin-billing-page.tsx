'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

const statusIcon: Record<string, React.ElementType> = {
  draft: FileText,
  sent: Send,
  paid: CheckCircle2,
  overdue: AlertCircle,
};

const invoices = [
  {
    id: 'INV-2025-0042',
    provider: 'LemFi',
    period: 'Jun 2025',
    amount: '$3,748.80',
    due: '15 Jul 2025',
    status: 'sent',
    txns: 1247,
  },
  {
    id: 'INV-2025-0041',
    provider: "Africa's Talking Pay",
    period: 'Jun 2025',
    amount: '$2,979.00',
    due: '15 Jul 2025',
    status: 'draft',
    txns: 843,
  },
  {
    id: 'INV-2025-0040',
    provider: 'PAPSS',
    period: 'Jun 2025',
    amount: '$1,726.40',
    due: '15 Jul 2025',
    status: 'paid',
    txns: 672,
  },
  {
    id: 'INV-2025-0039',
    provider: 'Ripple ODL',
    period: 'Jun 2025',
    amount: '$2,410.40',
    due: '10 Jul 2025',
    status: 'overdue',
    txns: 479,
  },
  {
    id: 'INV-2025-0038',
    provider: 'LemFi',
    period: 'May 2025',
    amount: '$3,102.50',
    due: '15 Jun 2025',
    status: 'paid',
    txns: 1089,
  },
  {
    id: 'INV-2025-0037',
    provider: "Africa's Talking Pay",
    period: 'May 2025',
    amount: '$2,514.00',
    due: '15 Jun 2025',
    status: 'paid',
    txns: 761,
  },
];

export function AdminBillingPage() {
  const { navigate } = useAppStore();

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => {
      const num = parseFloat(i.amount.replace('$', '').replace(',', ''));
      return sum + num;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Invoicing</h1>
          <p className="text-muted-foreground">Manage provider invoices, track payments and outstanding balances</p>
        </div>
        <Button size="sm" className="w-fit bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid (30d)</p>
              <p className="text-xl font-bold text-gray-900">$7,342.90</p>
              <p className="text-xs text-emerald-600 font-medium">3 invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">${totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-amber-600 font-medium">3 invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-bold text-gray-900">$2,410.40</p>
              <p className="text-xs text-red-500 font-medium">1 invoice</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Invoices</CardTitle>
          <CardDescription>Provider invoices and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Invoice #</th>
                  <th className="pb-3 font-medium text-muted-foreground">Provider</th>
                  <th className="pb-3 font-medium text-muted-foreground">Period</th>
                  <th className="pb-3 font-medium text-muted-foreground">Transactions</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const StatusIcon = statusIcon[inv.status] || FileText;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 font-mono text-xs text-emerald-600">{inv.id}</td>
                      <td className="py-3 font-medium">{inv.provider}</td>
                      <td className="py-3 text-muted-foreground">{inv.period}</td>
                      <td className="py-3 text-muted-foreground">{inv.txns.toLocaleString()}</td>
                      <td className="py-3 text-right font-semibold">{inv.amount}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{inv.due}</td>
                      <td className="py-3">
                        <Badge variant="secondary" className={statusColor[inv.status] || ''}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}