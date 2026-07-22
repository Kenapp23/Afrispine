// AfriSpine v1.1.0 - Bank-Grade API Health Monitor
'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Activity, Settings2, RefreshCw, Shield, TrendingUp, CreditCard, Image,
  Wallet, Zap, AlertCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import type { WealthHealthResponse, ProviderHealthSummary } from '@/lib/services/types';

const PROVIDER_META: Record<string, { icon: React.ReactNode; color: string; category: string; hasSecret?: boolean; hasBaseUrl?: boolean; baseUrlLabel?: string }> = {
  overall: { icon: <Activity className="h-5 w-5" />, color: 'text-emerald-600', category: 'System' },
  mystocks: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-emerald-500', category: 'Markets' },
  fincra: { icon: <CreditCard className="h-5 w-5" />, color: 'text-amber-500', category: 'Payments', hasSecret: true, hasBaseUrl: true, baseUrlLabel: 'Business ID' },
  openverse: { icon: <Image className="h-5 w-5" />, color: 'text-sky-500', category: 'Images' },
  paystack: { icon: <Wallet className="h-5 w-5" />, color: 'text-green-500', category: 'Payments', hasSecret: true },
  flutterwave: { icon: <Zap className="h-5 w-5" />, color: 'text-orange-500', category: 'Payments', hasSecret: true },
};

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    healthy: { variant: 'default', label: 'Operational' },
    degraded: { variant: 'secondary', label: 'Degraded' },
    unhealthy: { variant: 'destructive', label: 'Down' },
    unconfigured: { variant: 'outline', label: 'Not Configured' },
    error: { variant: 'destructive', label: 'Error' },
    all_down: { variant: 'destructive', label: 'All Down' },
  };
  const s = map[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'degraded') return <AlertCircle className="h-5 w-5 text-amber-500" />;
  if (status === 'unconfigured') return <Clock className="h-5 w-5 text-gray-400" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function ConfigDialog({ provider, onSaved }: { provider: string; onSaved: () => void }) {
  const meta = PROVIDER_META[provider] || {};
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ apiKey: '', secretKey: '', environment: 'sandbox', baseUrl: '' });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/wealth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...form }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ apiKey: '', secretKey: '', environment: 'sandbox', baseUrl: '' });
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {provider.charAt(0).toUpperCase() + provider.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="password" placeholder="Enter API key" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} />
          </div>
          {meta.hasSecret && (
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input id="secretKey" type="password" placeholder="Enter secret key" value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))} />
            </div>
          )}
          {meta.hasBaseUrl && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">{meta.baseUrlLabel || 'Base URL'}</Label>
              <Input id="baseUrl" placeholder={meta.baseUrlLabel || 'Base URL'} value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={form.environment} onValueChange={v => setForm(f => ({ ...f, environment: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving || !form.apiKey} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProviderCard({ p, onConfigSaved }: { p: ProviderHealthSummary; onConfigSaved: () => void }) {
  const meta = PROVIDER_META[p.provider];
  return (
    <Card className="relative">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className={`${meta?.color || 'text-gray-500'}`}>{meta?.icon || <Shield className="h-5 w-5" />}</div>
          <div>
            <CardTitle className="text-base font-semibold">{p.displayName}</CardTitle>
            <p className="text-xs text-muted-foreground">{meta?.category}</p>
          </div>
        </div>
        <ConfigDialog provider={p.provider} onSaved={onConfigSaved} />
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><StatusIcon status={p.overallStatus} />{statusBadge(p.overallStatus)}</div>
          {p.latencyMs > 0 && <span className="text-xs text-muted-foreground">{p.latencyMs}ms</span>}
        </div>
        {p.endpointsTotal > 0 && (
          <div className="text-xs text-muted-foreground">
            {p.endpointsOk}/{p.endpointsTotal} endpoints healthy
          </div>
        )}
        {p.endpoints.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {p.endpoints.map((ep, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{ep.name}</span>
                <span className={ep.result.status === 'healthy' ? 'text-green-600' : 'text-red-500'}>
                  {ep.result.status === 'healthy' ? 'OK' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverallCard({ data }: { data: WealthHealthResponse | null }) {
  if (!data) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="text-emerald-600"><Activity className="h-5 w-5" /></div>
          <CardTitle className="text-base font-semibold">Overall System Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2">{statusBadge(data.overall.status)}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Healthy</span><span className="text-green-600 font-medium">{data.overall.healthyProviders}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Degraded</span><span className="text-amber-600 font-medium">{data.overall.degradedProviders}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Down</span><span className="text-red-600 font-medium">{data.overall.unhealthyProviders}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Unconfigured</span><span className="text-gray-500 font-medium">{data.overall.unconfiguredProviders}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AfriSpineDashboard() {
  const [data, setData] = useState<WealthHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [lastRefresh, setLastRefresh] = useState('');

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/wealth/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastRefresh(new Date().toLocaleTimeString());
      setCountdown(30);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    if (countdown <= 0) { fetchHealth(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, fetchHealth]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Sidebar + Main layout matching screenshot */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r bg-white p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-700 text-sm leading-tight">AfriSpine</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {[
              { name: 'API Status', icon: <Activity className="h-4 w-4" />, active: true },
              { name: 'Digest Stories', icon: <Shield className="h-4 w-4" /> },
              { name: 'Digest Issues', icon: <Shield className="h-4 w-4" /> },
              { name: 'Contributors', icon: <Shield className="h-4 w-4" /> },
              { name: 'Digest Ads', icon: <Shield className="h-4 w-4" /> },
              { name: 'Growth Engine', icon: <TrendingUp className="h-4 w-4" /> },
              { name: 'Settings', icon: <Settings2 className="h-4 w-4" /> },
            ].map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  item.active
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}
              >
                {item.icon}{item.name}
              </button>
            ))}
          </nav>
          <Separator className="my-3" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">admin@afrispine.com</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Wealth API Status</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor mystocks.africa & Fincra connection health</p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && <span className="text-xs text-muted-foreground">Updated {lastRefresh}</span>}
              <span className="text-xs text-muted-foreground tabular-nums">{countdown}s</span>
              <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Unable to load partner status. Please try again.</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading && !data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}><CardContent className="pt-6"><Skeleton className="h-28 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <OverallCard data={data} />
                {data?.providers.map(p => (
                  <ProviderCard key={p.provider} p={p} onConfigSaved={fetchHealth} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-3 mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>AfriSpine &copy; {new Date().getFullYear()} &middot; Bank-Grade API Monitoring</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
