'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type MerchantStatus = 'active' | 'disabled' | 'deleted';

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

// ─── Component ───────────────────────────────────────────────────

export function AdminGiftProvidersPage() {
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
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gift Providers</h1>
          <p className="text-gray-400">Manage merchants across all markets — enable, disable, or delete</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={fetchMerchants}
          disabled={loading}
        >
          <RefreshCw className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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
    </div>
  );
}
