'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';

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

/* ── Logo Component ────────────────────────────────────────────── */

function extractDomain(logoUrl: string): string {
  try {
    const url = new URL(logoUrl);
    if (url.hostname === 'logo.clearbit.com') return url.pathname.replace(/^\/+/, '');
    return url.hostname;
  } catch { return logoUrl.replace(/^https?:\/\//, '').split('/')[0]; }
}

function BrandLogo({ name, logoUrl, size = 'sm' }: { name: string; logoUrl: string; size?: 'sm' | 'md' }) {
  const [currentSourceIdx, setCurrentSourceIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const domain = extractDomain(logoUrl);
  const sources = [logoUrl, `https://cdn.brandfetch.io/${domain}?w=128&h=128&format=png`, `https://www.google.com/s2/favicons?domain=${domain}&sz=128`];
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sz = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';

  if (failed) return <div className={`${sz} bg-emerald-600 flex items-center justify-center text-white font-bold text-xs`}>{initials}</div>;

  return (
    <div className="relative">
      <img key={sources[currentSourceIdx]} src={sources[currentSourceIdx]} alt={name}
        className={`${sz} object-contain`}
        onLoad={() => {}}
        onError={() => { const next = currentSourceIdx + 1; if (next < sources.length) setCurrentSourceIdx(next); else setFailed(true); }}
      />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-emerald-600" />
            Gift Card Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage brands, gift cards, and smart contracts</p>
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
                  <BrandLogo name={brand.brandName} logoUrl={brand.logoUrl} size="md" />
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
                    <BrandLogo name={card.brand.brandName} logoUrl={card.brand.logoUrl} />
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
    </div>
  );
}
