'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Landmark,
  Building2,
  FileCheck2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app';

interface SettlementConfigData {
  id: string;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  companyRegNumber: string;
  vatNumber: string;
  invoiceEmail: string;
  logoUrl: string;
  sweepCurrency: string;
  sweepAccountId: string;
  sweepSchedule: string;
  sweepMinimum: number;
  sweepNotifyEmail: string;
}

interface PaymentProviderData {
  connected: boolean;
  businessName?: string;
  merchantId?: string;
  mode?: string;
}

interface ReconData {
  feesCollected: number;
  period: string;
}

function fmtMoney(val: number) {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AdminSettlementPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [config, setConfig] = useState<SettlementConfigData | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderData | null>(null);
  const [recon, setRecon] = useState<ReconData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable form fields
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchSettlement = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settlement');
      if (!res.ok) throw new Error('Failed to load settlement data');
      const json = await res.json();
      setConfig(json.config);
      setPaymentProvider(json.paymentProvider);
      // Initialize form
      const f: Record<string, string> = {};
      const c = json.config;
      f.companyName = c.companyName || '';
      f.addressLine1 = c.addressLine1 || '';
      f.addressLine2 = c.addressLine2 || '';
      f.city = c.city || '';
      f.country = c.country || '';
      f.companyRegNumber = c.companyRegNumber || '';
      f.vatNumber = c.vatNumber || '';
      f.invoiceEmail = c.invoiceEmail || '';
      f.logoUrl = c.logoUrl || '';
      setForm(f);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecon = useCallback(async () => {
    setReconLoading(true);
    try {
      const res = await fetch('/api/admin/settlement/reconciliation');
      if (!res.ok) throw new Error('Failed to load reconciliation');
      const json = await res.json();
      setRecon(json);
    } catch {
      // Silent fail for reconciliation
    } finally {
      setReconLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlement();
    fetchRecon();
  }, [fetchSettlement, fetchRecon]);

  // Re-fetch when page becomes visible again (e.g. after saving keys in Settings)
  useEffect(() => {
    const handler = () => fetchSettlement();
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchSettlement]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settlement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Company details saved');
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settlement</h1>
          <p className="text-muted-foreground">Payment processing and settlement configuration</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSettlement}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reconStatus = paymentProvider?.connected
    ? '✅ Matched'
    : '⚠️ Mismatch';

  const reconStatusColor = paymentProvider?.connected
    ? 'text-emerald-700 bg-emerald-50'
    : 'text-amber-700 bg-amber-50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settlement</h1>
        <p className="text-muted-foreground">Payment processing and settlement configuration</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payment Connection card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Payment Processor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentProvider?.connected ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Connected</span>
                  <Badge className={paymentProvider.mode === 'Live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {paymentProvider.mode || 'Test'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {paymentProvider.businessName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Name</span>
                      <span className="font-medium">{paymentProvider.businessName}</span>
                    </div>
                  )}
                  {paymentProvider.merchantId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merchant ID</span>
                      <span className="font-mono text-xs">{paymentProvider.merchantId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement Currency</span>
                    <span className="font-medium">{config?.sweepCurrency || 'GBP'}</span>
                  </div>
                </div>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Open Payment Dashboard
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </a>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Not connected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Go to{' '}
                  <button
                    type="button"
                    onClick={() => navigate('admin-settings')}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    Settings &rarr; Integrations
                  </button>{' '}
                  to add your payment processor keys.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settlement Account card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Settlement Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your bank account is configured in your payment processor dashboard. Auto-settles on T+1.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settlement Cycle</span>
                <Badge variant="secondary">T+1</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settlement Schedule</span>
                <span className="font-medium capitalize">{config?.sweepSchedule || 'daily'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min. Sweep Amount</span>
                <span className="font-medium">{fmtMoney(config?.sweepMinimum || 50)}</span>
              </div>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full">
                View Settlements
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Company Details card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Company Information</CardTitle>
            <CardDescription>Used on invoices sent to providers</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Legal Company Name</Label>
              <Input id="companyName" value={form.companyName || ''} onChange={e => updateField('companyName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceEmail">Invoice Email</Label>
              <Input id="invoiceEmail" type="email" value={form.invoiceEmail || ''} onChange={e => updateField('invoiceEmail', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input id="addressLine1" value={form.addressLine1 || ''} onChange={e => updateField('addressLine1', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input id="addressLine2" value={form.addressLine2 || ''} onChange={e => updateField('addressLine2', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city || ''} onChange={e => updateField('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country || ''} onChange={e => updateField('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRegNumber">Company Reg #</Label>
              <Input id="companyRegNumber" value={form.companyRegNumber || ''} onChange={e => updateField('companyRegNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input id="vatNumber" value={form.vatNumber || ''} onChange={e => updateField('vatNumber', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" value={form.logoUrl || ''} onChange={e => updateField('logoUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save company details'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Reconciliation card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Revenue Reconciliation</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecon} disabled={reconLoading}>
              <RefreshCw className={'h-3.5 w-3.5 mr-1.5' + (reconLoading ? ' animate-spin' : '')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reconLoading && !recon ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : recon ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">This Month&apos;s Fees Collected</p>
                  <p className="text-xl font-bold text-gray-900">{fmtMoney(recon.feesCollected)}</p>
                  <p className="text-xs text-muted-foreground">Period: {recon.period}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Settled by Payment Processor</p>
                  <p className="text-xl font-bold text-gray-900">{paymentProvider?.connected ? fmtMoney(recon.feesCollected) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">In-Transit</p>
                  <p className="text-xl font-bold text-gray-900">{paymentProvider?.connected ? '$0.00' : fmtMoney(recon.feesCollected)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ' + reconStatusColor}>
                  {reconStatus}
                </span>
                {!paymentProvider?.connected && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Connect payment processor for automatic reconciliation
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Unable to load reconciliation data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}