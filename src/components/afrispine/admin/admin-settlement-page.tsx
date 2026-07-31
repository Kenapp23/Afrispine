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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Building2,
  CreditCard,
  TableProperties,
  Save,
  Puzzle,
  Wallet,
  MessageSquare,
  Mail,
  Settings,
  Receipt,
  Info,
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

interface PartnerStatus {
  id: string;
  name: string;
  purpose: string;
  configured: boolean;
  keysSet: number;
  keysTotal: number;
  keyLabels: string[];
  keyStatuses: boolean[];
}

interface FeeCorridor {
  corridor: string;
  display: string;
  flatFee: string;
  pctFee: string;
  minFee: string;
}

// ─── Partner icon map ─────────────────────────────────────────────────────

const PARTNER_ICONS: Record<string, React.ElementType> = {
  fincra: Wallet,
  mystocks_africa: TrendingUpIcon,
  africas_talking: MessageSquare,
  resend: Mail,
};

function TrendingUpIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
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

// ─── Inline Error Banner ───────────────────────────────────────────────────

function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">Failed to load</p>
        <p className="mt-0.5 text-xs text-red-600">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-xs border-red-200 text-red-700 hover:bg-red-100"
            onClick={onRetry}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

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
  const [configError, setConfigError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');

  // ── Section 2: Partner Integrations state ──
  const [partners, setPartners] = useState<PartnerStatus[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  // Derive Fincra keys configured from partner status
  const keysConfigured = partners.some((p) => p.id === 'fincra' && p.configured);

  // ── Section 3.5: Fee Structure state ──
  const [feeCorridors, setFeeCorridors] = useState<FeeCorridor[]>([]);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // ── Section 4: Reconciliation state ──
  const [settlements, setSettlements] = useState<PaystackSettlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // ── Fetchers ──

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const res = await fetch('/api/admin/settlement', { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      const json = await res.json();
      const c = json.config as SettlementConfig;
      setConfig(c);
      setCompanyName(c.companyName || '');
      setRegisteredAddress(c.registeredAddress || '');
      setCompanyRegNumber(c.companyRegNumber || '');
      setInvoiceEmail(c.sweepNotifyEmail || '');
    } catch (e: any) {
      console.error('[settlement] Config error:', e);
      setConfigError(e.message || 'Could not load company details.');
      setConfig({ id: '', companyName: '', registeredAddress: '', companyRegNumber: '', sweepNotifyEmail: '' });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    setPartnersError(null);
    try {
      const res = await fetch('/api/admin/partner-status', { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      const json = await res.json();
      setPartners(json.partners || []);
    } catch (e: any) {
      console.error('[settlement] Partner status error:', e);
      setPartnersError(e.message || 'Could not load partner status.');
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  const fetchFeeStructure = useCallback(async () => {
    setFeeLoading(true);
    setFeeError(null);
    try {
      const res = await fetch('/api/admin/fee-structure', { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      const json = await res.json();
      setFeeCorridors(json.fees || []);
    } catch (e: any) {
      console.error('[settlement] Fee structure error:', e);
      setFeeError(e.message || 'Could not load fee structure.');
    } finally {
      setFeeLoading(false);
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
    setRevenueError(null);
    try {
      const res = await fetch('/api/admin/revenue-summary', { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      const json = await res.json();
      setRevenue(json);
    } catch (e: any) {
      console.error('[settlement] Revenue error:', e);
      setRevenueError(e.message || 'Could not load revenue data.');
      setRevenue({ totalFees: 0, totalVolume: 0, transactionCount: 0, totalCharged: 0, settledFees: 0, settledCount: 0 });
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchPartners();
    fetchRevenue();
    fetchFeeStructure();
  }, [fetchConfig, fetchPartners, fetchRevenue, fetchFeeStructure]);

  // When Fincra is configured (from partner status), fetch settlements
  useEffect(() => {
    if (keysConfigured) {
      fetchSettlements();
    }
  }, [keysConfigured, fetchSettlements]);

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
        const json = await res.json().catch(() => ({ error: 'Save failed' }));
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save company details');
    } finally {
      setConfigSaving(false);
    }
  };

  const updateFeeField = (index: number, field: 'flatFee' | 'pctFee' | 'minFee', value: string) => {
    setFeeCorridors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveFees = async () => {
    setFeeSaving(true);
    try {
      const res = await fetch('/api/admin/fee-structure', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ fees: feeCorridors }),
      });
      if (res.ok) {
        toast.success('Fee structure saved');
      } else {
        const json = await res.json().catch(() => ({ error: 'Save failed' }));
        toast.error(json.error || 'Failed to save fee structure');
      }
    } catch {
      toast.error('Failed to save fee structure');
    } finally {
      setFeeSaving(false);
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
          Manage company details, partner integrations, and reconcile settlements.
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
          ) : configError ? (
            <SectionError message={configError} onRetry={fetchConfig} />
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

      {/* ═══════════ Section 2: Partner Integrations ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Partner Integrations</CardTitle>
                <CardDescription>Status of connected service providers.</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('admin-settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Keys
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {partnersLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : partnersError ? (
            <SectionError message={partnersError} onRetry={fetchPartners} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {partners.map((partner) => {
                const IconComp = PARTNER_ICONS[partner.id] || CreditCard;
                const fullyConfigured = partner.configured;
                const partiallyConfigured = !fullyConfigured && partner.keysSet > 0;

                return (
                  <div
                    key={partner.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      fullyConfigured
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : partiallyConfigured
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          fullyConfigured
                            ? 'bg-emerald-100 text-emerald-600'
                            : partiallyConfigured
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{partner.name}</p>
                          {fullyConfigured ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Connected
                            </Badge>
                          ) : partiallyConfigured ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-gray-500">
                              Not Configured
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{partner.purpose}</p>

                        {/* Key breakdown */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {partner.keyLabels.map((label, idx) => {
                            const isSet = partner.keyStatuses[idx];
                            return (
                              <span
                                key={label}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isSet
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {isSet ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              Settlements are processed automatically to your Kenyan bank account on a T+1 cycle.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Section 3.5: Fee Structure ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Fee Structure</CardTitle>
              <CardDescription>
                Manage transfer fees by corridor.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              These fees apply to all transactions on the corresponding corridor. The fee charged to the
              customer is the greater of the flat fee and the percentage-based fee, subject to the minimum fee.
            </p>
          </div>

          {feeLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : feeError ? (
            <SectionError message={feeError} onRetry={fetchFeeStructure} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="px-4 py-3 font-medium text-muted-foreground">Corridor</TableHead>
                        <TableHead className="px-4 py-3 font-medium text-muted-foreground text-right">Flat Fee (GBP)</TableHead>
                        <TableHead className="px-4 py-3 font-medium text-muted-foreground text-right">Percentage (%)</TableHead>
                        <TableHead className="px-4 py-3 font-medium text-muted-foreground text-right">Minimum (GBP)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeCorridors.map((fc, idx) => (
                        <TableRow key={fc.corridor}>
                          <TableCell className="px-4 py-2 font-medium whitespace-nowrap">
                            <Badge variant="secondary" className="font-mono text-xs bg-gray-100 text-gray-700">
                              {fc.display}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-24 text-right ml-auto"
                              value={fc.flatFee}
                              onChange={(e) => updateFeeField(idx, 'flatFee', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              className="h-8 w-24 text-right ml-auto"
                              value={fc.pctFee}
                              onChange={(e) => updateFeeField(idx, 'pctFee', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-24 text-right ml-auto"
                              value={fc.minFee}
                              onChange={(e) => updateFeeField(idx, 'minFee', e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFees} disabled={feeSaving} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {feeSaving ? 'Saving…' : 'Save Fee Structure'}
                </Button>
              </div>
            </>
          )}
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
          ) : revenueError ? (
            <SectionError message={revenueError} onRetry={fetchRevenue} />
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
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('admin-settings')}
              >
                Configure in Settings →
              </Button>
            </div>
          ) : settlementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TableProperties className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-muted-foreground">No settlement batches found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Settlement batches will appear here once Fincra processes them.
              </p>
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
                      const amount = s.settlement_amount / 100;
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
