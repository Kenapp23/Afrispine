'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  Users,
  ArrowLeftRight,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  ArrowUpDown,
  TrendingUp,
  Building2,
  Mail,
  Globe,
  Hash,
  Building,
  Edit3,
  Ban,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileText,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

interface BusinessAccount {
  id: string;
  companyName: string;
  companyRegNumber: string;
  countryOfIncorporation: string;
  industry: string;
  signatoryName: string;
  email: string;
  phone: string;
  monthlyVolumeUsd: number;
  useCase: string;
  kybStatus: string;
  kybReviewedById?: string;
  kybReviewedByName?: string;
  kybReviewedAt?: string;
  feePct: number;
  dailyLimitUsd: number;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
}

interface BusinessTransaction {
  id: string;
  reference: string;
  businessAccountId: string;
  businessAccount: { companyName: string };
  status: string;
  sellCurrency: string;
  sellAmount: number;
  buyCurrency: string;
  buyAmount: number;
  fxRate: number;
  marginPct: number;
  marginAmount: number;
  beneficiaryName: string;
  beneficiaryBank: string;
  createdAt: string;
  settledAt?: string;
  failedAt?: string;
}

interface RevenueData {
  totalVolume: number;
  totalMargin: number;
  transactionCount: number;
  avgDealSize: number;
}

interface ApiData {
  accounts: BusinessAccount[];
  transactions: BusinessTransaction[];
  pendingCount: number;
  approvedCount: number;
  totalTxCount: number;
  txCountMap: Record<string, number>;
  revenue: RevenueData;
}

// ─── Mock data fallback ────────────────────────────────────────────────────

const mockAccounts: BusinessAccount[] = [
  {
    id: 'mock-1', companyName: 'Savanna Logistics Ltd', companyRegNumber: 'KE-2024-5512',
    countryOfIncorporation: 'Kenya', industry: 'Import/Export', signatoryName: 'James Mwangi',
    email: 'james@savannalogistics.co.ke', phone: '+254 720 111 222',
    monthlyVolumeUsd: 250000, useCase: 'Supplier payments',
    kybStatus: 'pending', feePct: 1.0, dailyLimitUsd: 100000,
    accountStatus: 'pending', createdAt: '2025-06-28T10:00:00Z', updatedAt: '2025-06-28T10:00:00Z',
  },
  {
    id: 'mock-2', companyName: 'Lagos TechHub Inc', companyRegNumber: 'NG-RC-88231',
    countryOfIncorporation: 'Nigeria', industry: 'Technology', signatoryName: 'Amina Okonkwo',
    email: 'aminan@lagostechub.ng', phone: '+234 801 234 5678',
    monthlyVolumeUsd: 500000, useCase: 'Payroll',
    kybStatus: 'pending', feePct: 1.0, dailyLimitUsd: 100000,
    accountStatus: 'pending', createdAt: '2025-06-27T14:30:00Z', updatedAt: '2025-06-27T14:30:00Z',
  },
  {
    id: 'mock-3', companyName: 'Accra Trade Co', companyRegNumber: 'GH-CS-90812',
    countryOfIncorporation: 'Ghana', industry: 'Manufacturing', signatoryName: 'Kwame Asante',
    email: 'kwame@accratrade.com.gh', phone: '+233 24 456 7890',
    monthlyVolumeUsd: 120000, useCase: 'Import payments',
    kybStatus: 'approved', feePct: 0.75, dailyLimitUsd: 200000,
    accountStatus: 'active', createdAt: '2025-06-15T09:00:00Z', updatedAt: '2025-06-20T16:00:00Z',
    kybReviewedByName: 'admin@afrispine.io',
  },
  {
    id: 'mock-4', companyName: 'Nairobi Fintech Solutions', companyRegNumber: 'KE-2024-3301',
    countryOfIncorporation: 'Kenya', industry: 'Financial Services', signatoryName: 'Grace Njeri',
    email: 'grace@nbifintech.co.ke', phone: '+254 733 999 888',
    monthlyVolumeUsd: 800000, useCase: 'Profit repatriation',
    kybStatus: 'approved', feePct: 0.5, dailyLimitUsd: 500000,
    accountStatus: 'active', createdAt: '2025-06-01T08:00:00Z', updatedAt: '2025-06-05T11:00:00Z',
    kybReviewedByName: 'admin@afrispine.io',
  },
  {
    id: 'mock-5', companyName: 'Dar es Salaam Exports', companyRegNumber: 'TZ-REG-44521',
    countryOfIncorporation: 'Tanzania', industry: 'Agriculture', signatoryName: 'Hassan Mohamed',
    email: 'hassan@daressalaamexp.tz', phone: '+255 678 123 456',
    monthlyVolumeUsd: 75000, useCase: 'NGO disbursements',
    kybStatus: 'rejected', feePct: 1.0, dailyLimitUsd: 100000,
    accountStatus: 'rejected', createdAt: '2025-06-10T12:00:00Z', updatedAt: '2025-06-12T09:00:00Z',
  },
];

