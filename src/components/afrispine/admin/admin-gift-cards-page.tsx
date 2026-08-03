'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  FileText,
  QrCode,
  Store,
  Gift,
  BarChart3,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ImageIcon,
  Upload,
  Link,
  Eye,
  Save,
} from 'lucide-react';
import { LOCAL_LOGO_MAP } from '@/lib/merchants';

/* ── Types ──────────────────────────────────────────────────────── */

interface BrandRow {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string;
  country: string;
  countryCode: string;
  category: string;
  kycStatus: string;
  isVerified: boolean;
  smartContractHash: string | null;
  smartContractAddress: string | null;
  _count: { giftCards: number };
}

interface GiftCardRow {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  purchasedAt: string;
  recipientName: string | null;
  senderId: string | null;
  brand: { id: string; brandName: string; logoUrl: string };
}

interface StatsData {
  totalSold: number;
  totalRedeemed: number;
  totalActive: number;
  totalExpired: number;
  totalRevenue: number;
  recentCards: number;
  topBrands: { brandName: string; totalAmount: number; count: number }[];
}

/* ── Admin Logo Component (checks local SVG → DB logoUrl → initials) ── */

function AdminBrandLogo({ name, logoUrl, slug, size = 'sm' }: { name: string; logoUrl: string; slug?: string; size?: 'sm' | 'md' | 'lg' }) {
  const localPath = slug ? LOCAL_LOGO_MAP[slug] : null;
  const hasDbLogo = !!logoUrl && !logoUrl.includes('clearbit.com');
  const [source, setSource] = useState<'local' | 'db' | 'fallback'>(() => {
    if (localPath) return 'local';
    if (hasDbLogo) return 'db';
    return 'fallback';
  });

  const sizes: Record<string, string> = {
    sm: 'h-10 w-10 rounded-xl',
    md: 'h-14 w-14 rounded-xl',
    lg: 'h-20 w-20 rounded-2xl',
  };

  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleImgError = () => {
    if (source === 'local' && hasDbLogo) {
      setSource('db');
    } else {
      setSource('fallback');
    }
  };

  const imgSrc = source === 'local' ? localPath! : logoUrl;

  if (source === 'fallback') {
    return (
      <div className={`${sizes[size]} bg-emerald-600 flex items-center justify-center text-white font-bold ${size === 'lg' ? 'text-xl' : 'text-xs'} shrink-0`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} shrink-0 bg-gray-50 border border-gray-100 p-1`}>
      <img src={imgSrc} alt={name} className="h-full w-full object-contain" onError={handleImgError} />
    </div>
  );
}

/* ── KYC Status Badge ──────────────────────────────────────────── */

function KycBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-800' },
    verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  };
  const c = config[status] || config.pending;
  return <Badge className={`${c.color} border-0`}>{c.label}</Badge>;
}

/* ── Has Real Logo Helper ──────────────────────────────────────── */

function hasRealLogo(brand: BrandRow): boolean {
  if (brand.slug && LOCAL_LOGO_MAP[brand.slug]) return true;
  if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com')) return true;
  return false;
}

/* ── Main Component ────────────────────────────────────────────── */

export default function AdminGiftCardsPage() {
  const [activeTab, setActiveTab] = useState('brands');
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCardRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; brand: BrandRow | null; action: 'verify' | 'reject' }>({ open: false, brand: null, action: 'verify' });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [contractDialog, setContractDialog] = useState<{ open: boolean; contract: any | null }>({ open: false, contract: null });

  /* ── Logo Upload State ── */
  const [logoDialog, setLogoDialog] = useState<{ open: boolean; brand: BrandRow | null }>({ open: false, brand: null });
  const [logoTab, setLogoTab] = useState<'url' | 'device'>('url');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gift-cards/brands');
      const data = await res.json();
      setBrands(data.brands ?? []);
    } catch { setBrands([]); }
  }, []);

  const fetchGiftCards = useCallback(async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/admin/gift-cards${params}`);
      const data = await res.json();
      setGiftCards(data.giftCards ?? []);
    } catch { setGiftCards([]); }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gift-cards/stats');
      const data = await res.json();
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBrands(), fetchGiftCards(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchBrands, fetchGiftCards, fetchStats]);

  // Filter brands
  const filteredBrands = useMemo(() => {
    if (!searchQuery) return brands;
    return brands.filter(b =>
      b.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brands, searchQuery]);

  // Filter gift cards
  const filteredGiftCards = useMemo(() => {
    if (!searchQuery) return giftCards;
    return giftCards.filter(c =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [giftCards, searchQuery]);

  const handleVerify = async () => {
    if (!verifyDialog.brand) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-cards/brands/${verifyDialog.brand.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: verifyDialog.action, reason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setVerifyDialog({ open: false, brand: null, action: 'verify' });
      setReason('');
      fetchBrands();
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  const handleContract = async (brand: BrandRow) => {
    try {
      const res = await fetch(`/api/admin/gift-cards/brands/${brand.id}/contract`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setContractDialog({ open: true, contract: data.contract });
      toast.success('Smart contract generated');
      fetchBrands();
    } catch { toast.error('Contract generation failed'); }
  };

  /* ── Logo Upload Handlers ── */

  const openLogoDialog = (brand: BrandRow) => {
    setLogoDialog({ open: true, brand });
    setLogoTab('url');
    setLogoUrlInput('');
    setLogoPreview(null);
    setLogoFile(null);
    /* If brand already has a DB logo (not clearbit), show it as preview */
    if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com') && !brand.logoUrl.startsWith('data:')) {
      setLogoUrlInput(brand.logoUrl);
      setLogoPreview(brand.logoUrl);
    }
  };

  const handleUrlPreview = () => {
    const url = logoUrlInput.trim();
    if (!url) { setLogoPreview(null); return; }
    try {
      new URL(url);
      setLogoPreview(url);
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, WebP, SVG, GIF');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB.');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoDialog.brand) return;

    if (logoTab === 'url') {
      const url = logoUrlInput.trim();
      if (!url) { toast.error('Please enter a logo URL'); return; }
      try { new URL(url); } catch { toast.error('Invalid URL'); return; }

      setLogoSaving(true);
      try {
        const res = await fetch(`/api/admin/gift-cards/brands/${logoDialog.brand.id}/logo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: url }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success(`Logo updated for ${logoDialog.brand.brandName}`);
        setLogoDialog({ open: false, brand: null });
        fetchBrands();
      } catch { toast.error('Failed to update logo'); }
      finally { setLogoSaving(false); }
    } else {
      /* Device upload */
      if (!logoFile) { toast.error('Please select a file'); return; }

      setLogoSaving(true);
      try {
        const formData = new FormData();
        formData.append('file', logoFile);
        const res = await fetch(`/api/admin/gift-cards/brands/${logoDialog.brand.id}/logo`, {
          method: 'PUT',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success(`Logo uploaded for ${logoDialog.brand.brandName}`);
        setLogoDialog({ open: false, brand: null });
        fetchBrands();
      } catch { toast.error('Failed to upload logo'); }
      finally { setLogoSaving(false); }
    }
  };

  /* Count brands missing logos */
  const brandsWithoutLogo = useMemo(() => brands.filter(b => !hasRealLogo(b)).length, [brands]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-emerald-600" />
            Gift Card Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage brands, gift cards, and smart contracts
            {brandsWithoutLogo > 0 && (
              <span className="inline-flex items-center gap-1 ml-2 text-amber-600 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {brandsWithoutLogo} brand{brandsWithoutLogo > 1 ? 's' : ''} missing logo
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); Promise.all([fetchBrands(), fetchGiftCards(), fetchStats()]).finally(() => setLoading(false)); }}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSearchQuery(''); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands" className="flex items-center gap-1.5">
            <Store className="h-4 w-4" /> Brands
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-1.5">
            <QrCode className="h-4 w-4" /> Gift Cards
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> Statistics
          </TabsTrigger>
        </TabsList>

        {/* ═══ Brands Tab ═══ */}
        <TabsContent value="brands" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search brands..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredBrands.map(brand => (
                <div key={brand.id} className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
                  {/* Logo with click-to-update */}
                  <button
                    className="relative group shrink-0"
                    onClick={() => openLogoDialog(brand)}
                    title="Click to update logo"
                  >
                    <AdminBrandLogo name={brand.brandName} logoUrl={brand.logoUrl} slug={brand.slug} size="md" />
                    {!hasRealLogo(brand) && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                        <ImageIcon className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ImageIcon className="h-4 w-4 text-white drop-shadow" />
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{brand.brandName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{brand.country}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{brand.category}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{brand._count.giftCards} cards</span>
                    </div>
                  </div>
                  <KycBadge status={brand.kycStatus} />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50 h-8 px-2 text-xs"
                      onClick={() => openLogoDialog(brand)}>
                      <ImageIcon className="h-3.5 w-3.5 mr-1" /> Logo
                    </Button>
                    {brand.kycStatus !== 'verified' && (
                      <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8 px-2 text-xs"
                        onClick={() => setVerifyDialog({ open: true, brand, action: 'verify' })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                      </Button>
                    )}
                    {brand.kycStatus !== 'rejected' && brand.kycStatus !== 'pending' && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2 text-xs"
                        onClick={() => setVerifyDialog({ open: true, brand, action: 'reject' })}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {brand.kycStatus === 'verified' && (
                      <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50 h-8 px-2 text-xs"
                        onClick={() => handleContract(brand)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Contract
                      </Button>
                    )}
                    {brand.isVerified && brand.smartContractHash && (
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center" title="Has smart contract">
                        <Shield className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredBrands.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No brands found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ Gift Cards Tab ═══ */}
        <TabsContent value="cards" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by code or brand..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredGiftCards.map(card => {
                const statusColor: Record<string, string> = {
                  active: 'bg-emerald-100 text-emerald-800', redeemed: 'bg-gray-100 text-gray-600',
                  expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
                };
                return (
                  <div key={card.id} className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
                    <AdminBrandLogo name={card.brand.brandName} logoUrl={card.brand.logoUrl} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-bold text-gray-900">{card.code}</code>
                        <Badge className={`${statusColor[card.status] || ''} border-0 text-[10px]`}>{card.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{card.brand.brandName}</span>
                        <span>·</span>
                        <span>{card.amount.toLocaleString()} {card.currency}</span>
                        {card.recipientName && <><span>·</span><span>To: {card.recipientName}</span></>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(card.purchasedAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
              {filteredGiftCards.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No gift cards found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ Statistics Tab ═══ */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          {loading || !stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Total Sold</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSold}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalActive}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Redeemed</p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">{stats.totalRedeemed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Top Brands by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topBrands.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topBrands.map((brand, idx) => {
                        const maxAmount = stats.topBrands[0]?.totalAmount || 1;
                        const pct = (brand.totalAmount / maxAmount) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{brand.brandName}</span>
                              <span className="text-gray-500">{brand.count} cards · ${brand.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Last 30 Days</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recentCards}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 font-medium">Expired</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalExpired}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Verify/Reject Dialog ═══ */}
      <Dialog open={verifyDialog.open} onOpenChange={open => setVerifyDialog({ ...verifyDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {verifyDialog.action === 'verify' ? (
                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Verify Brand</>
              ) : (
                <><XCircle className="h-5 w-5 text-red-600" /> Reject Brand</>
              )}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog.action === 'verify'
                ? `Verify ${verifyDialog.brand?.brandName} and enable gift card issuance? A smart contract address will be generated.`
                : `Reject ${verifyDialog.brand?.brandName}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {verifyDialog.action === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Reason for rejection</label>
                <Input placeholder="e.g. Incomplete KYC documents" value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVerifyDialog({ open: false, brand: null, action: 'verify' })}>Cancel</Button>
              <Button
                onClick={handleVerify}
                disabled={actionLoading || (verifyDialog.action === 'reject' && !reason.trim())}
                className={verifyDialog.action === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  verifyDialog.action === 'verify' ? 'Verify & Enable' : 'Reject'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Smart Contract Dialog ═══ */}
      <Dialog open={contractDialog.open} onOpenChange={open => setContractDialog({ ...contractDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" /> Smart Contract Generated
            </DialogTitle>
            <DialogDescription>The smart contract has been hashed and stored on-chain.</DialogDescription>
          </DialogHeader>

          {contractDialog.contract && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-700 max-h-60 overflow-y-auto whitespace-pre-wrap border">
                {JSON.stringify(contractDialog.contract, null, 2)}
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg p-3">
                <Shield className="h-4 w-4 shrink-0" />
                <span className="font-medium">Contract Hash:</span>
                <span className="font-mono truncate">{contractDialog.contract.contractHash}</span>
              </div>
              <Button onClick={() => setContractDialog({ open: false, contract: null })} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Logo Upload Dialog ═══ */}
      <Dialog open={logoDialog.open} onOpenChange={open => { setLogoDialog({ ...logoDialog, open }); if (!open) { setLogoPreview(null); setLogoFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Update Logo
            </DialogTitle>
            <DialogDescription>
              Update the logo for <span className="font-semibold text-gray-900">{logoDialog.brand?.brandName}</span>. Upload from a URL or your device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Current logo */}
            {logoDialog.brand && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <AdminBrandLogo name={logoDialog.brand.brandName} logoUrl={logoDialog.brand.logoUrl} slug={logoDialog.brand.slug} size="sm" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Current Logo</p>
                  <p className="text-xs text-gray-500">
                    {hasRealLogo(logoDialog.brand) ? 'Has logo' : 'No logo (showing initials)'}
                  </p>
                </div>
              </div>
            )}

            {/* Upload method tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => { setLogoTab('url'); setLogoPreview(null); setLogoFile(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${logoTab === 'url' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Link className="h-4 w-4" />
                From URL
              </button>
              <button
                onClick={() => { setLogoTab('device'); setLogoPreview(null); setLogoFile(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${logoTab === 'device' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Upload className="h-4 w-4" />
                From Device
              </button>
            </div>

            {/* URL upload */}
            {logoTab === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={logoUrlInput}
                    onChange={e => setLogoUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlPreview()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleUrlPreview}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Paste a direct link to the brand logo image</p>
              </div>
            )}

            {/* Device upload */}
            {logoTab === 'device' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    {logoFile ? logoFile.name : 'Click to select a file'}
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WebP, SVG, or GIF (max 2MB)</p>
                </button>
              </div>
            )}

            {/* Preview */}
            {logoPreview && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</p>
                <div className="flex items-center justify-center p-6 bg-white border rounded-xl">
                  <div className="h-20 w-20 bg-gray-50 rounded-xl border border-gray-100 p-2">
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setLogoDialog({ open: false, brand: null })}>Cancel</Button>
              <Button
                onClick={handleSaveLogo}
                disabled={logoSaving || (logoTab === 'url' ? !logoUrlInput.trim() : !logoFile)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {logoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save Logo</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}