'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Zap,
  Power,
  Loader2,
  X,
  Smartphone,
  Building2,
  Globe,
  Network,
  Activity,
  Route,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

// ─── Types ────────────────────────────────────────────────────
interface Provider {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoUrl: string;
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  supportedRails: string;
  supportedCorridors: string;
  weightSpeed: number;
  weightCost: number;
  weightReliability: number;
  billingModel: string;
  billingRate: number;
  billingEmail: string;
  isActive: boolean;
  successRate30d: number;
  avgDeliverySec30d: number;
  lastTestedAt: string | null;
  lastTestResult: string | null;
  createdAt: string;
  _count: { transactions: number };
}

const RAIL_OPTIONS = [
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  { value: 'ripple', label: 'Ripple', icon: Globe },
  { value: 'papss', label: 'PAPSS', icon: Network },
];

const COUNTRIES = ['GB', 'KE', 'NG', 'GH', 'UG', 'TZ', 'ZA', 'CM', 'SN', 'CI', 'RW', 'ET', 'MW', 'ZM', 'BJ', 'TG', 'BF'];

function getRailIcon(rail: string) {
  const r = RAIL_OPTIONS.find((o) => o.value === rail);
  return r ? r.icon : Activity;
}

function formatSeconds(sec: number): string {
  if (sec < 60) return Math.round(sec) + ' sec';
  return (sec / 60).toFixed(1) + ' min';
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

// ─── Component ────────────────────────────────────────────────
export function AdminProvidersPage() {
  const adminToken = useAppStore((s) => s.adminSessionToken);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency: number; message: string }>>({});

  // Form state
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formApiBaseUrl, setFormApiBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formWebhookSecret, setFormWebhookSecret] = useState('');
  const [formRails, setFormRails] = useState<string[]>(['mobile_money']);
  const [formCorridors, setFormCorridors] = useState<string[]>([]);
  const [formSpeed, setFormSpeed] = useState([70]);
  const [formCost, setFormCost] = useState([70]);
  const [formReliability, setFormReliability] = useState([70]);
  const [formBillingModel, setFormBillingModel] = useState('per_transaction');
  const [formBillingRate, setFormBillingRate] = useState('0.5');
  const [formBillingEmail, setFormBillingEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCorridor, setNewCorridor] = useState({ from: 'GB', to: 'KE' });

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (adminToken || ''),
  }), [adminToken]);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/providers', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ─── Summary cards ───
  const activeProviders = providers.filter((p) => p.isActive).length;
  const allCorridors = new Set<string>();
  providers.forEach((p) => {
    try {
      const c: string[] = JSON.parse(p.supportedCorridors);
      c.forEach((x) => allCorridors.add(x));
    } catch { /* */ }
  });
  const totalCorridors = allCorridors.size;
  const avgSuccessRate = providers.length > 0
    ? providers.reduce((sum, p) => sum + (p.successRate30d || 0), 0) / providers.length
    : 0;
  const avgDeliveryTime = providers.length > 0
    ? providers.reduce((sum, p) => sum + (p.avgDeliverySec30d || 0), 0) / providers.length
    : 0;

  const summaryCards = [
    { label: 'Active providers', value: String(activeProviders), icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total corridors covered', value: String(totalCorridors), icon: Route, color: 'bg-amber-100 text-amber-600' },
    { label: 'Avg success rate (30d)', value: avgSuccessRate.toFixed(1) + '%', icon: CheckCircle2, color: 'bg-sky-100 text-sky-600' },
    { label: 'Avg delivery time (30d)', value: formatSeconds(avgDeliveryTime), icon: Clock, color: 'bg-purple-100 text-purple-600' },
  ];

  // ─── Form handlers ───
  function resetForm() {
    setFormName('');
    setFormDisplayName('');
    setFormSlug('');
    setFormLogoUrl('');
    setFormApiBaseUrl('');
    setFormApiKey('');
    setFormApiSecret('');
    setFormWebhookSecret('');
    setFormRails(['mobile_money']);
    setFormCorridors([]);
    setFormSpeed([70]);
    setFormCost([70]);
    setFormReliability([70]);
    setFormBillingModel('per_transaction');
    setFormBillingRate('0.5');
    setFormBillingEmail('');
    setEditingProvider(null);
  }

  function openAddDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(p: Provider) {
    setEditingProvider(p);
    setFormName(p.name);
    setFormDisplayName(p.displayName);
    setFormSlug(p.slug);
    setFormLogoUrl(p.logoUrl || '');
    setFormApiBaseUrl(p.apiBaseUrl || '');
    setFormApiKey(p.apiKey || '');
    setFormApiSecret(p.apiSecret || '');
    setFormWebhookSecret(p.webhookSecret || '');
    setFormRails(p.supportedRails ? p.supportedRails.split(',').map((r: string) => r.trim()) : ['mobile_money']);
    try {
      setFormCorridors(JSON.parse(p.supportedCorridors));
    } catch {
      setFormCorridors([]);
    }
    setFormSpeed([p.weightSpeed]);
    setFormCost([p.weightCost]);
    setFormReliability([p.weightReliability]);
    setFormBillingModel(p.billingModel);
    setFormBillingRate(String(p.billingRate));
    setFormBillingEmail(p.billingEmail || '');
    setDialogOpen(true);
  }

  function toggleRail(rail: string) {
    setFormRails((prev) => prev.includes(rail) ? prev.filter((r) => r !== rail) : [...prev, rail]);
  }

  function addCorridor() {
    const corridor = newCorridor.from + '-' + newCorridor.to;
    if (newCorridor.from === newCorridor.to) {
      toast.error('Send and receive countries must differ');
      return;
    }
    if (formCorridors.includes(corridor)) {
      toast.error('Corridor already added');
      return;
    }
    setFormCorridors([...formCorridors, corridor]);
  }

  function removeCorridor(c: string) {
    setFormCorridors(formCorridors.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!formDisplayName) {
      toast.error('Display name is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = {
        name: formName || formDisplayName,
        displayName: formDisplayName,
        slug: formSlug || undefined,
        logoUrl: formLogoUrl,
        apiBaseUrl: formApiBaseUrl,
        apiKey: formApiKey,
        apiSecret: formApiSecret,
        webhookSecret: formWebhookSecret,
        supportedRails: formRails.join(','),
        supportedCorridors: formCorridors,
        weightSpeed: formSpeed[0],
        weightCost: formCost[0],
        weightReliability: formReliability[0],
        billingModel: formBillingModel,
        billingRate: formBillingRate,
        billingEmail: formBillingEmail,
      };

      let res: Response;
      if (editingProvider) {
        // If API fields are still masked, don't send them
        if (body.apiKey && body.apiKey.startsWith('•')) delete body.apiKey;
        if (body.apiSecret && body.apiSecret.startsWith('•')) delete body.apiSecret;
        if (body.webhookSecret && body.webhookSecret.startsWith('•')) delete body.webhookSecret;

        res = await fetch('/api/admin/providers/' + editingProvider.id, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/admin/providers', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        toast.success(editingProvider ? 'Provider updated' : 'Provider created');
        setDialogOpen(false);
        fetchProviders();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save provider');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(p: Provider) {
    try {
      const res = await fetch('/api/admin/providers/' + p.id, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        toast.success(p.isActive ? 'Provider deactivated' : 'Provider activated');
        fetchProviders();
      }
    } catch {
      toast.error('Failed to update provider');
    }
  }

  async function handleTest(p: Provider) {
    setTestingId(p.id);
    try {
      const res = await fetch('/api/admin/providers/' + p.id + '/test', {
        method: 'POST',
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults((prev) => ({ ...prev, [p.id]: data }));
        toast[data.success ? 'success' : 'error'](
          data.success ? ('Connected (' + data.latency + 'ms)') : ('Failed: ' + data.message)
        );
      }
    } catch {
      toast.error('Test request failed');
    } finally {
      setTestingId(null);
    }
  }

  // ─── Render ───
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-muted-foreground">Manage payment providers and routing</p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add provider
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 pt-5 pb-4">
                <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + card.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && providers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No providers configured</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />Add provider
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Providers table */}
      {!loading && providers.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Provider</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Rails</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Corridors</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Success rate</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Avg speed</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Last tested</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => {
                    let corridorList: string[] = [];
                    try { corridorList = JSON.parse(p.supportedCorridors); } catch { /* */ }
                    const railList = p.supportedRails ? p.supportedRails.split(',').map((r: string) => r.trim()) : [];
                    const testResult = testResults[p.id];
                    const isTesting = testingId === p.id;

                    return (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.logoUrl ? (
                              <img src={p.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-xs font-bold">
                                {p.displayName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{p.displayName}</p>
                              <p className="text-xs text-muted-foreground">{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {railList.map((rail: string) => {
                              const RIcon = getRailIcon(rail);
                              const opt = RAIL_OPTIONS.find((o) => o.value === rail);
                              return (
                                <Badge key={rail} variant="secondary" className="gap-1 text-xs">
                                  <RIcon className="h-3 w-3" />
                                  {opt ? opt.label : rail}
                                </Badge>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {corridorList.map((c: string) => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{(p.successRate30d || 0).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatSeconds(p.avgDeliverySec30d)}</td>
                        <td className="px-4 py-3">
                          {p.lastTestedAt ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              {testResult ? (
                                testResult.success ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                )
                              ) : p.lastTestResult && p.lastTestResult.includes('successful') ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <span className="text-muted-foreground">
                                {new Date(p.lastTestedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleTest(p)} disabled={isTesting}>
                              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(p)}>
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Add/Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit provider' : 'Add provider'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Basic Info</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="flutterwave" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Display Name *</Label>
                  <Input placeholder="Flutterwave" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input placeholder="auto-generated" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input placeholder="https://..." value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} />
                </div>
              </div>
            </section>

            {/* API Config */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">API Config</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>API Base URL</Label>
                  <Input placeholder="https://api.provider.com/v1" value={formApiBaseUrl} onChange={(e) => setFormApiBaseUrl(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>API Key</Label>
                    <Input type="password" placeholder="sk_live_..." value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Secret</Label>
                    <Input type="password" placeholder="Secret..." value={formApiSecret} onChange={(e) => setFormApiSecret(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Webhook Secret</Label>
                    <Input type="password" placeholder="whsec_..." value={formWebhookSecret} onChange={(e) => setFormWebhookSecret(e.target.value)} />
                  </div>
                </div>
                {editingProvider && (
                  <Button variant="outline" size="sm" onClick={() => handleTest(editingProvider)} disabled={testingId === editingProvider.id}>
                    {testingId === editingProvider.id ? (
                      <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Testing...</>
                    ) : (
                      <><Zap className="mr-2 h-3.5 w-3.5" />Test connection</>
                    )}
                  </Button>
                )}
                {editingProvider && testResults[editingProvider.id] && (
                  <div className="flex items-center gap-2 text-sm">
                    {testResults[editingProvider.id].success ? (
                      <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-emerald-600">Connected ({testResults[editingProvider.id].latency}ms)</span></>
                    ) : (
                      <><XCircle className="h-4 w-4 text-red-500" /><span className="text-red-600">Failed: {testResults[editingProvider.id].message}</span></>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Corridors */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Corridors</h3>
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <Label>Send country</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={newCorridor.from}
                    onChange={(e) => setNewCorridor({ ...newCorridor, from: e.target.value })}
                  >
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <span className="pb-2 text-muted-foreground">→</span>
                <div className="space-y-1.5">
                  <Label>Receive country</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={newCorridor.to}
                    onChange={(e) => setNewCorridor({ ...newCorridor, to: e.target.value })}
                  >
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={addCorridor}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formCorridors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {formCorridors.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1 pr-1">
                      {c}
                      <button onClick={() => removeCorridor(c)} className="ml-1 rounded-full p-0.5 hover:bg-black/10">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Supported Rails */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Supported Rails</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RAIL_OPTIONS.map((rail) => {
                  const Icon = rail.icon;
                  return (
                    <label key={rail.value} className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50" >
                      <Checkbox
                        checked={formRails.includes(rail.value)}
                        onCheckedChange={() => toggleRail(rail.value)}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{rail.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Matching Weights */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Matching Weights</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Speed</Label>
                    <span className="text-sm font-medium text-gray-700">{formSpeed[0]}</span>
                  </div>
                  <Slider value={formSpeed} onValueChange={setFormSpeed} min={0} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cost</Label>
                    <span className="text-sm font-medium text-gray-700">{formCost[0]}</span>
                  </div>
                  <Slider value={formCost} onValueChange={setFormCost} min={0} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Reliability</Label>
                    <span className="text-sm font-medium text-gray-700">{formReliability[0]}</span>
                  </div>
                  <Slider value={formReliability} onValueChange={setFormReliability} min={0} max={100} step={1} />
                </div>
              </div>
            </section>

            {/* Billing */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Billing</h3>
              <div className="space-y-3">
                <RadioGroup value={formBillingModel} onValueChange={setFormBillingModel} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="per_transaction" id="per_tx" />
                    <Label htmlFor="per_tx" className="text-sm font-normal">Per transaction</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="volume_pct" id="vol_pct" />
                    <Label htmlFor="vol_pct" className="text-sm font-normal">Volume %</Label>
                  </div>
                </RadioGroup>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Rate</Label>
                    <Input type="number" step="0.01" value={formBillingRate} onChange={(e) => setFormBillingRate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billing email</Label>
                    <Input type="email" placeholder="billing@provider.com" value={formBillingEmail} onChange={(e) => setFormBillingEmail(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save provider'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}