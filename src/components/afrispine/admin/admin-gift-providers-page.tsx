'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Store,
  Power,
  PowerOff,
  AlertTriangle,
  RefreshCw,
  ImageIcon,
  Globe,
  Check,
  Upload,
  FileText,
  ArrowRight,
  ImageOff,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type MerchantStatus = 'active' | 'disabled' | 'deleted';

type LogoFilter = 'all' | 'missing-logo' | 'missing-domain';

interface MerchantRow {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  category: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
  status: MerchantStatus;
}

interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

interface BrandForLogo {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string;
  website: string | null;
  countryCode: string;
  category: string;
  isActive: boolean;
}

// ─── Status badge styles (dark theme) ─────────────────────────────

const STATUS_STYLES: Record<MerchantStatus, string> = {
  active: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  disabled: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  deleted: 'bg-red-900/60 text-red-300 border border-red-700/50',
};

// ─── Country flag helper ─────────────────────────────────────────

function getCountryFlag(code: string, countries: CountryInfo[]): string {
  return countries.find((c) => c.code === code)?.flag ?? '';
}

// ─── Tiny logo component ─────────────────────────────────────────

function TinyLogo({ src, name }: { src: string; name: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-gray-400 text-xs font-bold">
        {name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-8 w-8 rounded-lg object-contain bg-white/10"
      onError={() => setErrored(true)}
    />
  );
}

// ─── Clearbit logo preview component ─────────────────────────────

function ClearbitPreview({ domain }: { domain: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!cleanDomain) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-700/60 border border-dashed border-gray-600">
        <ImageOff className="h-4 w-4 text-gray-500" />
      </div>
    );
  }

  const url = `https://logo.clearbit.com/${cleanDomain}`;

  return (
    <div className="relative h-12 w-12 shrink-0">
      {!loaded && !errored && (
        <div className="absolute inset-0 rounded-lg bg-gray-700/60 border border-dashed border-gray-600 animate-pulse" />
      )}
      {errored ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700/60 border border-dashed border-gray-600">
          <ImageOff className="h-4 w-4 text-gray-500" />
        </div>
      ) : (
        <img
          src={url}
          alt={`Logo for ${cleanDomain}`}
          className="h-12 w-12 rounded-lg object-contain bg-white p-0.5"
          style={{ display: loaded ? 'block' : 'none' }}
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(false); }}
        />
      )}
    </div>
  );
}

// ─── Logo status indicator ───────────────────────────────────────

function LogoStatus({ logoUrl }: { logoUrl: string }) {
  const hasRealLogo = logoUrl && logoUrl !== '' && !logoUrl.includes('placeholder');
  if (hasRealLogo) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  return <XCircle className="h-4 w-4 text-red-400" />;
}

// ─── Component ───────────────────────────────────────────────────

