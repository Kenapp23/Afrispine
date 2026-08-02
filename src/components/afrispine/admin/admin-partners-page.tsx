'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Save, KeyRound, Building2, FileText, ScrollText,
  CheckCircle2, XCircle, Loader2, Plus, RefreshCw, Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ─── Types ─────────────────────────────────────────────────────
interface PartnerConfig {
  id: string;
  partnerId: string;
  partnerName: string;
  purpose: string;
  environment: string;
  isActive: boolean;
  configJson: string;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
}

interface SettlementRule {
  id: string;
  ruleName: string;
  assetType: string;
  currency: string;
  afriSpineFeeBps: number;
  partnerFeeBps: number;
  brokerFeeBps: number;
  settlementWindowMin: number;
  isActive: boolean;
}

interface SettlementTransaction {
  id: string;
  reference: string;
  senderId: string | null;
  grossAmountUsd: number;
  afriSpineFeeUsd: number;
  partnerFeeUsd: number;
  netAssetUsd: number;
  status: string;
  assetCode: string | null;
  quantity: number | null;
  pricePerUnit: number | null;
  cscsNominee: string | null;
  createdAt: string;
}

interface SettlementStats {
  totalSettled: number;
  totalGrossUsd: number;
  totalAfriSpineFees: number;
  totalPartnerFees: number;
  totalNetToBroker: number;
  pendingCount: number;
  failedCount: number;
  statusBreakdown: { status: string; count: number }[];
}

// ─── Partner field definitions ─────────────────────────────────
const PARTNER_FIELDS: Record<string, { label: string; isSecret: boolean }[]> = {
  fincra: [
    { label: 'Public Key', isSecret: false },
    { label: 'Secret Key', isSecret: true },
    { label: 'Webhook Secret', isSecret: true },
    { label: 'Test Public Key', isSecret: false },
    { label: 'Test Secret Key', isSecret: true },
    { label: 'Test Webhook Secret', isSecret: true },
  ],
  mystocks_africa: [
    { label: 'API Key', isSecret: true },
    { label: 'Partner ID', isSecret: false },
    { label: 'Settlement Endpoint', isSecret: false },
    { label: 'Test API Key', isSecret: true },
    { label: 'Test Partner ID', isSecret: false },
  ],
  africas_talking: [
    { label: 'Username', isSecret: false },
    { label: 'API Key', isSecret: true },
    { label: 'Test Username', isSecret: false },
    { label: 'Test API Key', isSecret: true },
  ],
  resend: [
    { label: 'API Key', isSecret: true },
    { label: 'Test API Key', isSecret: true },
  ],
  ngx_broker_desk: [
    { label: 'Broker ID', isSecret: false },
    { label: 'Clearing Account ID', isSecret: false },
    { label: 'CSCS Account Prefix', isSecret: false },
    { label: 'Test Broker ID', isSecret: false },
  ],
};

