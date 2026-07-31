'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Building2,
  CreditCard,
  TableProperties,
  Save,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SettlementConfig {
  id: string;
  companyName: string;
  registeredAddress: string;
  companyRegNumber: string;
  sweepNotifyEmail: string;
}

interface PaystackKeysStatus {
  keys: Record<
    string,
    { masked?: string; value?: string; isSet: boolean; length?: number }
  >;
}

interface PaystackIntegration {
  business_name: string;
  integration_type: string;
  domain: string;
  logo?: string;
}

interface PaystackSettlement {
  id: number;
  domain: string;
  integration: number;
  transaction: number;
  settlement_amount: number;
  settled_at: string;
  status: string;
  settlement_currency: string;
  payment_date: string;
  deductions: { type: string; currency: string; amount: number }[];
}

interface RevenueSummary {
  totalFees: number;
  totalVolume: number;
  transactionCount: number;
  totalCharged: number;
  settledFees: number;
  settledCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const usdFmt = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AdminSettlementPage() {
  const { navigate, adminSessionToken } = useAppStore();

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (adminSessionToken || ''),
  }), [adminSessionToken]);

  // ── Section 1: Company Details state ──
  const [config, setConfig] = useState<SettlementConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');

  // ── Section 2: Payment Connection state ──
  const [paystackKeys, setPaystackKeys] = useState<PaystackKeysStatus | null>(null);
  const [paystackKeysLoading, setPaystackKeysLoading] = useState(true);
  const [integration, setIntegration] = useState<PaystackIntegration | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);

  const keysConfigured =
    paystackKeys?.keys?.['fincra_secret_key']?.isSet &&
    paystackKeys?.keys?.['fincra_public_key']?.isSet;

  // ── Section 3: Reconciliation state ──
  const [settlements, setSettlements] = useState<PaystackSettlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // ── Fetchers ──

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin/settlement', { headers: authHeaders() });
      if (!res.ok) {
        console.error('[settlement] Config fetch failed:', res.status);
        setConfig({ id: '', companyName: '', registeredAddress: '', companyRegNumber: '', sweepNotifyEmail: '' });
        return;
      }
      const json = await res.json();
      const c = json.config as SettlementConfig;
      setConfig(c);
      setCompanyName(c.companyName || '');
      setRegisteredAddress(c.registeredAddress || '');
      setCompanyRegNumber(c.companyRegNumber || '');
      setInvoiceEmail(c.sweepNotifyEmail || '');
    } catch (e) {
      console.error('[settlement] Config error:', e);
      setConfig({ id: '', companyName: '', registeredAddress: '', companyRegNumber: '', sweepNotifyEmail: '' });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchPaystackKeys = useCallback(async () => {
    setPaystackKeysLoading(true);
    try {
      const res = await fetch('/api/admin/paystack-keys', { headers: authHeaders() });
      if (!res.ok) {
        console.error('[settlement] Keys fetch failed:', res.status);
        setPaystackKeys({ keys: {} });
        return;
      }
      const json = await res.json();
      setPaystackKeys(json);
    } catch (e) {
      console.error('[settlement] Keys error:', e);
      setPaystackKeys({ keys: {} });
    } finally {
      setPaystackKeysLoading(false);
    }
  }, []);

  const fetchIntegration = useCallback(async () => {
    setIntegrationLoading(true);
    try {
      const res = await fetch('/api/admin/paystack-integration', { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setIntegration(json.integration);
      } else {
        setIntegration(null);
      }
    } catch {
      setIntegration(null);
    } finally {
      setIntegrationLoading(false);
    }
  }, []);

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true);
    try {
      const res = await fetch('/api/admin/paystack-settlements?perPage=50', { headers: authHeaders() });
      const json = await res.json();
      if (json.settlements) {
        setSettlements(json.settlements);
      }
    } catch {
      toast.error('Failed to fetch settlements');
    } finally {
      setSettlementsLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await fetch('/api/admin/revenue-summary', { headers: authHeaders() });
      if (!res.ok) {
        console.error('[settlement] Revenue fetch failed:', res.status);
        setRevenue({ totalFees: 0, totalVolume: 0, transactionCount: 0, totalCharged: 0, settledFees: 0, settledCount: 0 });
        return;
      }
      const json = await res.json();
      setRevenue(json);
    } catch (e) {
      console.error('[settlement] Revenue error:', e);
      setRevenue({ totalFees: 0, totalVolume: 0, transactionCount: 0, totalCharged: 0, settledFees: 0, settledCount: 0 });
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchPaystackKeys();
    fetchRevenue();
  }, [fetchConfig, fetchPaystackKeys, fetchRevenue]);

  // When keys are confirmed configured, fetch integration info
  useEffect(() => {
    if (keysConfigured) {
      fetchIntegration();
      fetchSettlements();
    }
  }, [keysConfigured, fetchIntegration, fetchSettlements]);

  // ── Handlers ──

  const handleSaveDetails = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch('/api/admin/settlement', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ companyName, registeredAddress, companyRegNumber, invoiceEmail }),
      });
      if (res.ok) {
        toast.success('Company details saved');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save company details');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleRefreshSettlements = () => {
    fetchSettlements();
    fetchRevenue();
    toast.success('Refreshing settlements…');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settlement &amp; Reconciliation</h1>
        <p className="text-muted-foreground">
          Manage company details, payment connection, and reconcile settlements.
        </p>
      </div>

      {/* ═══════════ Section 1: Company Details ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Company Details</CardTitle>
          </div>
          <CardDescription>
            Legal information used for settlements and invoicing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Legal Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. AfriSpine Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyRegNumber">Company Registration Number</Label>
                  <Input
                    id="companyRegNumber"
                    value={companyRegNumber}
                    onChange={(e) => setCompanyRegNumber(e.target.value)}
                    placeholder="e.g. PVT-KEN-2024-123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Textarea
                  id="registeredAddress"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="Full registered address of the company"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Invoice Email</Label>
                <Input
                  id="invoiceEmail"
                  type="email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  placeholder="finance@company.com"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveDetails} disabled={configSaving} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {configSaving ? 'Saving…' : 'Save Details'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Section 2: Payment Connection ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Fincra Payment Connection</CardTitle>
          </div>
          <CardDescription>
            Fincra payment provider status and settlement account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paystackKeysLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : keysConfigured ? (
            <>
              {/* Connected state */}
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-emerald-800">Fincra Connected</p>
                  {integrationLoading ? (
                    <Skeleton className="mt-1 h-4 w-48" />
                  ) : integration ? (
                    <p className="mt-1 text-sm text-emerald-700">
                      Provider: <span className="font-semibold">{integration.business_name}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-emerald-700">
                      Fincra integration active.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Not configured state */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-800">Payment keys not yet configured</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Add your Fincra API keys in Settings to activate payments.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('admin-settings')}
                  >
                    Configure in Settings →
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Open Fincra Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your settlement bank account is managed in your Fincra dashboard. Settlements are processed
            automatically to your Kenyan bank account on a T+1 cycle.
          </p>
        </CardContent>
      </Card>

      {/* ═══════════ Section 3: Reconciliation ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Reconciliation</CardTitle>
                <CardDescription>Settlement batches vs. collected fees.</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSettlements}
              disabled={settlementsLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${settlementsLoading ? 'animate-spin' : ''}`} />
              Refresh Settlements
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Revenue summary cards */}
          {revenueLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : revenue ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-xs text-muted-foreground">This Month Fees Collected</p>
                <p className="text-xl font-bold text-gray-900">{usdFmt(revenue.totalFees)}</p>
                <p className="text-xs text-muted-foreground">{revenue.transactionCount} transactions</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-xs text-muted-foreground">This Month Volume</p>
                <p className="text-xl font-bold text-gray-900">{usdFmt(revenue.totalVolume)}</p>
                <p className="text-xs text-muted-foreground">Total charged: {usdFmt(revenue.totalCharged)}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Settled Fees (Delivered)</p>
                <p className="text-xl font-bold text-gray-900">{usdFmt(revenue.settledFees)}</p>
                <p className="text-xs text-muted-foreground">{revenue.settledCount} settled transactions</p>
              </div>
            </div>
          ) : null}

          <Separator />

          {/* Settlements table */}
          {!keysConfigured ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
              <p className="text-sm text-muted-foreground">
                Configure payment keys to view settlement batches.
              </p>
            </div>
          ) : settlementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No settlement batches found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Settlement Date</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Settlement ID</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s) => {
                      const amount = s.settlement_amount / 100; // Amounts are in smallest unit
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {formatDate(s.settlement_at)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {usdFmt(amount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {s.id}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={
                                s.status === 'settled'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : s.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                              }
                            >
                              {s.status}
                            </Badge>
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
    </div>
  );
}