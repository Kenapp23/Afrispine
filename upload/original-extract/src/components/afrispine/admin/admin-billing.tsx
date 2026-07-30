'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Receipt,
  FileText,
  AlertCircle,
  MoreHorizontal,
  Plus,
  Eye,
  CheckCircle2,
  Download,
  Clock,
  DollarSign,
  CreditCard,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProviderData {
  id: string;
  displayName: string;
  billingModel: string;
  billingRate: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  providerId: string | null;
  provider: ProviderData | null;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
  volumeGbp: number;
  subtotal: number;
  vatAmount: number;
  totalDue: number;
  currency: string;
  status: string;
  sentAt: string | null;
  paidAt: string | null;
  amountPaid: number | null;
  notes: string;
  createdAt: string;
}

function fmtMoney(val: number) {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val: string | null) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusChip: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-sky-100 text-sky-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};

export function AdminBillingPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail dialog
  const [detailInvoice, setDetailInvoice] = useState<InvoiceData | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = statusFilter !== 'all' ? '?status=' + statusFilter : '';
      const res = await fetch('/api/admin/invoices' + q);
      if (!res.ok) throw new Error('Failed to load invoices');
      const json = await res.json();
      setInvoices(json.invoices);
      setTotal(json.total);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/invoices', { method: 'POST' });
      if (!res.ok) throw new Error('Generation failed');
      const json = await res.json();
      if (json.generated > 0) {
        toast.success(json.generated + ' invoice(s) generated');
        fetchInvoices();
      } else {
        toast.info('No new invoices to generate (no qualifying transactions)');
      }
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (inv: InvoiceData) => {
    try {
      const res = await fetch('/api/admin/invoices/' + inv.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Invoice marked as paid');
      setDetailInvoice(null);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
    }
  };

  // ─── Summary calculations ───
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const outstanding = invoices
    .filter(i => i.status === 'draft' || i.status === 'sent')
    .reduce((s, i) => s + i.totalDue, 0);
  const overdue = invoices
    .filter(i => i.status === 'overdue')
    .reduce((s, i) => s + i.totalDue, 0);
  const paidThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paidAt && new Date(i.paidAt).getMonth() === thisMonth && new Date(i.paidAt).getFullYear() === thisYear)
    .reduce((s, i) => s + (i.amountPaid || i.totalDue), 0);
  const totalBilledYtd = invoices
    .filter(i => new Date(i.createdAt).getFullYear() === thisYear)
    .reduce((s, i) => s + i.totalDue, 0);

  // ─── Loading ───
  if (loading && invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // ─── Error ───
  if (error && invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-muted-foreground">Manage provider invoices and payments</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInvoices}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Invoice detail ───
  const detailRate = detailInvoice?.provider?.billingRate || 0;
  const detailModel = detailInvoice?.provider?.billingModel || 'per_transaction';
  const rateLabel = detailModel === 'volume_pct'
    ? detailRate + '% of volume'
    : '$' + detailRate.toFixed(2) + ' per transaction';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-muted-foreground">Manage provider invoices and payments</p>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {generating ? 'Generating...' : 'Generate invoices now'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">Outstanding Invoices</p>
              <p className="text-xl font-bold text-gray-900">{fmtMoney(outstanding)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">Overdue</p>
              <p className="text-xl font-bold text-gray-900">{fmtMoney(overdue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">Paid This Month</p>
              <p className="text-xl font-bold text-gray-900">{fmtMoney(paidThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">Total Billed YTD</p>
              <p className="text-xl font-bold text-gray-900">{fmtMoney(totalBilledYtd)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Invoices</CardTitle>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
                <button
                  key={s}
                  className={'px-2.5 py-1 text-xs font-medium rounded-md transition-colors ' + (statusFilter === s ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-200')}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : statusLabel[s] || s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Receipt className="h-12 w-12 text-gray-300" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Generate invoices now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Invoice #</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Provider</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Period</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap text-right">Txns</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap text-right">Volume</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap text-right">Amount Due</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Currency</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Issued</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Due</th>
                    <th className="pb-3 pr-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground whitespace-nowrap w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const isOverdue = inv.status === 'overdue';
                    const rowBg = isOverdue ? 'bg-amber-50/60' : '';
                    return (
                      <tr key={inv.id} className={'border-b border-border/50 last:border-0 ' + rowBg}>
                        <td className="py-3 pr-3 font-mono text-xs font-medium whitespace-nowrap">{inv.invoiceNumber}</td>
                        <td className="py-3 pr-3 whitespace-nowrap">{inv.provider?.displayName || '—'}</td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">{inv.transactionCount}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{fmtMoney(inv.volumeGbp)}</td>
                        <td className="py-3 pr-3 text-right font-medium tabular-nums">{fmtMoney(inv.totalDue)}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{inv.currency}</td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(inv.createdAt)}</td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          {/* Due = period end + 30 days */}
                          {fmtDate(new Date(new Date(inv.periodEnd).getTime() + 30 * 86400000).toISOString())}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ' + (statusChip[inv.status] || '')}>
                            {statusLabel[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailInvoice(inv)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              {inv.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(inv)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => toast.info('PDF download coming soon')}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Invoice Detail Dialog */}
      <Dialog open={!!detailInvoice} onOpenChange={(open) => { if (!open) setDetailInvoice(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {detailInvoice?.invoiceNumber || 'Invoice'}
            </DialogTitle>
          </DialogHeader>
          {detailInvoice && (
            <div className="space-y-6">
              {/* Status & dates */}
              <div className="flex items-center justify-between">
                <span className={'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ' + (statusChip[detailInvoice.status] || '')}>
                  {statusLabel[detailInvoice.status] || detailInvoice.status}
                </span>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Issued: {fmtDate(detailInvoice.createdAt)}</p>
                  <p>Due: {fmtDate(new Date(new Date(detailInvoice.periodEnd).getTime() + 30 * 86400000).toISOString())}</p>
                  {detailInvoice.paidAt && <p>Paid: {fmtDate(detailInvoice.paidAt)}</p>}
                </div>
              </div>

              {/* Provider info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-muted-foreground mb-1">Billed To</p>
                <p className="font-medium">{detailInvoice.provider?.displayName || 'Unknown Provider'}</p>
                <p className="text-xs text-muted-foreground">Billing model: {rateLabel}</p>
              </div>

              {/* Line items */}
              <div>
                <p className="text-sm font-medium mb-3">Line Items</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Rate</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3">
                          {detailModel === 'volume_pct' ? 'Volume-based fee' : 'Transaction routing fees'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {detailModel === 'volume_pct'
                            ? fmtMoney(detailInvoice.volumeGbp)
                            : detailInvoice.transactionCount}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {detailModel === 'volume_pct'
                            ? detailRate + '%'
                            : '$' + detailRate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {fmtMoney(detailInvoice.subtotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{fmtMoney(detailInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span className="tabular-nums">{fmtMoney(detailInvoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold text-base">
                  <span>Total Due</span>
                  <span className="tabular-nums">{fmtMoney(detailInvoice.totalDue)} {detailInvoice.currency}</span>
                </div>
              </div>

              {/* Payment instructions */}
              <div className="rounded-lg border border-dashed border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Payment Instructions</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please remit payment by bank transfer to the account details specified on your contract.
                  Reference: {detailInvoice.invoiceNumber}.
                  {detailInvoice.status !== 'paid' && ' Payment is due within 30 days of the invoice date.'}
                </p>
              </div>

              {/* Notes */}
              {detailInvoice.notes && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Notes</p>
                  <p>{detailInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              {detailInvoice.status !== 'paid' && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info('PDF download coming soon')}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download PDF
                  </Button>
                  <Button size="sm" onClick={() => handleMarkPaid(detailInvoice)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Mark as paid
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}