const mockTransactions: BusinessTransaction[] = [
  {
    id: 'bt-1', reference: 'BIZ-2026-000412', businessAccountId: 'mock-3',
    businessAccount: { companyName: 'Accra Trade Co' },
    status: 'settled', sellCurrency: 'USD', sellAmount: 35000,
    buyCurrency: 'GHS', buyAmount: 525000, fxRate: 15.0,
    marginPct: 0.75, marginAmount: 262.5,
    beneficiaryName: 'Ghana Supplies Ltd', beneficiaryBank: 'GCB Bank',
    createdAt: '2025-06-29T14:00:00Z', settledAt: '2025-06-30T10:00:00Z',
  },
  {
    id: 'bt-2', reference: 'BIZ-2026-000415', businessAccountId: 'mock-4',
    businessAccount: { companyName: 'Nairobi Fintech Solutions' },
    status: 'processing', sellCurrency: 'USD', sellAmount: 120000,
    buyCurrency: 'KES', buyAmount: 15360000, fxRate: 128.0,
    marginPct: 0.5, marginAmount: 600,
    beneficiaryName: 'Central Bank of Kenya', beneficiaryBank: 'CBK',
    createdAt: '2025-06-30T09:00:00Z',
  },
  {
    id: 'bt-3', reference: 'BIZ-2026-000418', businessAccountId: 'mock-3',
    businessAccount: { companyName: 'Accra Trade Co' },
    status: 'settled', sellCurrency: 'GBP', sellAmount: 15000,
    buyCurrency: 'GHS', buyAmount: 226500, fxRate: 15.1,
    marginPct: 0.75, marginAmount: 112.5,
    beneficiaryName: 'Accra Materials Ltd', beneficiaryBank: 'Stanbic Bank Ghana',
    createdAt: '2025-06-25T11:00:00Z', settledAt: '2025-06-26T08:00:00Z',
  },
  {
    id: 'bt-4', reference: 'BIZ-2026-000420', businessAccountId: 'mock-4',
    businessAccount: { companyName: 'Nairobi Fintech Solutions' },
    status: 'failed', sellCurrency: 'USD', sellAmount: 50000,
    buyCurrency: 'KES', buyAmount: 0, fxRate: 129.0,
    marginPct: 0.5, marginAmount: 250,
    beneficiaryName: 'Equity Bank', beneficiaryBank: 'Equity',
    createdAt: '2025-06-24T15:00:00Z', failedAt: '2025-06-24T16:00:00Z',
  },
  {
    id: 'bt-5', reference: 'BIZ-2026-000425', businessAccountId: 'mock-3',
    businessAccount: { companyName: 'Accra Trade Co' },
    status: 'settled', sellCurrency: 'USD', sellAmount: 75000,
    buyCurrency: 'GHS', buyAmount: 1121250, fxRate: 14.95,
    marginPct: 0.75, marginAmount: 562.5,
    beneficiaryName: 'Tema Port Services', beneficiaryBank: 'Ecobank Ghana',
    createdAt: '2025-06-20T10:00:00Z', settledAt: '2025-06-21T09:00:00Z',
  },
];

