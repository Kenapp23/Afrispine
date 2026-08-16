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
  Clock,
  DollarSign,
  Rocket,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────── */

interface PricingRow {
  slotType: string;
  label: string;
  priceKes: string;
  impressionsIncluded: string;
}

const SLOT_DEFAULTS: PricingRow[] = [
  { slotType: 'backdrop_banner', label: 'Backdrop Banner', priceKes: '', impressionsIncluded: '10000' },
  { slotType: 'smart_chyron', label: 'Smart Chyron', priceKes: '', impressionsIncluded: '10000' },
  { slotType: 'intro_splash', label: 'Intro Splash', priceKes: '', impressionsIncluded: '10000' },
  { slotType: 'feed_native_card', label: 'Feed Native Card', priceKes: '', impressionsIncluded: '10000' },
];

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

  /* ── Pricing state ── */
  const [pricingRows, setPricingRows] = useState<PricingRow[]>(SLOT_DEFAULTS);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);

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

  /* ── Fetch pricing on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/sponsor-pricing');
        if (res.ok) {
          const data = await res.json();
          const existing = (data.pricings || []) as Array<{
            slotType: string;
            label: string;
            priceKes: number;
            impressionsIncluded: number;
          }>;
          if (existing.length > 0) {
            setPricingRows(
              SLOT_DEFAULTS.map((def) => {
                const found = existing.find((e) => e.slotType === def.slotType);
                if (found) {
                  return {
                    slotType: found.slotType,
                    label: found.label,
                    priceKes: String(found.priceKes),
                    impressionsIncluded: String(found.impressionsIncluded),
                  };
                }
                return { ...def };
              }),
            );
          }
        }
      } catch {
        // silently ignore — defaults remain
      } finally {
        setPricingLoaded(true);
      }
    })();
  }, []);

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

  /* ── Save pricing ── */
  const handleSavePricing = async () => {
    setPricingSaving(true);
    try {
      const payload = pricingRows.map((r) => ({
        slotType: r.slotType,
        label: r.label,
        priceKes: parseFloat(r.priceKes) || 0,
        impressionsIncluded: parseInt(r.impressionsIncluded, 10) || 10000,
      }));

      const res = await fetch('/api/admin/sponsor-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricings: payload }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save pricing.');
      }

      toast.success('Pricing updated successfully.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save pricing.');
    } finally {
      setPricingSaving(false);
    }
  };

  const updatePricingField = (index: number, field: keyof PricingRow, value: string) => {
    setPricingRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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

  /* ── Campaigns review state ── */
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [approvingCampaignId, setApprovingCampaignId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch('/api/sponsor/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch { /* ignore */ }
    finally { setCampaignsLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleApproveCampaign = async (campaignId: string) => {
    setApprovingCampaignId(campaignId);
    try {
      const res = await fetch(`/api/sponsor/campaigns/${campaignId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve campaign.');
      }
      const data = await res.json();
      toast.success(`STK Push sent! Total: KES ${data.totalCost?.toLocaleString()}`);
      fetchCampaigns();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve campaign.');
    } finally {
      setApprovingCampaignId(null);
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    setApprovingCampaignId(campaignId);
    try {
      const res = await fetch(`/api/sponsor/campaigns/${campaignId}/reject`, { method: 'POST' });
      if (res.ok) { toast.success('Campaign rejected.'); fetchCampaigns(); }
    } catch { toast.error('Failed to reject campaign.'); }
    finally { setApprovingCampaignId(null); }
  };

  const pendingCampaigns = campaigns.filter(c => c.status === 'pending_review');

  function getCampaignStatusBadge(status: string, paymentStatus?: string) {
    if (status === 'active') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">Live</Badge>;
    if (status === 'awaiting_payment') return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs font-semibold">Awaiting Payment</Badge>;
    if (status === 'pending_review') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-semibold">Under Review</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-semibold">Rejected</Badge>;
    if (status === 'completed') return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs font-semibold">Completed</Badge>;
    if (status === 'paused') return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs font-semibold">Paused</Badge>;
    if (paymentStatus === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-semibold">Payment Failed</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs font-semibold">{status}</Badge>;
  }

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

      {/* Ad Slot Pricing */}
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-gray-900">Ad Slot Pricing</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={handleSavePricing}
              disabled={pricingSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 text-xs font-semibold"
            >
              {pricingSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save Pricing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!pricingLoaded ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Slot Type</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Price (KES)</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Impressions Included</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRows.map((row, idx) => (
                    <TableRow key={row.slotType} className="border-b border-gray-50">
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{row.label}</span>
                        <br />
                        <span className="text-xs text-gray-400 font-mono">{row.slotType}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 font-medium">KES</span>
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            value={row.priceKes}
                            onChange={(e) => updatePricingField(idx, 'priceKes', e.target.value)}
                            className="h-9 w-36 text-sm"
                            placeholder="0"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={row.impressionsIncluded}
                          onChange={(e) => updatePricingField(idx, 'impressionsIncluded', e.target.value)}
                          className="h-9 w-36 text-sm"
                          placeholder="10000"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* ── Campaign Review Queue ── */}
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Campaign Review</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Approve campaigns to trigger M-Pesa payment</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-semibold text-xs">
              {pendingCampaigns.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {campaignsLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-10">
              <Rocket className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No campaigns submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {campaigns.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-4 space-y-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{c.brand?.companyName || 'Unknown Brand'}</p>
                    </div>
                    {getCampaignStatusBadge(c.status, c.paymentStatus)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Objective</p>
                      <p className="text-xs font-bold text-gray-700 capitalize">{c.objective?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Slots</p>
                      <p className="text-xs font-bold text-gray-700">{c.slots?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Cost</p>
                      <p className="text-xs font-bold text-emerald-600">KES {c.totalCost?.toLocaleString() || c.budgetKes?.toLocaleString() || '—'}</p>
                    </div>
                  </div>
                  {c.status === 'pending_review' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleApproveCampaign(c.id)}
                        disabled={approvingCampaignId === c.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs font-semibold"
                      >
                        {approvingCampaignId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                        Approve & Send STK
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectCampaign(c.id)}
                        disabled={approvingCampaignId === c.id}
                        className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-3 text-xs font-semibold"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {c.status === 'awaiting_payment' && (
                    <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Waiting for M-Pesa payment from {c.paymentPhone || 'brand'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
