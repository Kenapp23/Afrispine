'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  Route,
  Bell,
  Users,
  Eye,
  Save,
  Power,
  ShieldCheck,
  Info,
  Key,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

// ─── Types ────────────────────────────────────────────────────
interface FxMarginOverride {
  id: string;
  corridor: string;
  marginPct: number;
}

interface NotificationTemplate {
  id: string;
  trigger: string;
  channel: string;
  subject: string;
  body: string;
  smsBody: string;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const TABS = [
  { id: 'integrations', label: 'Integrations', icon: Key },
  { id: 'fx', label: 'FX & Fees', icon: DollarSign },
  { id: 'corridors', label: 'Corridors', icon: Route },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'admins', label: 'Admin Accounts', icon: Users },
];

const TRIGGER_OPTIONS = [
  'email_verified', 'payment_processing', 'delivered', 'failed', 'refund_processed', 'aml_alert', 'invoice_sent',
];

const VARIABLE_HINTS = '{sender_name}, {sender_email}, {reference}, {amount}, {currency}, {recipient_name}, {eta}, {rate}, {provider}, {fee}, {failure_reason}';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  ops: 'Operations',
  finance: 'Finance',
  compliance: 'Compliance',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  superadmin: 'Full access to all features and settings.',
  ops: 'Manage transactions, providers, and day-to-day operations.',
  finance: 'Access to billing, revenue, and settlement features.',
  compliance: 'AML monitoring, KYC review, and compliance reporting.',
};

const FLAG_MAP: Record<string, string> = {
  GB: '🇬🇧', KE: '🇰🇪', NG: '🇳🇬', GH: '🇬🇭', UG: '🇺🇬', TZ: '🇹🇿',
  ZA: '🇿🇦', CM: '🇨🇲', SN: '🇸🇳', CI: '🇨🇮', RW: '🇷🇼', ET: '🇪🇹',
  MW: '🇲🇼', ZM: '🇿🇲', BJ: '🇧🇯', TG: '🇹🇬', BF: '🇧🇫',
};

function getFlag(countryCode: string): string {
  return FLAG_MAP[countryCode] || '🏳️';
}

