'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Mail,
  Hash,
  MapPin,
  CreditCard,
  Save,
  AlertTriangle,
  Shield,
  Bell,
  Globe,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

// ─── Paystack Keys Section ───────────────────────────────────────────────────

function PaystackKeysSection() {
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingKeys, setExistingKeys] = useState<{
    secret?: { masked: string; isSet: boolean; length: number };
    public?: { value?: string; masked?: string; isSet: boolean; length: number };
  }>({});

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/paystack-keys');
      const data = await res.json();
      if (data.keys) {
        setExistingKeys(data.keys);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleSave = async () => {
    if (!secretKey.trim() && !publicKey.trim()) {
      setMessage({ type: 'error', text: 'Enter at least one key' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/paystack-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: secretKey.trim() || undefined,
          publicKey: publicKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save keys' });
      } else {
        setMessage({ type: 'success', text: data.message || 'Keys saved successfully' });
        setSecretKey('');
        setPublicKey('');
        await fetchKeys();
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyName: string) => {
    try {
      const res = await fetch('/api/admin/paystack-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${keyName} removed` });
        await fetchKeys();
      }
    } catch {}
  };

  const secretIsSet = existingKeys.secret?.isSet;
  const publicIsSet = existingKeys.public?.isSet;
  const allSet = secretIsSet && publicIsSet;

  return (
    <Card className={allSet ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Paystack API Keys
                {allSet ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Live
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Securely store your Paystack test or live API keys. Keys are encrypted at rest and validated before saving.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchKeys}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Status */}
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Secret Key</p>
                  {secretIsSet ? (
                    <p className="text-xs text-emerald-600 font-mono">{existingKeys.secret?.masked}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not set</p>
                  )}
                </div>
              </div>
              {secretIsSet && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  onClick={() => handleDelete('paystack_secret_key')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Public Key</p>
                  {publicIsSet ? (
                    <p className="text-xs text-emerald-600 font-mono">{existingKeys.public?.value || existingKeys.public?.masked}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not set</p>
                  )}
                </div>
              </div>
              {publicIsSet && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  onClick={() => handleDelete('paystack_public_key')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="rounded-lg border bg-white p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {secretIsSet ? 'Update Keys' : 'Add Keys'}
          </p>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              Secret Key
              <Badge variant="outline" className="text-xs font-normal">sk_test_... or sk_live_...</Badge>
            </label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={secretIsSet ? 'Leave blank to keep current key' : 'sk_test_xxxxxxxxxxxxxxxx'}
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your server-side key for API calls, webhooks, and refunds. Never share this key.
            </p>
          </div>

          <Separator />

          {/* Public Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5 text-emerald-500" />
              Public Key
              <Badge variant="outline" className="text-xs font-normal">pk_test_... or pk_live_...</Badge>
            </label>
            <Input
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder={publicIsSet ? 'Leave blank to keep current key' : 'pk_test_xxxxxxxxxxxxxxxx'}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Your client-side key for Paystack checkout embed. Safe to expose in frontend code.
            </p>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="rounded-lg border border-dashed bg-blue-50/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Webhook Configuration</p>
          <p className="text-xs text-muted-foreground">
            In your Paystack Dashboard, add this webhook URL to receive payment events:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border rounded-md px-3 py-1.5 text-xs font-mono text-blue-700 select-all">
              https://yourdomain.com/api/webhooks/paystack
            </code>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => {
              navigator.clipboard.writeText('https://yourdomain.com/api/webhooks/paystack');
            }}>
              Copy
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg border p-3 flex items-center gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={loading || (!secretKey.trim() && !publicKey.trim())}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating & Saving...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {secretIsSet ? 'Update Keys' : 'Save & Validate Keys'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Keys are validated against the Paystack API before saving
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Settlement & Compliance Sections (existing) ─────────────────────────────

interface SettingField {
  label: string;
  value: string;
  icon: React.ElementType;
  placeholder?: string;
  description?: string;
}

const settlementConfig: SettingField[] = [
  { label: 'Company Name', value: 'AfriSpine Ltd', icon: Building2, description: 'Legal entity name for settlement reports' },
  { label: 'Registration Number', value: 'ZA-2024-01892', icon: Hash, description: 'Company registration / incorporation number' },
  { label: 'Registered Address', value: '14 Broadwick Street, London W1F 0HW, United Kingdom', icon: MapPin, placeholder: 'Full registered business address' },
  { label: 'Paystack Business ID', value: '', icon: CreditCard, description: 'Your Paystack integration business identifier' },
  { label: 'Settlement Notify Email', value: 'finance@afrispine.io', icon: Mail, description: 'Email address for settlement batch notifications' },
];

const complianceSettings = [
  { label: 'AML Provider', value: 'ComplyAdvantage', icon: Shield },
  { label: 'KYC Provider', value: 'Onfido', icon: Shield },
  { label: 'Maximum Transfer Amount', value: '£5,000.00', icon: Globe },
  { label: 'Compliance Alert Email', value: 'compliance@afrispine.io', icon: Bell },
];

function SettingRow({ field, index, total }: { field: SettingField; index: number; total: number }) {
  const Icon = field.icon;
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium text-gray-900">{field.label}</label>
          <Input
            defaultValue={field.value}
            placeholder={field.placeholder}
            className="max-w-lg"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      </div>
      {index < total - 1 && <Separator className="my-4" />}
    </>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">Platform configuration, API keys, settlement, and compliance settings</p>
      </div>

      {/* Paystack API Keys - TOP PRIORITY */}
      <PaystackKeysSection />

      {/* Settlement Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settlement Configuration</CardTitle>
          <CardDescription>
            Core business and settlement details used for processing and reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {settlementConfig.map((field, idx) => (
            <SettingRow key={field.label} field={field} index={idx} total={settlementConfig.length} />
          ))}
        </CardContent>
        <div className="px-6 pb-6">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-2 h-4 w-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Compliance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Settings</CardTitle>
          <CardDescription>AML and KYC provider configuration and compliance thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {complianceSettings.map((field, idx) => (
            <SettingRow key={field.label} field={field} index={idx} total={complianceSettings.length} />
          ))}
        </CardContent>
        <div className="px-6 pb-6">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-2 h-4 w-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">Configuration changes require careful review</p>
                <p className="text-xs text-red-600">
                  Changes to Paystack API keys, settlement configuration, or compliance settings
                  will take effect immediately and may impact live transactions. Always test in
                  staging before applying to production.
                </p>
              </div>
            </div>
            <Separator className="bg-red-200" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reset to defaults</p>
                <p className="text-xs text-muted-foreground">Restore all settings to their original default values</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0">
                Reset All Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}