const mockRevenue: RevenueData = {
  totalVolume: 295000,
  totalMargin: 1787.5,
  transactionCount: 3,
  avgDealSize: 98333.33,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const kybColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const txStatusColor: Record<string, string> = {
  quote: 'bg-gray-100 text-gray-600',
  processing: 'bg-amber-100 text-amber-700',
  settled: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const acctStatusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

function fmtCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Applications Tab ──────────────────────────────────────────────────────

function ApplicationsTab({
  accounts,
  onRefresh,
}: {
  accounts: BusinessAccount[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BusinessAccount | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feeInput, setFeeInput] = useState('1.0');
  const [actionLoading, setActionLoading] = useState(false);

  const pending = accounts.filter((a) => a.kybStatus === 'pending');
  const filtered = pending.filter(
    (a) =>
      search === '' ||
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.countryOfIncorporation.toLowerCase().includes(search.toLowerCase()),
  );

  const openDetail = (acct: BusinessAccount) => {
    setSelected(acct);
    setFeeInput(acct.feePct.toString());
    setSheetOpen(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    const fee = parseFloat(feeInput);
    if (isNaN(fee) || fee < 0 || fee > 10) {
      toast.error('Fee % must be between 0 and 10');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, kybStatus: 'approved', feePct: fee }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to approve');
        return;
      }
      toast.success(`${selected.companyName} approved at ${fee}% fee`);
      setSheetOpen(false);
      onRefresh();
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, kybStatus: 'rejected' }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to reject');
        return;
      }
      toast.success(`${selected.companyName} rejected`);
      setSheetOpen(false);
      onRefresh();
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{pending.length} pending application{pending.length !== 1 ? 's' : ''}</p>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 font-medium text-muted-foreground">Company Name</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Country</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Industry</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Monthly Volume</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((acct) => (
                    <tr
                      key={acct.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openDetail(acct)}
                    >
                      <td className="py-3 font-medium">{acct.companyName}</td>
                      <td className="py-3 text-muted-foreground hidden md:table-cell">{acct.email}</td>
                      <td className="py-3 hidden lg:table-cell">{acct.countryOfIncorporation}</td>
                      <td className="py-3 hidden lg:table-cell">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">{acct.industry}</Badge>
                      </td>
                      <td className="py-3 font-mono text-sm hidden sm:table-cell">{fmtCurrency(acct.monthlyVolumeUsd)}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{fmtDate(acct.createdAt)}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        {search ? 'No applications match your search.' : 'No pending applications.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  {selected.companyName}
                </SheetTitle>
                <SheetDescription>Application details and KYB review</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Information</p>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Reg. Number</span>
                      <span className="font-mono">{selected.companyRegNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Country</span>
                      <span>{selected.countryOfIncorporation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Industry</span>
                      <span>{selected.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Monthly Volume</span>
                      <span className="font-medium">{fmtCurrency(selected.monthlyVolumeUsd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Use Case</span>
                      <span>{selected.useCase}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signatory & Contact</p>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selected.signatoryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                      <span className="font-mono text-xs">{selected.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selected.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Application Status</p>
                  <div className="flex items-center gap-2">
                    <Badge className={kybColor[selected.kybStatus] || ''}>{selected.kybStatus}</Badge>
                    <span className="text-xs text-muted-foreground">Applied {fmtDate(selected.createdAt)}</span>
                  </div>
                </div>

                <Separator />

                {/* Approve with fee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Fee percentage for this account</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="10"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="w-28 font-mono"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (margin: {fmtCurrency(selected.monthlyVolumeUsd * (parseFloat(feeInput) || 0) / 100)}/mo est.)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                  >
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve — set fee at {feeInput}%
                  </Button>

                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      toast.info('Request info email feature coming soon');
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request More Info
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Reject Application
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Accounts Tab ──────────────────────────────────────────────────────────

function AccountsTab({
  accounts,
  txCountMap,
  onRefresh,
}: {
  accounts: BusinessAccount[];
  txCountMap: Record<string, number>;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BusinessAccount | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editFee, setEditFee] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState<'none' | 'fee' | 'limit'>('none');

  const approved = accounts.filter((a) => a.kybStatus === 'approved');
  const filtered = approved.filter(
    (a) =>
      search === '' ||
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openDetail = (acct: BusinessAccount) => {
    setSelected(acct);
    setEditFee(acct.feePct.toString());
    setEditLimit(acct.dailyLimitUsd.toString());
    setEditMode('none');
    setSheetOpen(true);
  };

  const handleSaveFee = async () => {
    if (!selected) return;
    const fee = parseFloat(editFee);
    if (isNaN(fee) || fee < 0 || fee > 10) {
      toast.error('Fee % must be between 0 and 10');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, feePct: fee }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to update fee');
        return;
      }
      toast.success(`Fee updated to ${fee}% for ${selected.companyName}`);
      setEditMode('none');
      onRefresh();
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!selected) return;
    const limit = parseFloat(editLimit);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Daily limit must be a positive number');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, dailyLimitUsd: limit }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to update limit');
        return;
      }
      toast.success(`Daily limit updated to ${fmtCurrency(limit)} for ${selected.companyName}`);
      setEditMode('none');
      onRefresh();
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selected) return;
    const newStatus = selected.accountStatus === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, accountStatus: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Failed to update status');
        return;
      }
      toast.success(`${selected.companyName} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      setSheetOpen(false);
      onRefresh();
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{approved.length} approved account{approved.length !== 1 ? 's' : ''}</p>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 font-medium text-muted-foreground">Company</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="pb-3 font-medium text-muted-foreground">Fee %</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Daily Limit</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Transactions</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((acct) => (
                    <tr
                      key={acct.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openDetail(acct)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{acct.companyName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{acct.email}</td>
                      <td className="py-3 font-mono text-sm">{acct.feePct}%</td>
                      <td className="py-3 font-mono text-sm hidden sm:table-cell">{fmtCurrency(acct.dailyLimitUsd)}</td>
                      <td className="py-3 hidden lg:table-cell">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          {txCountMap[acct.id] || 0}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className={acctStatusColor[acct.accountStatus] || ''}>
                          {acct.accountStatus}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        {search ? 'No accounts match your search.' : 'No approved accounts.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  {selected.companyName}
                </SheetTitle>
                <SheetDescription>Account management</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-4">
                <div className="flex items-center gap-2">
                  <Badge className={kybColor[selected.kybStatus] || ''}>{selected.kybStatus}</Badge>
                  <Badge className={acctStatusColor[selected.accountStatus] || ''}>{selected.accountStatus}</Badge>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Settings</p>

                  {/* Fee % */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      Fee Percentage
                      {editMode !== 'fee' && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => setEditMode('fee')}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </label>
                    {editMode === 'fee' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          max="10"
                          value={editFee}
                          onChange={(e) => setEditFee(e.target.value)}
                          className="w-28 font-mono"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button size="sm" onClick={handleSaveFee} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                          {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditMode('none'); setEditFee(selected.feePct.toString()); }} className="h-8">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="font-mono text-sm">{selected.feePct}%</p>
                    )}
                  </div>

                  <Separator />

                  {/* Daily Limit */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      Daily Limit (USD)
                      {editMode !== 'limit' && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => setEditMode('limit')}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </label>
                    {editMode === 'limit' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-40 font-mono"
                        />
                        <Button size="sm" onClick={handleSaveLimit} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                          {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditMode('none'); setEditLimit(selected.dailyLimitUsd.toString()); }} className="h-8">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="font-mono text-sm">{fmtCurrency(selected.dailyLimitUsd)}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signatory</span>
                      <span className="font-medium">{selected.signatoryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-mono text-xs">{selected.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reg. Number</span>
                      <span className="font-mono text-xs">{selected.companyRegNumber}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className={
                    selected.accountStatus === 'suspended'
                      ? 'w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      : 'w-full border-orange-300 text-orange-700 hover:bg-orange-50'
                  }
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : selected.accountStatus === 'suspended' ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                  {selected.accountStatus === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Transactions Tab ──────────────────────────────────────────────────────

function TransactionsTab({ transactions }: { transactions: BusinessTransaction[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      search === '' ||
      t.reference.toLowerCase().includes(search.toLowerCase()) ||
      t.businessAccount.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'processing', 'settled', 'failed'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              className={statusFilter === s ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 bg-white/20 text-inherit text-xs">
                  {transactions.filter((t) => t.status === s).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reference or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Reference</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Company</th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1">Sell <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1">Buy <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Rate</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-xs text-emerald-600">{t.reference}</td>
                    <td className="py-3 hidden md:table-cell">{t.businessAccount.companyName}</td>
                    <td className="py-3 font-mono text-sm">{fmtCurrency(t.sellAmount, t.sellCurrency)}</td>
                    <td className="py-3 font-mono text-sm">{fmtCurrency(t.buyAmount, t.buyCurrency)}</td>
                    <td className="py-3 font-mono text-xs hidden sm:table-cell">{t.fxRate}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={txStatusColor[t.status] || ''}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Revenue Tab ───────────────────────────────────────────────────────────

function RevenueTab({ revenue, transactions }: { revenue: RevenueData; transactions: BusinessTransaction[] }) {
  const settled = transactions.filter((t) => t.status === 'settled' || t.status === 'completed' || t.status === 'delivered');

  // Per-currency breakdown
  const byCurrency = new Map<string, { volume: number; margin: number; count: number }>();
  for (const t of settled) {
    const key = `${t.sellCurrency} → ${t.buyCurrency}`;
    const existing = byCurrency.get(key) || { volume: 0, margin: 0, count: 0 };
    existing.volume += t.sellAmount;
    existing.margin += t.marginAmount;
    existing.count += 1;
    byCurrency.set(key, existing);
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Volume</p>
                <p className="text-xl font-bold text-gray-900">{fmtCurrency(revenue.totalVolume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Margin</p>
                <p className="text-xl font-bold text-emerald-600">{fmtCurrency(revenue.totalMargin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Transaction Count</p>
                <p className="text-xl font-bold text-gray-900">{revenue.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Average Deal Size</p>
                <p className="text-xl font-bold text-gray-900">{fmtCurrency(revenue.avgDealSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Currency Pair */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Currency Pair</CardTitle>
          <CardDescription>Breakdown of settled business FX transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {byCurrency.size === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No settled transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 font-medium text-muted-foreground">Corridor</th>
                    <th className="pb-3 font-medium text-muted-foreground">Transactions</th>
                    <th className="pb-3 font-medium text-muted-foreground">Volume</th>
                    <th className="pb-3 font-medium text-muted-foreground">Margin</th>
                    <th className="pb-3 font-medium text-muted-foreground">Effective Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(byCurrency.entries()).map(([corridor, data]) => (
                    <tr key={corridor} className="border-b border-border/50 last:border-0">
                      <td className="py-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{corridor}</Badge>
                      </td>
                      <td className="py-3">{data.count}</td>
                      <td className="py-3 font-mono">{fmtCurrency(data.volume)}</td>
                      <td className="py-3 font-mono text-emerald-600 font-medium">{fmtCurrency(data.margin)}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {data.volume > 0 ? ((data.margin / data.volume) * 100).toFixed(2) : '0.00'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function AdminBusinessPage() {
  const [activeTab, setActiveTab] = useState('applications');
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/business');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Use mock data as fallback
        setData({
          accounts: mockAccounts,
          transactions: mockTransactions,
          pendingCount: mockAccounts.filter((a) => a.kybStatus === 'pending').length,
          approvedCount: mockAccounts.filter((a) => a.kybStatus === 'approved').length,
          totalTxCount: mockTransactions.length,
          txCountMap: { 'mock-3': 3, 'mock-4': 2 },
          revenue: mockRevenue,
        });
      }
    } catch {
      // Fallback to mock data
      setData({
        accounts: mockAccounts,
        transactions: mockTransactions,
        pendingCount: mockAccounts.filter((a) => a.kybStatus === 'pending').length,
        approvedCount: mockAccounts.filter((a) => a.kybStatus === 'approved').length,
        totalTxCount: mockTransactions.length,
        txCountMap: { 'mock-3': 3, 'mock-4': 2 },
        revenue: mockRevenue,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingCount = data?.pendingCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="text-muted-foreground">Review applications, manage accounts, and monitor business FX</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={fetchData}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Applications
            {pendingCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <Users className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5">
            <ArrowLeftRight className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {loading && !data ? (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : data ? (
          <>
            <TabsContent value="applications">
              <ApplicationsTab accounts={data.accounts} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="accounts">
              <AccountsTab accounts={data.accounts} txCountMap={data.txCountMap} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="transactions">
              <TransactionsTab transactions={data.transactions} />
            </TabsContent>
            <TabsContent value="revenue">
              <RevenueTab revenue={data.revenue} transactions={data.transactions} />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}