// ─── Component ────────────────────────────────────────────────
export function AdminSettingsPage() {
  const adminToken = useAppStore((s) => s.adminSessionToken);
  const admin = useAppStore((s) => s.admin);
  const [activeTab, setActiveTab] = useState('integrations');
  const [loading, setLoading] = useState(true);

  // Settings data
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [margins, setMargins] = useState<FxMarginOverride[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (adminToken || ''),
  }), [adminToken]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, adminsRes] = await Promise.all([
        fetch('/api/admin/settings', { headers: headers() }),
        fetch('/api/admin/settings/admins', { headers: headers() }),
      ]);
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        setSettings(d.settings || {});
        setMargins(d.margins || []);
        setTemplates(d.templates || []);
      }
      if (adminsRes.ok) {
        const d = await adminsRes.json();
        setAdmins(d.admins || []);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── FX & Fees tab ───
  const [defaultFee, setDefaultFee] = useState('1.5');
  const [fxCacheTtl, setFxCacheTtl] = useState('300');
  const [fxRateLock, setFxRateLock] = useState('60');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [savingFees, setSavingFees] = useState(false);
  const [savingFx, setSavingFx] = useState(false);

  const [newCorridor, setNewCorridor] = useState({ corridor: '', marginPct: '' });
  const [editingCorridor, setEditingCorridor] = useState<string | null>(null);
  const [editCorridorPct, setEditCorridorPct] = useState('');

  useEffect(() => {
    if (settings.default_fee_pct) setDefaultFee(settings.default_fee_pct);
    if (settings.fx_cache_ttl) setFxCacheTtl(settings.fx_cache_ttl);
    if (settings.fx_rate_lock) setFxRateLock(settings.fx_rate_lock);
    if (settings.base_charge_currency) setBaseCurrency(settings.base_charge_currency);
  }, [settings]);

  async function saveFees() {
    setSavingFees(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ settings: { default_fee_pct: defaultFee, base_charge_currency: baseCurrency } }),
      });
      if (res.ok) {
        toast.success('Fees saved');
        fetchData();
      } else {
        toast.error('Failed to save fees');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingFees(false); }
  }

  async function saveFxConfig() {
    setSavingFx(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ settings: { fx_cache_ttl: fxCacheTtl, fx_rate_lock: fxRateLock } }),
      });
      if (res.ok) {
        toast.success('FX config saved');
        fetchData();
      } else {
        toast.error('Failed to save FX config');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingFx(false); }
  }

  async function addCorridorOverride() {
    if (!newCorridor.corridor || !newCorridor.marginPct) {
      toast.error('Corridor and fee % are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ margins: [{ corridor: newCorridor.corridor.toUpperCase(), marginPct: Number(newCorridor.marginPct) }] }),
      });
      if (res.ok) {
        toast.success('Corridor override added');
        setNewCorridor({ corridor: '', marginPct: '' });
        fetchData();
      } else {
        toast.error('Failed to add corridor');
      }
    } catch { toast.error('Network error'); }
  }

  async function updateCorridorOverride(corridor: string) {
    if (!editCorridorPct) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ margins: [{ corridor, marginPct: Number(editCorridorPct) }] }),
      });
      if (res.ok) {
        toast.success('Corridor updated');
        setEditingCorridor(null);
        fetchData();
      }
    } catch { toast.error('Network error'); }
  }

  async function removeCorridorOverride(corridor: string) {
    // We cannot truly delete, but we can set to 0
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ margins: [{ corridor, marginPct: 0 }] }),
      });
      if (res.ok) {
        toast.success('Corridor override removed');
        fetchData();
      }
    } catch { toast.error('Network error'); }
  }

  // ─── Notifications tab ───
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');
  const [tplSmsBody, setTplSmsBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!selectedTrigger) return;
    const existing = templates.find((t) => t.trigger === selectedTrigger);
    if (existing) {
      setTplSubject(existing.subject);
      setTplBody(existing.body);
      setTplSmsBody(existing.smsBody);
    } else {
      setTplSubject('');
      setTplBody('');
      setTplSmsBody('');
    }
  }, [selectedTrigger, templates]);

  async function saveTemplate() {
    if (!selectedTrigger) {
      toast.error('Select a trigger first');
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          templates: [{
            trigger: selectedTrigger,
            channel: 'email',
            subject: tplSubject,
            body: tplBody,
            smsBody: tplSmsBody,
          }],
        }),
      });
      if (res.ok) {
        toast.success('Template saved');
        fetchData();
      } else {
        toast.error('Failed to save template');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingTemplate(false); }
  }

  function generatePreview() {
    let text = tplBody || tplSubject || '(empty)';
    text = text
      .replace(/\{sender_name\}/g, 'John Doe')
      .replace(/\{sender_email\}/g, 'john@example.com')
      .replace(/\{reference\}/g, 'TXN-ABC123')
      .replace(/\{amount\}/g, '100.00')
      .replace(/\{currency\}/g, 'GBP')
      .replace(/\{recipient_name\}/g, 'Jane Wanjiku')
      .replace(/\{eta\}/g, '5 minutes')
      .replace(/\{rate\}/g, '189.50')
      .replace(/\{provider\}/g, 'Provider')
      .replace(/\{fee\}/g, '1.50')
      .replace(/\{failure_reason\}/g, 'Insufficient balance');
    return text;
  }

  // ─── Admins tab ───
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: '', role: 'ops' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // Change password
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Change email
  const [ceCurrentPw, setCeCurrentPw] = useState('');
  const [ceNewEmail, setCeNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Integrations
  const [savingIntegration, setSavingIntegration] = useState(false);

  const [saveResult, setSaveResult] = useState<string | null>(null);

  async function saveIntegrationKeys() {
    setSavingIntegration(true);
    setSaveResult(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          settings: {
            paystack_public_key: settings.paystack_public_key || '',
            paystack_secret_key: settings.paystack_secret_key || '',
            paystack_webhook_secret: settings.paystack_webhook_secret || '',
            at_api_key: settings.at_api_key || '',
            at_username: settings.at_username || '',
            resend_api_key: settings.resend_api_key || '',
          },
        }),
      });
      if (res.ok) {
        setSaveResult('saved');
        toast.success('Integration keys saved successfully');
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveResult('error: ' + (errData.error || res.status));
        toast.error(errData.error || 'Failed to save integration keys');
      }
    } catch (e: any) {
      setSaveResult('error: ' + (e.message || 'Network error'));
      toast.error('Network error: ' + (e.message || 'Check your connection'));
    } finally {
      setSavingIntegration(false);
    }
  }

  async function createAdmin() {
    if (!newAdmin.email || !newAdmin.password) {
      toast.error('Email and password are required');
      return;
    }
    setCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/settings/admins', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newAdmin),
      });
      if (res.ok) {
        toast.success('Admin user created');
        setAdminDialogOpen(false);
        setNewAdmin({ fullName: '', email: '', password: '', role: 'ops' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create admin');
      }
    } catch { toast.error('Network error'); }
    finally { setCreatingAdmin(false); }
  }

  async function saveRole() {
    if (!editRoleDialog) return;
    setSavingRole(true);
    try {
      const res = await fetch('/api/admin/settings/admins/' + editRoleDialog.id, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ role: editRole }),
      });
      if (res.ok) {
        toast.success('Role updated');
        setEditRoleDialog(null);
        fetchData();
      } else {
        toast.error('Failed to update role');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingRole(false); }
  }

  async function toggleAdminActive(a: AdminUser) {
    try {
      const res = await fetch('/api/admin/settings/admins/' + a.id, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      if (res.ok) {
        toast.success(a.isActive ? 'Admin deactivated' : 'Admin activated');
        fetchData();
      }
    } catch { toast.error('Network error'); }
  }

  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

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
    if (!admin) return;
    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/settings/admins/' + admin.id, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      if (res.ok) {
        toast.success('Password changed. You will be logged out.');
        setCpCurrent('');
        setCpNew('');
        setCpConfirm('');
        // Auto-logout after 1.5s so user sees the success toast
        setTimeout(() => {
          logoutAdmin();
        }, 1500);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to change password');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingPassword(false); }
  }

  async function changeEmail() {
    if (!ceCurrentPw || !ceNewEmail) {
      toast.error('Password and new email are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ceNewEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!admin) return;
    setSavingEmail(true);
    try {
      const res = await fetch('/api/admin/settings/admins/' + admin.id, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ currentPassword: ceCurrentPw, newEmail: ceNewEmail.trim() }),
      });
      if (res.ok) {
        toast.success('Email changed. You will be logged out.');
        setCeCurrentPw('');
        setCeNewEmail('');
        setTimeout(() => {
          logoutAdmin();
        }, 1500);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to change email');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingEmail(false); }
  }

  // ─── Blocked countries ───
  const blockedCountries = (settings.blocked_countries || '').split(',').filter(Boolean).map((c) => c.trim());

  // ─── Render ───
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">Platform configuration and administration</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap " + (isActive ? "bg-white text-gray-900 shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      ) : (
        <div>
          {/* ─── Tab 0: Integrations ─── */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Processor Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Public Key</Label>
                      <Input
                        type="password"
                        value={settings.paystack_public_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, paystack_public_key: e.target.value }))}
                        placeholder="pk_test_... or pk_live_..."
                      />
                      <p className="text-xs text-muted-foreground">Used on the frontend for payment popup</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Secret Key</Label>
                      <Input
                        type="password"
                        value={settings.paystack_secret_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, paystack_secret_key: e.target.value }))}
                        placeholder="sk_test_... or sk_live_..."
                      />
                      <p className="text-xs text-muted-foreground">Used server-side for transaction verification</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Webhook Secret</Label>
                      <Input
                        type="password"
                        value={settings.paystack_webhook_secret || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, paystack_webhook_secret: e.target.value }))}
                        placeholder="Webhook signing secret"
                      />
                      <p className="text-xs text-muted-foreground">HMAC-SHA512 signature verification for webhooks</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mode</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={settings.paystack_public_key?.includes('_live_') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                          {settings.paystack_public_key?.includes('_live_') ? 'Live' : 'Test'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {settings.paystack_public_key ? 'Key detected' : 'No key configured'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Africa&rsquo;s Talking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.at_api_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, at_api_key: e.target.value }))}
                        placeholder="atsk_..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Username</Label>
                      <Input
                        value={settings.at_username || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, at_username: e.target.value }))}
                        placeholder="sandbox or live username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resend (Email)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 max-w-md">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={settings.resend_api_key || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                      placeholder="re_..."
                    />
                    <p className="text-xs text-muted-foreground">Used for transaction notification emails</p>
                  </div>
                </CardContent>
              </Card>

              {/* Save button - prominent, right after all cards */}
              <div className={"flex items-center justify-between rounded-xl border p-4 transition-colors " + (
                saveResult === 'saved'
                  ? 'border-emerald-400 bg-emerald-50'
                  : saveResult?.startsWith('error')
                    ? 'border-red-300 bg-red-50'
                    : 'border-emerald-200 bg-emerald-50/60'
              )}>
                <div>
                  <p className={"text-sm font-medium " + (
                    saveResult === 'saved' ? 'text-emerald-700' :
                    saveResult?.startsWith('error') ? 'text-red-700' :
                    'text-emerald-700'
                  )}>
                    {saveResult === 'saved'
                      ? 'Keys saved successfully'
                      : saveResult?.startsWith('error')
                        ? 'Save failed: ' + saveResult.replace('error: ', '')
                        : (settings.paystack_public_key || settings.at_api_key || settings.resend_api_key)
                          ? 'Keys detected — click save to store them'
                          : 'No integration keys configured yet'}
                  </p>
                  {saveResult === 'saved' && (
                    <p className="text-xs text-emerald-600 mt-0.5">Keys are stored in the database and active</p>
                  )}
                </div>
                <Button onClick={saveIntegrationKeys} disabled={savingIntegration} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {savingIntegration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save keys
                </Button>
              </div>
            </div>
          )}

          {/* ─── Tab 1: FX & Fees ─── */}
          {activeTab === 'fx' && (
            <div className="space-y-6">
              {/* Global fee */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Global Fee Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Global fee %</Label>
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} className="max-w-[160px]" />
                        <Button onClick={saveFees} disabled={savingFees} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                          {savingFees ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Base charge currency</Label>
                      <div className="flex gap-2">
                        <select
                          className="h-9 max-w-[160px] rounded-md border border-input bg-transparent px-3 text-sm"
                          value={baseCurrency}
                          onChange={(e) => setBaseCurrency(e.target.value)}
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                        </select>
                        <p className="flex items-center text-xs text-muted-foreground">Currency used for fee calculations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-corridor overrides */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Per-Corridor Fee Overrides</CardTitle>
                  <Button variant="outline" size="sm" onClick={addCorridorOverride}>
                    <Plus className="mr-2 h-3.5 w-3.5" />Add override
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Inline add form */}
                  <div className="mb-4 flex items-end gap-2">
                    <div className="space-y-1.5">
                      <Label>Corridor</Label>
                      <Input placeholder="GBP-KES" value={newCorridor.corridor} onChange={(e) => setNewCorridor({ ...newCorridor, corridor: e.target.value })} className="w-[140px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fee %</Label>
                      <Input type="number" step="0.01" placeholder="1.5" value={newCorridor.marginPct} onChange={(e) => setNewCorridor({ ...newCorridor, marginPct: e.target.value })} className="w-[100px]" />
                    </div>
                    <Button variant="outline" size="sm" onClick={addCorridorOverride}>Add</Button>
                  </div>

                  {/* Table */}
                  {margins.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No corridor overrides configured</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-2 font-medium text-muted-foreground">Corridor</th>
                            <th className="pb-2 font-medium text-muted-foreground">Fee %</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {margins.map((m) => (
                            <tr key={m.id} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 font-medium">{m.corridor}</td>
                              <td className="py-2.5">
                                {editingCorridor === m.corridor ? (
                                  <div className="flex items-center gap-2">
                                    <Input type="number" step="0.01" value={editCorridorPct} onChange={(e) => setEditCorridorPct(e.target.value)} className="w-[80px] h-8" />
                                    <Button size="sm" variant="ghost" onClick={() => updateCorridorOverride(m.corridor)}><Save className="h-3.5 w-3.5" /></Button>
                                  </div>
                                ) : (
                                  <span>{m.marginPct}%</span>
                                )}
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => { setEditingCorridor(m.corridor); setEditCorridorPct(String(m.marginPct)); }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => removeCorridorOverride(m.corridor)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* FX Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">FX Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>FX Source</Label>
                    <div className="flex items-center gap-2">
                      <Input value="Open Exchange Rates" readOnly className="max-w-[260px] bg-muted" />
                      <p className="text-xs text-muted-foreground">Read-only</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Cache TTL (seconds)</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={fxCacheTtl} onChange={(e) => setFxCacheTtl(e.target.value)} className="max-w-[160px]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rate lock (seconds)</Label>
                      <Input type="number" value={fxRateLock} onChange={(e) => setFxRateLock(e.target.value)} className="max-w-[160px]" />
                    </div>
                  </div>
                  <Button onClick={saveFxConfig} disabled={savingFx} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {savingFx ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                    Save
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 2: Corridors ─── */}
          {activeTab === 'corridors' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Corridor Overrides</CardTitle>
                </CardHeader>
                <CardContent>
                  {margins.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No corridor overrides configured</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-2 font-medium text-muted-foreground">Corridor</th>
                            <th className="pb-2 font-medium text-muted-foreground">Fee Override</th>
                            <th className="pb-2 font-medium text-muted-foreground">Status</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {margins.map((m) => (
                            <tr key={m.id} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 font-medium">
                                <span className="mr-2">{getFlag(m.corridor.split('-')[0] || '')}</span>
                                {m.corridor.split('-')[0]}
                                <span className="mx-2 text-muted-foreground">→</span>
                                <span className="mr-2">{getFlag(m.corridor.split('-')[1] || '')}</span>
                                {m.corridor.split('-')[1]}
                              </td>
                              <td className="py-2.5">{m.marginPct}%</td>
                              <td className="py-2.5">
                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                              </td>
                              <td className="py-2.5 text-right">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingCorridor(m.corridor); setEditCorridorPct(String(m.marginPct)); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Blocked countries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Blocked Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  {blockedCountries.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">No countries blocked. Blocked countries are configured in the platform settings.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {blockedCountries.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 text-sm py-1.5 px-3">
                          <span>{getFlag(c)}</span>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 3: Notifications ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notification Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Trigger</Label>
                    <select
                      className="h-9 w-full max-w-[300px] rounded-md border border-input bg-transparent px-3 text-sm"
                      value={selectedTrigger}
                      onChange={(e) => setSelectedTrigger(e.target.value)}
                    >
                      <option value="">Select a trigger...</option>
                      {TRIGGER_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTrigger && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="Your transfer to {recipient_name} is {status}" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email Body</Label>
                        <Textarea
                          rows={8}
                          value={tplBody}
                          onChange={(e) => setTplBody(e.target.value)}
                          placeholder="Hello {sender_name}, your transfer of {amount} {currency}..."
                        />
                        <p className="text-xs text-muted-foreground">Available variables: {VARIABLE_HINTS}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label>SMS Body</Label>
                          <span className={"text-xs " + (tplSmsBody.length > 160 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                            {tplSmsBody.length}/160
                          </span>
                        </div>
                        <Textarea
                          rows={3}
                          value={tplSmsBody}
                          onChange={(e) => setTplSmsBody(e.target.value)}
                          placeholder="Hi {sender_name}, {amount} {currency} sent to {recipient_name}. Ref: {reference}"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                          <Eye className="mr-2 h-3.5 w-3.5" />Preview
                        </Button>
                        <Button size="sm" onClick={saveTemplate} disabled={savingTemplate} className="bg-emerald-600 text-white hover:bg-emerald-700">
                          {savingTemplate ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                          Save template
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview dialog */}
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Template Preview</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {tplSubject && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Subject</p>
                        <p className="text-sm font-medium">{generatePreview().substring(0, 200)}</p>
                      </div>
                    )}
                    {tplBody && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Email Body</p>
                        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{generatePreview()}</pre>
                      </div>
                    )}
                    {tplSmsBody && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">SMS Body</p>
                        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{generatePreview()}</pre>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ─── Tab 4: Admin Accounts ─── */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Admin users table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Admin Users</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setAdminDialogOpen(true)}>
                    <Plus className="mr-2 h-3.5 w-3.5" />Add admin
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 font-medium text-muted-foreground">Name</th>
                          <th className="pb-2 font-medium text-muted-foreground">Email</th>
                          <th className="pb-2 font-medium text-muted-foreground">Role</th>
                          <th className="pb-2 font-medium text-muted-foreground">Status</th>
                          <th className="pb-2 font-medium text-muted-foreground">Last login</th>
                          <th className="pb-2 font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((a) => (
                          <tr key={a.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 font-medium">{a.fullName || '-'}</td>
                            <td className="py-2.5">{a.email}</td>
                            <td className="py-2.5">
                              <Badge variant="secondary">{ROLE_LABELS[a.role] || a.role}</Badge>
                            </td>
                            <td className="py-2.5">
                              <Badge className={a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                                {a.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditRoleDialog(a); setEditRole(a.role); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => toggleAdminActive(a)}>
                                  <Power className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {admins.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">No admin users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* My Account - Password & Email */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">My Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current email display */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Current email</p>
                      <p className="text-sm font-medium text-gray-900">{admin?.email || '-'}</p>
                    </div>
                    <Badge className={admin?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                      {admin?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Change email */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900">Change email address</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>New email</Label>
                        <Input type="email" value={ceNewEmail} onChange={(e) => setCeNewEmail(e.target.value)} placeholder="new@email.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Confirm with password</Label>
                        <Input type="password" value={ceCurrentPw} onChange={(e) => setCeCurrentPw(e.target.value)} placeholder="Current password" />
                      </div>
                    </div>
                    <Button onClick={changeEmail} disabled={savingEmail} size="sm" variant="outline">
                      {savingEmail ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Pencil className="mr-2 h-3.5 w-3.5" />}
                      Update email
                    </Button>
                  </div>

                  <Separator />

                  {/* Change password */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900">Change password</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Current password</Label>
                        <Input type="password" value={cpCurrent} onChange={(e) => setCpCurrent(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>New password</Label>
                        <Input type="password" value={cpNew} onChange={(e) => setCpNew(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Confirm new password</Label>
                        <Input type="password" value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={changePassword} disabled={savingPassword} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                      {savingPassword ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
                      Update password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Role descriptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4" />
                    Role Descriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
                      <div key={role} className="rounded-lg border p-3">
                        <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[role]}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── Add Admin Dialog ─── */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={newAdmin.fullName} onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })} placeholder="Jane Admin" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="admin@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary password</Label>
              <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
              <Button onClick={createAdmin} disabled={creatingAdmin} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {creatingAdmin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Role Dialog ─── */}
      <Dialog open={!!editRoleDialog} onOpenChange={(open) => { if (!open) setEditRoleDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editRoleDialog && (
              <p className="text-sm text-muted-foreground">Change role for <span className="font-medium text-gray-900">{editRoleDialog.email}</span></p>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditRoleDialog(null)}>Cancel</Button>
              <Button onClick={saveRole} disabled={savingRole} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {savingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}