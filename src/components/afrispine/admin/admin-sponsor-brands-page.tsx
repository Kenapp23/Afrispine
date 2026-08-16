'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Mail,
  Calendar,
  Users,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────── */

interface SponsorBrandRow {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  website: string | null;
  kybStatus: string;
  billingPhone: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { campaigns: number };
}

/* ── Helpers ─────────────────────────────────────────────── */

function getKybStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">Verified</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-semibold">Rejected</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-semibold">Pending</Badge>;
    case 'unverified':
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs font-semibold">Unverified</Badge>;
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ── Component ───────────────────────────────────────────── */

export function AdminSponsorBrandsPage() {
  const [brands, setBrands] = useState<SponsorBrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/sponsor/onboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      } else {
        toast.error('Failed to fetch brands.');
      }
    } catch {
      toast.error('Network error — could not fetch brands.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleApprove = async (brandId: string) => {
    setActionLoading(brandId);
    try {
      const res = await fetch(`/api/sponsor/brands/${brandId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve.');
      }
      toast.success('Brand approved successfully.');
      fetchBrands();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve brand.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (brandId: string) => {
    setActionLoading(brandId);
    try {
      const res = await fetch(`/api/sponsor/brands/${brandId}/reject`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reject.');
      }
      toast.success('Brand rejected.');
      fetchBrands();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject brand.');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Stats ── */
  const totalBrands = brands.length;
  const pendingCount = brands.filter((b) => b.kybStatus === 'unverified' || b.kybStatus === 'pending').length;
  const verifiedCount = brands.filter((b) => b.kybStatus === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sponsor Brands</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage brand KYB submissions.</p>
        </div>
        <Button variant="outline" onClick={fetchBrands} className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Brands</p>
              <p className="text-xl font-extrabold text-gray-900">{totalBrands}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Review</p>
              <p className="text-xl font-extrabold text-gray-900">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Verified</p>
              <p className="text-xl font-extrabold text-gray-900">{verifiedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No brands found.</p>
              {search && (
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Company</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Email</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">KYB Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold hidden sm:table-cell">Campaigns</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => {
                    const isPending = brand.kybStatus === 'unverified' || brand.kybStatus === 'pending';
                    return (
                      <TableRow key={brand.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold shrink-0">
                              {brand.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{brand.companyName}</p>
                              {brand.contactName && (
                                <p className="text-xs text-gray-400 truncate">{brand.contactName}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{brand.contactEmail}</span>
                        </TableCell>
                        <TableCell>{getKybStatusBadge(brand.kybStatus)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-gray-600">{brand._count?.campaigns || 0}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-500">{formatDate(brand.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(brand.id)}
                                disabled={actionLoading === brand.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs font-semibold"
                              >
                                {actionLoading === brand.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(brand.id)}
                                disabled={actionLoading === brand.id}
                                className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-3 text-xs font-semibold"
                              >
                                {actionLoading === brand.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                )}
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
