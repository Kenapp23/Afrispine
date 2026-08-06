'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Save,
  Shield,
  ShieldCheck,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  Bell,
  Building2,
  Hash,
  MapPin,
  Mail,
  Globe,
  AlertTriangle,
  TrendingUp,
  Plus,
  Download,
  FileArchive,
  Database,
  Package,
  UserCircle,
  Pencil,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface KeyStatus {
  isSet: boolean;
  masked?: string;
  value?: string;
  length?: number;
}

interface KeysResponse {
  keys: Record<string, KeyStatus>;
  connected: boolean;
  provider: string | null;
}

interface CorridorMargin {
  id: number;
  corridor: string;
  marginPct: number;
}

// ─── Partner Config ────────────────────────────────────────────────────────

interface PartnerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  keyFields: { name: string; label: string; placeholder: string; secret?: boolean }[];
}

const PARTNERS: PartnerConfig[] = [
  {
    id: 'eversend',
    name: 'Eversend',
    description: 'Primary payment processor for collections, transfers, and payouts across Africa.',
    color: 'emerald',
    keyFields: [
      { name: 'eversend_client_id', label: 'Client ID', placeholder: 'sandbox client ID...', secret: false },
      { name: 'eversend_client_secret', label: 'Client Secret', placeholder: 'sandbox client secret...', secret: true },
    ],
  },
  {
    id: 'mystocks_africa',
    name: 'MyStocks Africa',
    description: 'African investment and wealth management platform. Enables bond trading, treasury bills, and fractional shares for users.',
    color: 'blue',
    keyFields: [
      { name: 'mystocks_api_key', label: 'API Key', placeholder: 'Your MyStocks Africa API key', secret: true },
      { name: 'mystocks_partner_id', label: 'Partner ID', placeholder: 'Your MyStocks partner ID', secret: false },
    ],
  },
  {
    id: 'pepchecker',
    name: 'PEPChecker',
    description: 'PEP (Politically Exposed Person) and sanctions screening for AML compliance.',
    color: 'amber',
    keyFields: [
      { name: 'pepchecker_api_key', label: 'API Key', placeholder: 'Your PEPChecker API key', secret: true },
    ],
  },
  {
    id: 'smile_id',
    name: 'Smile ID',
    description: 'Digital identity verification and KYC provider. Powers user identity verification across Africa.',
    color: 'orange',
    keyFields: [
      { name: 'smile_id_partner_id', label: 'Partner ID', placeholder: 'Your Smile ID partner ID', secret: false },
      { name: 'smile_id_api_key', label: 'API Key', placeholder: 'Your Smile ID API key', secret: true },
    ],
  },
  {
    id: 'africas_talking',
    name: "Africa's Talking",
    description: 'SMS and USSD provider for transaction notifications and alerts.',
    color: 'green',
    keyFields: [
      { name: 'at_username', label: 'Username', placeholder: 'sandbox or live username', secret: false },
      { name: 'at_api_key', label: 'API Key', placeholder: 'atsk_...', secret: true },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email delivery service for transaction confirmations and notifications.',
    color: 'violet',
    keyFields: [
      { name: 'resend_api_key', label: 'API Key', placeholder: 're_...', secret: true },
    ],
  },
];

const PARTNER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; badgeText: string }> = {
  emerald: { bg: 'bg-emerald-50/20', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  blue: { bg: 'bg-blue-50/20', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100', badgeText: 'text-blue-700' },
  amber: { bg: 'bg-amber-50/20', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100', badgeText: 'text-amber-700' },
  green: { bg: 'bg-green-50/20', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-100', badgeText: 'text-green-700' },
  violet: { bg: 'bg-violet-50/20', border: 'border-violet-200', text: 'text-violet-600', badge: 'bg-violet-100', badgeText: 'text-violet-700' },
  orange: { bg: 'bg-orange-50/20', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100', badgeText: 'text-orange-700' },
};

const CURRENCIES = ['GBP', 'USD', 'EUR', 'KES', 'NGN', 'GHS'];

// ─── Partner Card Component ────────────────────────────────────────────────

function PartnerCard({ partner }: { partner: PartnerConfig }) {
  const colors = PARTNER_COLORS[partner.color] || PARTNER_COLORS.emerald;
  const [keysData, setKeysData] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { adminSessionToken } = useAppStore();
  const authH = useCallback(() => ({ 'Authorization': 'Bearer ' + (adminSessionToken || '') }), [adminSessionToken]);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-keys', { headers: authH() });
      const data = await res.json();
      setKeysData(data);
    } catch {}
    finally { setLoading(false); }
  }, [authH]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  // Check if all keys for this partner are configured
  const allKeysSet = partner.keyFields.every(
    (f) => keysData?.keys?.[f.name]?.isSet
  );
  const anyKeySet = partner.keyFields.some(
    (f) => keysData?.keys?.[f.name]?.isSet
  );

  const handleSave = async () => {
    const hasValue = Object.values(formValues).some((v) => v.trim().length > 0);
    if (!hasValue) {
      setMessage({ type: 'error', text: 'Enter at least one key to save' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/payment-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Keys saved successfully' });
        setFormValues({});
        await fetchKeys();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save keys' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Network error' });
    } finally { setSaving(false); }
  };

  const handleDeleteKey = async (keyName: string) => {
    try {
      const res = await fetch('/api/admin/payment-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ key: keyName }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Key removed' });
        await fetchKeys();
      }
    } catch {}
  };

  return (
    <Card className={`${anyKeySet ? colors.border : 'border-gray-200'} ${colors.bg} transition-colors`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.badge} ${colors.text}`}>
              <Key className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {partner.name}
                {allKeysSet ? (
                  <Badge className={`${colors.badge} ${colors.badgeText} border-transparent text-xs`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{partner.description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchKeys} className="text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Key Status */}
        {loading ? (
          <div className="space-y-2">
            {partner.keyFields.map((f) => (
              <div key={f.name} className="h-12 rounded-lg border bg-white/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partner.keyFields.map((field) => {
                const ks = keysData?.keys?.[field.name];
                return (
                  <div key={field.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2 min-w-0">
                      {field.secret ? (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{field.label}</p>
                        {ks?.isSet ? (
                          <p className="text-xs text-emerald-600 font-mono truncate">{ks.value || ks.masked}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not set</p>
                        )}
                      </div>
                    </div>
                    {ks?.isSet && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0"
                        onClick={() => handleDeleteKey(field.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Input Form */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {anyKeySet ? 'Update Keys' : 'Add Keys'}
          </p>
          {partner.keyFields.map((field, idx) => (
            <React.Fragment key={field.name}>
              {idx > 0 && <Separator />}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  {field.secret ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5 text-emerald-500" />}
                  {field.label}
                </label>
                {field.secret ? (
                  <div className="relative">
                    <Input
                      type={showSecrets[field.name] ? 'text' : 'password'}
                      value={formValues[field.name] || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={keysData?.keys?.[field.name]?.isSet ? 'Leave blank to keep current key' : field.placeholder}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowSecrets((prev) => ({ ...prev, [field.name]: !prev[field.name] }))}
                    >
                      {showSecrets[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Input
                    value={formValues[field.name] || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={keysData?.keys?.[field.name]?.isSet ? 'Leave blank to keep current value' : field.placeholder}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg border p-3 flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !Object.values(formValues).some((v) => v.trim().length > 0)}
            className={`bg-emerald-600 hover:bg-emerald-700 ${!Object.values(formValues).some((v) => v.trim().length > 0) ? 'opacity-50' : ''}`}
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Shield className="mr-2 h-4 w-4" /> {anyKeySet ? 'Update Keys' : 'Save Keys'}</>}
          </Button>
          <p className="text-xs text-muted-foreground">Keys are stored securely in the database</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Fee Structure Card Component ──────────────────────────────────────────

function FeeStructureCard() {
  const { adminSessionToken } = useAppStore();
  const authH = useCallback(() => ({
    'Authorization': 'Bearer ' + (adminSessionToken || ''),
    'Content-Type': 'application/json',
  }), [adminSessionToken]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [globalFeePct, setGlobalFeePct] = useState('1.5');
  const [baseChargeCurrency, setBaseChargeCurrency] = useState('USD');
  const [margins, setMargins] = useState<CorridorMargin[]>([]);

  const [newCorridor, setNewCorridor] = useState('');
  const [newCorridorFee, setNewCorridorFee] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', { headers: authH() });
      const data = await res.json();
      if (res.ok) {
        const s = data.settings || {};
        setGlobalFeePct(s.default_fee_pct ?? '1.5');
        setBaseChargeCurrency(s.base_charge_currency ?? 'USD');
        setMargins(data.margins || []);
      }
    } catch {
      toast.error('Failed to load fee structure settings');
    } finally {
      setLoading(false);
    }
  }, [authH]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveFeeStructure = async () => {
    setSaving(true);
    try {
      const feePct = parseFloat(globalFeePct);
      if (isNaN(feePct) || feePct < 0) {
        toast.error('Please enter a valid fee percentage');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authH(),
        body: JSON.stringify({
          settings: {
            default_fee_pct: String(feePct),
            base_charge_currency: baseChargeCurrency,
          },
        }),
      });

      if (res.ok) {
        toast.success('Fee structure saved successfully');
        await fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save fee structure');
      }
    } catch {
      toast.error('Network error while saving fee structure');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCorridorOverride = async () => {
    const corridor = newCorridor.trim().toUpperCase();
    const pct = parseFloat(newCorridorFee);

    if (!corridor) {
      toast.error('Please enter a corridor code (e.g. GB-KE)');
      return;
    }
    if (isNaN(pct) || pct < 0) {
      toast.error('Please enter a valid fee percentage for the corridor');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authH(),
        body: JSON.stringify({
          margins: [{ corridor, marginPct: pct }],
        }),
      });

      if (res.ok) {
        toast.success(`Corridor override ${corridor} added successfully`);
        setNewCorridor('');
        setNewCorridorFee('');
        await fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add corridor override');
      }
    } catch {
      toast.error('Network error while adding corridor override');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (id: number, corridor: string) => {
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authH(),
        body: JSON.stringify({
          margins: [{ id, corridor, marginPct: 0, _delete: true }],
        }),
      });

      if (res.ok) {
        toast.success(`Corridor override ${corridor} removed`);
        await fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove corridor override');
      }
    } catch {
      toast.error('Network error while removing corridor override');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/20 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Fee Structure</CardTitle>
            <CardDescription>Configure the global transfer fee and per-corridor overrides that apply to all money transfers.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-lg border bg-white/50 animate-pulse" />
            <div className="h-24 rounded-lg border bg-white/50 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Global Fee & Currency Settings */}
            <div className="rounded-lg border bg-white p-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Global Settings</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="global-fee-pct" className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Global Fee %
                  </Label>
                  <div className="relative">
                    <Input
                      id="global-fee-pct"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={globalFeePct}
                      onChange={(e) => setGlobalFeePct(e.target.value)}
                      placeholder="1.5"
                      className="pr-8 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Base fee percentage applied to all transfers</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="base-charge-currency" className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    Base Charge Currency
                  </Label>
                  <Select value={baseChargeCurrency} onValueChange={setBaseChargeCurrency}>
                    <SelectTrigger className="w-full text-sm" id="base-charge-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Currency used for fixed charge components</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Per-Corridor Fee Overrides */}
            <div className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Per-Corridor Fee Overrides</p>
                <Badge className={`${margins.length > 0 ? 'bg-emerald-100 text-emerald-700 border-transparent' : 'bg-gray-100 text-gray-500 border-gray-200'} text-xs`}>
                  {margins.length} {margins.length === 1 ? 'override' : 'overrides'}
                </Badge>
              </div>

              {margins.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {margins.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium font-mono">{m.corridor}</p>
                          <p className="text-xs text-muted-foreground">Overrides global fee</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className="bg-emerald-100 text-emerald-700 border-transparent font-mono">
                          {m.marginPct}%
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                          onClick={() => handleDeleteOverride(m.id, m.corridor)}
                          disabled={deletingId === m.id}
                        >
                          {deletingId === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No corridor overrides configured</p>
                  <p className="text-xs text-muted-foreground mt-1">All transfers will use the global fee of {globalFeePct}%</p>
                </div>
              )}

              <Separator />

              {/* Add Corridor Override Form */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Corridor Override</p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-corridor" className="text-sm font-medium text-gray-900">
                      Corridor Code
                    </Label>
                    <Input
                      id="new-corridor"
                      value={newCorridor}
                      onChange={(e) => setNewCorridor(e.target.value)}
                      placeholder="e.g. GB-KE"
                      className="font-mono text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-corridor-fee" className="text-sm font-medium text-gray-900">
                      Fee %
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-corridor-fee"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newCorridorFee}
                        onChange={(e) => setNewCorridorFee(e.target.value)}
                        placeholder="1.2"
                        className="pr-8 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCorridorOverride}
                    disabled={saving || !newCorridor.trim() || !newCorridorFee.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span className="sr-only">Add Override</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Save Fee Structure Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveFeeStructure}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Fee Structure</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">Changes to global fee and currency will apply to all transfers immediately</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

// ─── My Account / Change Password Card ────────────────────────────────
function MyAccountCard() {
  const admin = useAppStore((s) => s.admin);
  const adminToken = useAppStore((s) => s.adminSessionToken);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  // Email change state
  const [ceEmail, setCeEmail] = useState('');
  const [cePassword, setCePassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  async function changePassword() {
    if (!cpCurrent || !cpNew || !cpConfirm) {
      toast.error('All fields are required');
      return;
    }
    if (cpNew !== cpConfirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (cpNew.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!admin?.id) {
      toast.error('Admin session not found. Please log in again.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings/admins/${admin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (adminToken || '') },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      if (res.ok) {
        toast.success('Password changed. You will be logged out.');
        setCpCurrent(''); setCpNew(''); setCpConfirm('');
        setTimeout(() => logoutAdmin(), 1500);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to change password');
      }
    } catch {
      toast.error('Network error');
    }
    setSaving(false);
  }

  async function changeEmail() {
    if (!ceEmail || !cePassword) {
      toast.error('New email and current password are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ceEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!admin?.id) {
      toast.error('Admin session not found. Please log in again.');
      return;
    }
    setSavingEmail(true);
    try {
      const res = await fetch(`/api/admin/settings/admins/${admin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (adminToken || '') },
        body: JSON.stringify({ currentPassword: cePassword, newEmail: ceEmail.trim() }),
      });
      if (res.ok) {
        toast.success('Email changed. You will be logged out.');
        setCeEmail(''); setCePassword('');
        setTimeout(() => logoutAdmin(), 1500);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to change email');
      }
    } catch {
      toast.error('Network error');
    }
    setSavingEmail(false);
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <UserCircle className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <CardTitle className="text-base">My Account</CardTitle>
            <CardDescription className="text-xs">
              {admin?.email || 'Not logged in'} &bull; {admin?.role === 'superadmin' ? 'Super Admin' : (admin?.role || 'Admin')}
              {admin?.lastLoginAt && (
                <> &bull; Last login: {new Date(admin.lastLoginAt).toLocaleString()}</>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Change Email */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Change email address</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">New email</Label>
              <Input type="email" value={ceEmail} onChange={(e) => setCeEmail(e.target.value)} placeholder="new@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm with password</Label>
              <Input type="password" value={cePassword} onChange={(e) => setCePassword(e.target.value)} placeholder="Current password" />
            </div>
          </div>
          <Button onClick={changeEmail} disabled={savingEmail || !ceEmail || !cePassword} size="sm" variant="outline">
            {savingEmail ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-2 h-3.5 w-3.5" />}
            Update Email
          </Button>
        </div>

        <Separator />

        {/* Change Password */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Current password</Label>
            <div className="relative">
              <Input type={showCurrent ? 'text' : 'password'} value={cpCurrent} onChange={(e) => setCpCurrent(e.target.value)} placeholder="••••••••" className="pr-9" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">New password (min 8 chars)</Label>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={cpNew} onChange={(e) => setCpNew(e.target.value)} placeholder="••••••••" className="pr-9" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm new password</Label>
            <Input type="password" value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <Button onClick={changePassword} disabled={saving || !cpCurrent || !cpNew || !cpConfirm} size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
          {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">Platform configuration, partner API keys, and integration management</p>
      </div>

      {/* My Account */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </div>
        <MyAccountCard />
      </div>

      {/* Partner Integration Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">Partner Integrations</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage API keys and connections for all AfriSpine partners. Payment processing, KYC verification, AML screening, and communication providers.
        </p>
        {PARTNERS.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>

      {/* Fee Structure Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">Fee Structure Management</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure global transfer fees, base charge currency, and per-corridor overrides for the platform.
        </p>
        <FeeStructureCard />
      </div>

      {/* Source Code & Data Backup */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">Source Code &amp; Backup</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Download the complete AfriSpine source code (v1.2.0) including all components, API routes, database schema, and important materials. Store this locally to prevent any code loss.
        </p>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Package className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <CardTitle className="text-base">AfriSpine Full Source Code v1.2.0</CardTitle>
                  <CardDescription className="text-xs">
                    312 files &bull; ~11 MB &bull; Includes DB schema, API routes, 122 gift card brands, settlement engine, admin panel
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">v1.2.0</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileArchive className="h-3.5 w-3.5" />
                  <span>Full source + UI components</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  <span>SQLite database (custom.db)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Important materials doc</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={async () => {
                    try {
                      toast.info('Preparing download...', { description: 'Fetching 11MB archive' });
                      const res = await fetch('/api/download-source');
                      if (!res.ok) throw new Error('Download failed');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'afrispine-full-source-v1.2.0.zip';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Download complete!', { description: 'afrispine-full-source-v1.2.0.zip saved' });
                    } catch (e) {
                      toast.error('Download failed', { description: 'Could not download the file. Try again.' });
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Source Code (ZIP)
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch('/AFRISPINE-IMPORTANT-MATERIALS.md');
                      if (!res.ok) throw new Error('Download failed');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'AFRISPINE-IMPORTANT-MATERIALS.md';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Materials doc downloaded!');
                    } catch (e) {
                      toast.error('Download failed', { description: 'Could not download the file. Try again.' });
                    }
                  }}
                >
                  <FileArchive className="mr-2 h-4 w-4" />
                  Important Materials (Markdown)
                </Button>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                <strong>Important:</strong> Store the downloaded ZIP locally. This contains the complete codebase, database, and all documentation needed to restore the platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
