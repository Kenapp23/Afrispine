'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Save,
  Shield,
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
    id: 'fincra',
    name: 'Fincra',
    description: 'Primary payment processor for collections, transfers, and payouts across Africa.',
    color: 'emerald',
    keyFields: [
      { name: 'fincra_public_key', label: 'Public Key', placeholder: 'pk_live_...', secret: false },
      { name: 'fincra_secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true },
    ],
  },
  {
    id: 'smile_id',
    name: 'Smile ID',
    description: 'Identity verification and KYC provider for sender onboarding.',
    color: 'blue',
    keyFields: [
      { name: 'smile_id_partner_id', label: 'Partner ID', placeholder: 'Your Smile ID partner ID', secret: false },
      { name: 'smile_id_api_key', label: 'API Key', placeholder: 'Your Smile ID API key', secret: true },
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
};

// ─── Partner Card Component ────────────────────────────────────────────────

function PartnerCard({ partner }: { partner: PartnerConfig }) {
  const colors = PARTNER_COLORS[partner.color] || PARTNER_COLORS.emerald;
  const [keysData, setKeysData] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/paystack-keys');
      const data = await res.json();
      setKeysData(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

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
      const res = await fetch('/api/admin/paystack-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/admin/paystack-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

// ─── Main Settings Page ──────────────────────────────────────────────────────

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">Platform configuration, partner API keys, and integration management</p>
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
    </div>
  );
}