export function AdminGiftProvidersPage() {
  const [activeTab, setActiveTab] = useState('merchants');

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gift Providers</h1>
          <p className="text-gray-400">Manage merchants and brand logos</p>
        </div>
      </div>

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="merchants"
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
          >
            <Store className="size-4 mr-1.5" />
            Merchants
          </TabsTrigger>
          <TabsTrigger
            value="logo-capture"
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
          >
            <ImageIcon className="size-4 mr-1.5" />
            Logo Capture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merchants">
          <MerchantsTab />
        </TabsContent>

        <TabsContent value="logo-capture">
          <LogoCaptureTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Merchants Tab (existing content) ────────────────────────────

function MerchantsTab() {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/merchants');
      if (!res.ok) throw new Error('Failed to fetch merchants');
      const data = await res.json();
      setMerchants(data.merchants ?? []);
      setCountries(data.countries ?? []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // ─── Filtered list ──────────────────────────────────────────────

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      if (countryFilter !== 'all' && m.countryCode !== countryFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.country.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [merchants, searchQuery, countryFilter, statusFilter]);

  // ─── Counts ─────────────────────────────────────────────────────

  const totalCount = merchants.length;
  const activeCount = merchants.filter((m) => m.status === 'active').length;
  const disabledCount = merchants.filter((m) => m.status === 'disabled').length;
  const deletedCount = merchants.filter((m) => m.status === 'deleted').length;

  // ─── Actions ────────────────────────────────────────────────────

  const handleToggle = async (merchantId: string, currentStatus: MerchantStatus) => {
    const action = currentStatus === 'disabled' ? 'enable' : 'disable';
    const merchant = merchants.find((m) => m.id === merchantId);
    setActionLoading(merchantId);
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }
      toast.success(`${merchant?.name} has been ${action === 'enable' ? 'enabled' : 'disabled'}`);
      await fetchMerchants();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (merchantId: string) => {
    const merchant = merchants.find((m) => m.id === merchantId);
    if (!merchant) return;

    setActionLoading(merchantId);
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      toast.error(`${merchant.name} has been deleted`);
      await fetchMerchants();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <>
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-700 text-gray-300">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-lg font-bold text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/50 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Disabled</p>
              <p className="text-lg font-bold text-white">{disabledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-900/50 text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Deleted</p>
              <p className="text-lg font-bold text-white">{deletedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, country, category…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-gray-700 focus:text-white">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-gray-200 focus:bg-gray-700 focus:text-white">
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-gray-700 focus:text-white">All Statuses</SelectItem>
                <SelectItem value="active" className="text-gray-200 focus:bg-gray-700 focus:text-white">Active</SelectItem>
                <SelectItem value="disabled" className="text-gray-200 focus:bg-gray-700 focus:text-white">Disabled</SelectItem>
                <SelectItem value="deleted" className="text-gray-200 focus:bg-gray-700 focus:text-white">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">All Merchants</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filtered.length} of {totalCount} merchants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg bg-gray-700" />
                  <Skeleton className="h-4 w-40 bg-gray-700" />
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-4 w-20 bg-gray-700" />
                  <Skeleton className="h-6 w-20 bg-gray-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 pr-4 font-medium text-gray-400">Merchant</th>
                    <th className="pb-3 pr-4 font-medium text-gray-400">Country</th>
                    <th className="pb-3 pr-4 font-medium text-gray-400">Category</th>
                    <th className="pb-3 pr-4 font-medium text-gray-400">Status</th>
                    <th className="pb-3 font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors ${m.status === 'deleted' ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <TinyLogo src={m.logoUrl} name={m.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-200 whitespace-nowrap">{m.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{m.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                        {getCountryFlag(m.countryCode, countries)} {m.country}
                      </td>
                      <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{m.category}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className={STATUS_STYLES[m.status] || ''}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Enable/Disable button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              m.status === 'disabled'
                                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/40'
                                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-900/40'
                            } ${m.status === 'deleted' ? 'opacity-30 pointer-events-none' : ''}`}
                            onClick={() => handleToggle(m.id, m.status)}
                            disabled={actionLoading === m.id}
                            title={m.status === 'disabled' ? 'Enable' : 'Disable'}
                          >
                            {m.status === 'disabled' ? (
                              <Power className="h-4 w-4" />
                            ) : (
                              <PowerOff className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 ${
                              m.status === 'deleted' ? 'opacity-30 pointer-events-none' : ''
                            }`}
                            onClick={() => handleDelete(m.id)}
                            disabled={actionLoading === m.id}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        No merchants match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Logo Capture Tab ────────────────────────────────────────────

function LogoCaptureTab() {
  const [brands, setBrands] = useState<BrandForLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [domainOverrides, setDomainOverrides] = useState<Record<string, string>>({});
  const [logoFilter, setLogoFilter] = useState<LogoFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gift-cards/brands/logo-capture');
      if (!res.ok) throw new Error('Failed to fetch brands');
      const data = await res.json();
      setBrands(data.brands ?? []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load brands for logo capture');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // ─── Filtered list ──────────────────────────────────────────────

  const filtered = useMemo(() => {
    return brands.filter((b) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!b.brandName.toLowerCase().includes(q) && !b.countryCode.toLowerCase().includes(q)) {
          return false;
        }
      }
      // Category filter
      if (logoFilter === 'missing-logo') {
        const hasRealLogo = b.logoUrl && b.logoUrl !== '' && !b.logoUrl.includes('placeholder');
        if (hasRealLogo) return false;
      }
      if (logoFilter === 'missing-domain') {
        if (b.website && b.website.trim() !== '') return false;
      }
      return true;
    });
  }, [brands, logoFilter, searchQuery]);

  // ─── Counts ─────────────────────────────────────────────────────

  const totalCount = brands.length;
  const missingLogoCount = brands.filter(
    (b) => !b.logoUrl || b.logoUrl === '' || b.logoUrl.includes('placeholder')
  ).length;
  const missingDomainCount = brands.filter(
    (b) => !b.website || b.website.trim() === ''
  ).length;

  // ─── Domain field helper ────────────────────────────────────────

  const getDomain = (brand: BrandForLogo): string => {
    return domainOverrides[brand.id] ?? brand.website ?? '';
  };

  const setDomain = (brandId: string, value: string) => {
    setDomainOverrides((prev) => ({ ...prev, [brandId]: value }));
  };

  // ─── Approve ────────────────────────────────────────────────────

  const handleApprove = async (brand: BrandForLogo) => {
    const domain = getDomain(brand).trim();
    if (!domain) {
      toast.error('Enter a domain first');
      return;
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const clearbitUrl = `https://logo.clearbit.com/${cleanDomain}`;

    setApprovingId(brand.id);
    try {
      const res = await fetch('/api/admin/gift-cards/brands/logo-capture', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: brand.id,
          website: cleanDomain,
          logoUrl: clearbitUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve logo');
      }
      toast.success(`${brand.brandName} logo approved & saved`);
      // Clear the override and refresh
      setDomainOverrides((prev) => {
        const next = { ...prev };
        delete next[brand.id];
        return next;
      });
      await fetchBrands();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve logo');
    } finally {
      setApprovingId(null);
    }
  };

  // ─── Bulk entry ─────────────────────────────────────────────────

  const handleBulkSubmit = () => {
    const lines = bulkText.split('\n').filter((l) => l.trim());
    let matched = 0;
    const newOverrides = { ...domainOverrides };

    for (const line of lines) {
      const parts = line.split('→');
      if (parts.length !== 2) continue;
      const brandName = parts[0].trim().toLowerCase();
      const domain = parts[1].trim();

      const found = brands.find(
        (b) => b.brandName.toLowerCase() === brandName
      );
      if (found) {
        newOverrides[found.id] = domain;
        matched++;
      }
    }

    setDomainOverrides(newOverrides);
    setBulkDialogOpen(false);
    setBulkText('');
    toast.success(`Matched ${matched} brand(s) from bulk entry`);
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-700 text-gray-300">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Brands</p>
              <p className="text-lg font-bold text-white">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/50 text-amber-400">
              <ImageOff className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Missing Logo</p>
              <p className="text-lg font-bold text-white">{missingLogoCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-900/50 text-red-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Missing Domain</p>
              <p className="text-lg font-bold text-white">{missingDomainCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search brand name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600"
              />
            </div>
            <Select value={logoFilter} onValueChange={(v) => setLogoFilter(v as LogoFilter)}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-gray-700 focus:text-white">All</SelectItem>
                <SelectItem value="missing-logo" className="text-gray-200 focus:bg-gray-700 focus:text-white">Missing Logo</SelectItem>
                <SelectItem value="missing-domain" className="text-gray-200 focus:bg-gray-700 focus:text-white">Missing Domain</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setBulkDialogOpen(true)}
            >
              <FileText className="size-4 mr-1.5" />
              Bulk Entry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={fetchBrands}
              disabled={loading}
            >
              <RefreshCw className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo Capture Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Logo Capture</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filtered.length} of {totalCount} brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg bg-gray-700" />
                  <Skeleton className="h-4 w-40 bg-gray-700" />
                  <Skeleton className="h-4 w-16 bg-gray-700" />
                  <Skeleton className="h-8 w-48 bg-gray-700" />
                  <Skeleton className="h-12 w-12 rounded-lg bg-gray-700" />
                  <Skeleton className="h-8 w-20 bg-gray-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 pr-3 font-medium text-gray-400">Logo</th>
                    <th className="pb-3 pr-3 font-medium text-gray-400">Brand</th>
                    <th className="pb-3 pr-3 font-medium text-gray-400">Country</th>
                    <th className="pb-3 pr-3 font-medium text-gray-400">Domain / Website</th>
                    <th className="pb-3 pr-3 font-medium text-gray-400">Clearbit Preview</th>
                    <th className="pb-3 font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((brand) => {
                    const domain = getDomain(brand);
                    return (
                      <tr
                        key={brand.id}
                        className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-1.5">
                            <TinyLogo src={brand.logoUrl} name={brand.brandName} />
                            <LogoStatus logoUrl={brand.logoUrl} />
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-gray-200 whitespace-nowrap">{brand.brandName}</p>
                          <p className="text-xs text-gray-500">{brand.category}</p>
                        </td>
                        <td className="py-3 pr-3 text-gray-300 whitespace-nowrap">
                          {brand.countryCode}
                        </td>
                        <td className="py-3 pr-3">
                          <Input
                            value={domain}
                            onChange={(e) => setDomain(brand.id, e.target.value)}
                            placeholder="e.g. naivas.co.ke"
                            className="h-8 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600 text-sm max-w-[220px]"
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <ClearbitPreview domain={domain} />
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleApprove(brand)}
                            disabled={approvingId === brand.id || !domain.trim()}
                          >
                            {approvingId === brand.id ? (
                              <RefreshCw className="size-3.5 mr-1 animate-spin" />
                            ) : (
                              <Check className="size-3.5 mr-1" />
                            )}
                            Approve
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No brands match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Entry Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Bulk Domain Entry</DialogTitle>
            <DialogDescription className="text-gray-400">
              Paste brand-domain pairs, one per line. Uses the arrow (→) separator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Naivas → naivas.co.ke\nJumia → jumia.co.ke\nSafaricom → safaricom.co.ke`}
              className="min-h-[200px] bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600"
            />
            <p className="text-xs text-gray-500">
              Format: <code className="text-gray-400">Brand Name → domain.com</code>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setBulkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleBulkSubmit}
              disabled={!bulkText.trim()}
            >
              <ArrowRight className="size-4 mr-1.5" />
              Apply {bulkText.split('\n').filter((l) => l.trim()).length} Line(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}