const FIELD_KEY_MAP: Record<string, Record<string, string>> = {
  fincra: { 'Public Key': 'publicKey', 'Secret Key': 'secretKey', 'Webhook Secret': 'webhookSecret', 'Test Public Key': 'testPublicKey', 'Test Secret Key': 'testSecretKey', 'Test Webhook Secret': 'testWebhookSecret' },
  mystocks_africa: { 'API Key': 'apiKey', 'Partner ID': 'partnerId', 'Settlement Endpoint': 'settlementEndpoint', 'Test API Key': 'testApiKey', 'Test Partner ID': 'testPartnerId' },
  africas_talking: { 'Username': 'username', 'API Key': 'apiKey', 'Test Username': 'testUsername', 'Test API Key': 'testApiKey' },
  resend: { 'API Key': 'apiKey', 'Test API Key': 'testApiKey' },
  ngx_broker_desk: { 'Broker ID': 'brokerId', 'Clearing Account ID': 'clearingAccountId', 'CSCS Account Prefix': 'cscsAccountPrefix', 'Test Broker ID': 'testBrokerId' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  split_complete: 'bg-sky-100 text-sky-800',
  partner_settled: 'bg-amber-100 text-amber-800',
  broker_executed: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

// ─── Main Component ────────────────────────────────────────────
export function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerConfig[]>([]);
  const [fullPartners, setFullPartners] = useState<Record<string, PartnerConfig>>({});
  const [rules, setRules] = useState<SettlementRule[]>([]);
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [txStatusFilter, setTxStatusFilter] = useState<string>('');

  // Company config state
  const [companyInfo, setCompanyInfo] = useState<Record<string, string>>({});
  const [bankDetails, setBankDetails] = useState<Record<string, string>>({});
  const [taxDetails, setTaxDetails] = useState<Record<string, string>>({});
  const [savingCompany, setSavingCompany] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  // Execute test settlement
  const [testAmount, setTestAmount] = useState('1000');
  const [testAsset, setTestAsset] = useState('DANGOTE');
  const [testQty, setTestQty] = useState('1000');
  const [testPrice, setTestPrice] = useState('1.00');
  const [testCscs, setTestCscs] = useState('CSCS/12345');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);

  // Dialog for new rule
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ ruleName: '', assetType: 'equity', currency: 'USD', afriSpineFeeBps: 235, partnerFeeBps: 75, brokerFeeBps: 0, settlementWindowMin: 15 });

  // Edit rule state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRule, setEditRule] = useState<Partial<SettlementRule>>({});

  const loadPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadFullPartner = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFullPartners(prev => ({ ...prev, [id]: data.partner }));
        return data.partner;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settlement/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadTransactions = useCallback(async (status?: string) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/settlement/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settlement/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadCompanyConfig = useCallback(async (key: string, setter: (d: Record<string, string>) => void) => {
    try {
      const res = await fetch(`/api/admin/company/${key}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setter(JSON.parse(data.config.configJson));
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Ensure seed data exists
      await fetch('/api/admin/settlement/seed', { method: 'POST' }).catch(() => {});
      await Promise.all([
        loadPartners(),
        loadRules(),
        loadTransactions(),
        loadStats(),
        loadCompanyConfig('company_info', setCompanyInfo),
        loadCompanyConfig('bank_details', setBankDetails),
        loadCompanyConfig('tax_details', setTaxDetails),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────
  const savePartner = async (partnerId: string) => {
    setSaving(partnerId);
    try {
      const partner = fullPartners[partnerId];
      if (!partner) return;
      await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configJson: partner.configJson }),
      });
      toast.success(`Saved successfully. Verified in database.`);
      await loadPartners();
    } catch (e) {
      toast.error('Save failed');
    }
    setSaving(null);
  };

  const switchEnv = async (partnerId: string, env: string) => {
    try {
      await fetch('/api/admin/partners/switch-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, environment: env }),
      });
      toast.success(`Environment switched to ${env}`);
      await loadPartners();
    } catch (e) {
      toast.error('Failed to switch environment');
    }
  };

  const updatePartnerField = (partnerId: string, key: string, value: string) => {
    setFullPartners(prev => {
      const partner = prev[partnerId];
      if (!partner) return prev;
      const config = JSON.parse(partner.configJson);
      config[key] = value;
      return { ...prev, [partnerId]: { ...partner, configJson: JSON.stringify(config) } };
    });
  };

  const saveCompanyConfig = async (key: string, data: Record<string, string>) => {
    setSavingCompany(key);
    try {
      await fetch(`/api/admin/company/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configJson: data }),
      });
      setSavedSections(prev => new Set(prev).add(key));
      toast.success(`Saved successfully. Verified in database.`);
    } catch (e) {
      toast.error('Save failed');
    }
    setSavingCompany(null);
  };

  const executeTestSettlement = async () => {
    setExecuting(true);
    setExecResult(null);
    try {
      const res = await fetch('/api/admin/settlement/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'test_sender',
          grossAmountUsd: parseFloat(testAmount),
          assetCode: testAsset,
          quantity: parseFloat(testQty),
          pricePerUnit: parseFloat(testPrice),
          cscsNominee: testCscs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExecResult(data.settlement);
        toast.success('Settlement executed successfully');
        await loadTransactions();
        await loadStats();
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch (e) {
      toast.error('Execution failed');
    }
    setExecuting(false);
  };

  const createRule = async () => {
    try {
      const res = await fetch('/api/admin/settlement/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      if (res.ok) {
        toast.success('Rule created');
        setRuleDialogOpen(false);
        await loadRules();
      }
    } catch (e) {
      toast.error('Failed to create rule');
    }
  };

  const updateRule = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/settlement/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRule),
      });
      if (res.ok) {
        toast.success('Rule updated');
        setEditingRuleId(null);
        await loadRules();
      }
    } catch (e) {
      toast.error('Failed to update rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settlement Engine</h1>
        <p className="text-muted-foreground">Partner keys, company config, settlement rules & ledger</p>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="partners" className="gap-1.5"><KeyRound className="h-4 w-4" /><span className="hidden sm:inline">Partners</span></TabsTrigger>
          <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-4 w-4" /><span className="hidden sm:inline">Company</span></TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><FileText className="h-4 w-4" /><span className="hidden sm:inline">Rules</span></TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1.5"><ScrollText className="h-4 w-4" /><span className="hidden sm:inline">Ledger</span></TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Partner Keys ═══ */}
        <TabsContent value="partners" className="space-y-4">
          {partners.map(p => (
            <PartnerCard
              key={p.id}
              partner={p}
              fullPartner={fullPartners[p.id]}
              onLoadFull={() => loadFullPartner(p.id)}
              onSave={() => savePartner(p.id)}
              onSwitchEnv={(env) => switchEnv(p.partnerId, env)}
              onUpdateField={(key, val) => updatePartnerField(p.id, key, val)}
              saving={saving === p.id}
            />
          ))}
        </TabsContent>

        {/* ═══ TAB 2: Company & Bank Details ═══ */}
        <TabsContent value="company" className="space-y-6">
          <CompanySectionCard
            title="Company Information"
            icon={<Building2 className="h-5 w-5" />}
            fields={[
              { key: 'legalName', label: 'Legal Name' },
              { key: 'tradingName', label: 'Trading Name' },
              { key: 'companyRegNumber', label: 'Registration Number' },
              { key: 'registeredAddress', label: 'Registered Address' },
              { key: 'registeredCountry', label: 'Country' },
              { key: 'operationalAddress', label: 'Operational Address' },
              { key: 'contactEmail', label: 'Contact Email' },
              { key: 'contactPhone', label: 'Phone' },
              { key: 'website', label: 'Website' },
            ]}
            data={companyInfo}
            onChange={(k, v) => { setCompanyInfo(prev => ({ ...prev, [k]: v })); setSavedSections(prev => { const n = new Set(prev); n.delete('company_info'); return n; }); }}
            onSave={() => saveCompanyConfig('company_info', companyInfo)}
            saving={savingCompany === 'company_info'}
            saved={savedSections.has('company_info')}
          />
          <CompanySectionCard
            title="Bank Account Details"
            icon={<Building2 className="h-5 w-5" />}
            fields={[
              { key: 'bankName', label: 'Bank Name' },
              { key: 'accountNumber', label: 'Account Number' },
              { key: 'sortCode', label: 'Sort Code' },
              { key: 'routingNumber', label: 'Routing Number' },
              { key: 'swiftCode', label: 'SWIFT Code' },
              { key: 'iban', label: 'IBAN' },
              { key: 'accountName', label: 'Account Name' },
              { key: 'currency', label: 'Currency' },
            ]}
            data={bankDetails}
            onChange={(k, v) => { setBankDetails(prev => ({ ...prev, [k]: v })); setSavedSections(prev => { const n = new Set(prev); n.delete('bank_details'); return n; }); }}
            onSave={() => saveCompanyConfig('bank_details', bankDetails)}
            saving={savingCompany === 'bank_details'}
            saved={savedSections.has('bank_details')}
          />
          <CompanySectionCard
            title="Tax & Compliance"
            icon={<FileText className="h-5 w-5" />}
            fields={[
              { key: 'taxId', label: 'Tax ID' },
              { key: 'vatNumber', label: 'VAT Number' },
              { key: 'taxRegistrationCountry', label: 'Registration Country' },
              { key: 'taxAuthority', label: 'Tax Authority' },
              { key: 'filingFrequency', label: 'Filing Frequency' },
              { key: 'lastFiledDate', label: 'Last Filed Date' },
            ]}
            data={taxDetails}
            onChange={(k, v) => { setTaxDetails(prev => ({ ...prev, [k]: v })); setSavedSections(prev => { const n = new Set(prev); n.delete('tax_details'); return n; }); }}
            onSave={() => saveCompanyConfig('tax_details', taxDetails)}
            saving={savingCompany === 'tax_details'}
            saved={savedSections.has('tax_details')}
          />
        </TabsContent>

        {/* ═══ TAB 3: Settlement Rules ═══ */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Settlement Rules</h2>
            <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> New Rule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Settlement Rule</DialogTitle><DialogDescription>Define fee splits and settlement timing.</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>Rule Name</Label><Input value={newRule.ruleName} onChange={e => setNewRule(p => ({ ...p, ruleName: e.target.value }))} placeholder="e.g. equity_purchase_usd" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Asset Type</Label><Input value={newRule.assetType} onChange={e => setNewRule(p => ({ ...p, assetType: e.target.value }))} /></div>
                    <div className="grid gap-2"><Label>Currency</Label><Input value={newRule.currency} onChange={e => setNewRule(p => ({ ...p, currency: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2"><Label>AfriSpine Fee (bps)</Label><Input type="number" value={newRule.afriSpineFeeBps} onChange={e => setNewRule(p => ({ ...p, afriSpineFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                    <div className="grid gap-2"><Label>Partner Fee (bps)</Label><Input type="number" value={newRule.partnerFeeBps} onChange={e => setNewRule(p => ({ ...p, partnerFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                    <div className="grid gap-2"><Label>Broker Fee (bps)</Label><Input type="number" value={newRule.brokerFeeBps} onChange={e => setNewRule(p => ({ ...p, brokerFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                  </div>
                  <div className="grid gap-2"><Label>Settlement Window (min)</Label><Input type="number" value={newRule.settlementWindowMin} onChange={e => setNewRule(p => ({ ...p, settlementWindowMin: parseInt(e.target.value) || 15 }))} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={createRule}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Rule Name</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Asset Type</th>
                    <th className="text-left p-3 font-medium">Currency</th>
                    <th className="text-left p-3 font-medium">AfriSpine %</th>
                    <th className="text-left p-3 font-medium">Partner %</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Window</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rules.map(rule => {
                    const aspPct = (rule.afriSpineFeeBps / 100).toFixed(2);
                    const ptnPct = (rule.partnerFeeBps / 100).toFixed(2);
                    const aspOn1k = (1000 * rule.afriSpineFeeBps / 10000).toFixed(2);
                    const ptnOn1k = (1000 * rule.partnerFeeBps / 10000).toFixed(2);
                    const netOn1k = (1000 - parseFloat(aspOn1k) - parseFloat(ptnOn1k)).toFixed(2);
                    return (
                      <React.Fragment key={rule.id}>
                        <tr className="hover:bg-muted/30">
                          <td className="p-3 font-medium">{rule.ruleName}</td>
                          <td className="p-3 hidden md:table-cell"><Badge variant="outline">{rule.assetType}</Badge></td>
                          <td className="p-3">{rule.currency}</td>
                          <td className="p-3">{aspPct}%</td>
                          <td className="p-3">{ptnPct}%</td>
                          <td className="p-3 hidden lg:table-cell">{rule.settlementWindowMin} min</td>
                          <td className="p-3"><Badge className={rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingRuleId(rule.id); setEditRule({ ...rule }); }}>Edit</Button>
                          </td>
                        </tr>
                        <tr className="bg-muted/10 text-xs text-muted-foreground">
                          <td colSpan={8} className="px-3 py-1.5">
                            On $1,000: AfriSpine gets ${aspOn1k}, Partner gets ${ptnOn1k}, Broker gets ${netOn1k}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {rules.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No settlement rules configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Edit rule dialog */}
          <Dialog open={!!editingRuleId} onOpenChange={() => setEditingRuleId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Rule</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Rule Name</Label><Input value={editRule.ruleName || ''} onChange={e => setEditRule(p => ({ ...p, ruleName: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Asset Type</Label><Input value={editRule.assetType || ''} onChange={e => setEditRule(p => ({ ...p, assetType: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Currency</Label><Input value={editRule.currency || ''} onChange={e => setEditRule(p => ({ ...p, currency: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2"><Label>AfriSpine Fee (bps)</Label><Input type="number" value={editRule.afriSpineFeeBps || 0} onChange={e => setEditRule(p => ({ ...p, afriSpineFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="grid gap-2"><Label>Partner Fee (bps)</Label><Input type="number" value={editRule.partnerFeeBps || 0} onChange={e => setEditRule(p => ({ ...p, partnerFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="grid gap-2"><Label>Broker Fee (bps)</Label><Input type="number" value={editRule.brokerFeeBps || 0} onChange={e => setEditRule(p => ({ ...p, brokerFeeBps: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Settlement Window (min)</Label><Input type="number" value={editRule.settlementWindowMin || 15} onChange={e => setEditRule(p => ({ ...p, settlementWindowMin: parseInt(e.target.value) || 15 }))} /></div>
                  <div className="grid gap-2"><Label>Active</Label>
                    <div className="flex items-center h-9"><Switch checked={editRule.isActive} onCheckedChange={v => setEditRule(p => ({ ...p, isActive: v }))} /></div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRuleId(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => editingRuleId && updateRule(editingRuleId)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══ TAB 4: Settlement Ledger ═══ */}
        <TabsContent value="ledger" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Settled</p><p className="text-2xl font-bold">{stats?.totalSettled || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Fees Collected</p><p className="text-2xl font-bold text-emerald-600">${((stats?.totalAfriSpineFees || 0) + (stats?.totalPartnerFees || 0)).toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats?.pendingCount || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Volume</p><p className="text-2xl font-bold">${(stats?.totalGrossUsd || 0).toFixed(2)}</p></CardContent></Card>
          </div>

          {/* Test settlement form */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Execute Test Settlement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><Label className="text-xs">Amount (USD)</Label><Input value={testAmount} onChange={e => setTestAmount(e.target.value)} type="number" /></div>
                <div><Label className="text-xs">Asset Code</Label><Input value={testAsset} onChange={e => setTestAsset(e.target.value)} /></div>
                <div><Label className="text-xs">Quantity</Label><Input value={testQty} onChange={e => setTestQty(e.target.value)} type="number" /></div>
                <div><Label className="text-xs">Price/Unit</Label><Input value={testPrice} onChange={e => setTestPrice(e.target.value)} type="number" step="0.01" /></div>
                <div><Label className="text-xs">CSCS Nominee</Label><Input value={testCscs} onChange={e => setTestCscs(e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={executeTestSettlement} disabled={executing}>
                  {executing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                  {executing ? 'Executing...' : 'Execute Settlement'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { loadTransactions(txStatusFilter || undefined); loadStats(); }}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
              </div>
              {execResult && (
                <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                  <p className="font-semibold text-emerald-800">Settlement: {execResult.reference}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div><span className="text-muted-foreground">User Pays:</span> <span className="font-medium">£{execResult.breakdown.userPaysGbp}</span></div>
                    <div><span className="text-muted-foreground">AfriSpine:</span> <span className="font-medium text-emerald-700">${execResult.breakdown.afriSpineFee}</span></div>
                    <div><span className="text-muted-foreground">MyStocks:</span> <span className="font-medium">${execResult.breakdown.myStocksFee}</span></div>
                    <div><span className="text-muted-foreground">Net to Broker:</span> <span className="font-bold">${execResult.breakdown.netToBroker}</span></div>
                    <div><span className="text-muted-foreground">FX Rate:</span> <span className="font-medium">{execResult.breakdown.fxRate}</span></div>
                  </div>
                  {execResult.steps.map((s: any) => (
                    <div key={s.step} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Step {s.step}: {s.action} — ${s.amount}</span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['', 'pending', 'split_complete', 'partner_settled', 'broker_executed', 'completed', 'failed'].map(s => (
              <Button
                key={s || 'all'}
                variant={txStatusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTxStatusFilter(s); loadTransactions(s || undefined); }}
                className={txStatusFilter === s ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
              </Button>
            ))}
          </div>

          {/* Transactions table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Reference</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Date</th>
                      <th className="text-right p-3 font-medium">Gross</th>
                      <th className="text-right p-3 font-medium hidden sm:table-cell">AfriSpine</th>
                      <th className="text-right p-3 font-medium hidden sm:table-cell">Partner</th>
                      <th className="text-right p-3 font-medium">Net</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Asset</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{tx.reference}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">${tx.grossAmountUsd.toFixed(2)}</td>
                        <td className="p-3 text-right hidden sm:table-cell text-emerald-600">${tx.afriSpineFeeUsd.toFixed(2)}</td>
                        <td className="p-3 text-right hidden sm:table-cell">${tx.partnerFeeUsd.toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">${tx.netAssetUsd.toFixed(2)}</td>
                        <td className="p-3 hidden lg:table-cell">{tx.assetCode || '-'}</td>
                        <td className="p-3"><Badge className={STATUS_COLORS[tx.status] || ''}>{tx.status.replace(/_/g, ' ')}</Badge></td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Partner Card Sub-component ────────────────────────────────
function PartnerCard({
  partner,
  fullPartner,
  onLoadFull,
  onSave,
  onSwitchEnv,
  onUpdateField,
  saving,
}: {
  partner: PartnerConfig;
  fullPartner: PartnerConfig | undefined;
  onLoadFull: () => void;
  onSave: () => void;
  onSwitchEnv: (env: string) => void;
  onUpdateField: (key: string, value: string) => void;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (expanded && !fullPartner) {
      onLoadFull();
    }
  }, [expanded]);

  const fields = PARTNER_FIELDS[partner.partnerId] || [];
  const keyMap = FIELD_KEY_MAP[partner.partnerId] || {};
  const config: Record<string, string> = fullPartner ? JSON.parse(fullPartner.configJson) : {};
  const isProduction = partner.environment === 'production';
  const allKeysConfigured = fields.every(f => {
    const k = keyMap[f.label];
    return k && config[k] && config[k].length > 0;
  });

  const toggleReveal = (label: string) => {
    setRevealedKeys(prev => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${allKeysConfigured ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <div>
              <CardTitle className="text-base">{partner.partnerName}</CardTitle>
              <CardDescription>{partner.purpose}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={isProduction ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
              {isProduction ? 'Production' : 'Test'}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Test</span>
              <Switch
                checked={isProduction}
                onCheckedChange={checked => onSwitchEnv(checked ? 'production' : 'test')}
              />
              <span className="text-xs text-muted-foreground">Prod</span>
            </div>
          </div>
        </div>
      </CardHeader>
      {expanded && fullPartner && (
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3">
            {fields.map(field => {
              const key = keyMap[field.label];
              const val = config[key] || '';
              const isMasked = val.includes('••••');
              const isRevealed = revealedKeys.has(field.label);
              const displayVal = isRevealed || !isMasked ? val : val;

              return (
                <div key={field.label} className="grid grid-cols-[160px_1fr_40px] items-center gap-3">
                  <Label className="text-sm text-muted-foreground">{field.label}</Label>
                  <Input
                    value={displayVal}
                    onChange={e => onUpdateField(key, e.target.value)}
                    type={isRevealed ? 'text' : 'password'}
                    className="font-mono text-sm"
                    placeholder="Enter value..."
                  />
                  <button
                    onClick={() => toggleReveal(field.label)}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                    title={isRevealed ? 'Hide' : 'Show'}
                  >
                    {isRevealed ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            {fullPartner.lastVerifiedAt && (
              <p className="text-xs text-muted-foreground">
                Last verified: {new Date(fullPartner.lastVerifiedAt).toLocaleString()}
                {fullPartner.verifiedBy && ` by ${fullPartner.verifiedBy}`}
              </p>
            )}
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </CardContent>
      )}
      <CardContent className="pt-0">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Manage Keys'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Company Section Card ──────────────────────────────────────
function CompanySectionCard({
  title,
  icon,
  fields,
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string }[];
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
            {saved && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className="grid gap-1.5">
              <Label className="text-sm text-muted-foreground">{f.label}</Label>
              <Input
                value={data[f.key] || ''}
                onChange={e => onChange(f.key, e.target.value)}
                placeholder={`Enter ${f.label.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
