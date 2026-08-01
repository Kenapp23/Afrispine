'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  CheckCircle2,
  Copy,
  QrCode,
  Search,
  Loader2,
  Sparkles,
  Shield,
} from 'lucide-react';
import { MERCH_COUNTRIES } from '@/lib/merchants';

/* ── Types ──────────────────────────────────────────────────────── */

interface GiftCardBrand {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string;
  country: string;
  countryCode: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  smartContractAddress: string | null;
}

interface PurchasedCard {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  qrCodeData: string;
  blockchainTxHash: string | null;
  smartContractRef: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  message: string | null;
  occasion: string | null;
  expiresAt: string | null;
  purchasedAt: string;
  brand: { id: string; brandName: string; logoUrl: string; smartContractAddress: string | null };
}

/* ── Logo Component ────────────────────────────────────────────── */

function extractDomain(logoUrl: string): string {
  try {
    const url = new URL(logoUrl);
    if (url.hostname === 'logo.clearbit.com') return url.pathname.replace(/^\/+/, '');
    return url.hostname;
  } catch {
    return logoUrl.replace(/^https?:\/\//, '').split('/')[0];
  }
}

function buildLogoSources(logoUrl: string): string[] {
  const domain = extractDomain(logoUrl);
  return [
    logoUrl,
    `https://cdn.brandfetch.io/${domain}?w=128&h=128&format=png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
}

const CATEGORY_BG: Record<string, string> = {
  Supermarket: 'bg-emerald-600', Electronics: 'bg-slate-600', Fashion: 'bg-pink-500',
  'Airtime/Telecom': 'bg-orange-500', Travel: 'bg-sky-500', 'Food & Dining': 'bg-rose-600',
  Healthcare: 'bg-teal-600', Entertainment: 'bg-violet-600', 'E-Commerce': 'bg-emerald-600',
  Utilities: 'bg-gray-500', General: 'bg-emerald-600',
};

function BrandLogo({ brand, size = 'md' }: { brand: GiftCardBrand | { brandName: string; logoUrl: string; category?: string }; size?: 'sm' | 'md' | 'lg' }) {
  const [currentSourceIdx, setCurrentSourceIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const sources = useMemo(() => buildLogoSources(brand.logoUrl), [brand.logoUrl]);
  const skeletonSize = { sm: 'h-8 w-8 rounded-lg', md: 'h-12 w-12 rounded-xl', lg: 'h-16 w-16 rounded-2xl' };
  const imgSize = { sm: 'h-8 w-8 rounded-lg object-contain', md: 'h-12 w-12 rounded-xl object-contain', lg: 'h-16 w-16 rounded-2xl object-contain' };

  const initials = brand.brandName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const fallbackBg = CATEGORY_BG[brand.category || 'General'] ?? 'bg-emerald-600';

  if (failed) {
    return <div className={`${skeletonSize[size]} ${fallbackBg} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>{initials}</div>;
  }

  return (
    <div className="relative">
      {loading && <div className={`${skeletonSize[size]} animate-pulse bg-gray-200 absolute inset-0`} />}
      <img key={sources[currentSourceIdx]} src={sources[currentSourceIdx]} alt={brand.brandName} className={imgSize[size]}
        onLoad={() => setLoading(false)}
        onError={() => {
          const next = currentSourceIdx + 1;
          if (next < sources.length) setCurrentSourceIdx(next);
          else { setFailed(true); setLoading(false); }
        }}
      />
    </div>
  );
}

/* ── QR Code Visual Component ──────────────────────────────── */

function VisualQRCode({ code, brandName, size = 160 }: { code: string; brandName: string; size?: number }) {
  const grid = useMemo(() => {
    // Deterministic pattern based on code
    const cells: boolean[][] = [];
    const gridSize = 21;
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash) + code.charCodeAt(i);
      hash = hash & hash;
    }
    const seed = Math.abs(hash);

    for (let r = 0; r < gridSize; r++) {
      cells[r] = [];
      for (let c = 0; c < gridSize; c++) {
        // Finder patterns (top-left, top-right, bottom-left)
        const isTopLeft = r < 7 && c < 7;
        const isTopRight = r < 7 && c >= gridSize - 7;
        const isBottomLeft = r >= gridSize - 7 && c < 7;

        if (isTopLeft || isTopRight || isBottomLeft) {
          const lr = isTopLeft ? r : isTopRight ? r : r - (gridSize - 7);
          const lc = isTopLeft ? c : isTopRight ? c - (gridSize - 7) : c;
          const isEdge = lr === 0 || lr === 6 || lc === 0 || lc === 6;
          const isInner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
          cells[r][c] = isEdge || isInner;
        } else {
          // Pseudo-random based on position + seed
          const val = ((seed * (r * 31 + c * 17 + 7)) + r * c) % 100;
          cells[r][c] = val < 45;
        }
      }
    }
    return cells;
  }, [code]);

  const cellSize = size / 21;

  return (
    <div className="relative inline-block bg-white rounded-xl p-2 shadow-md border border-gray-200" style={{ width: size + 16, height: size + 16 }}>
      <svg width={size} height={size} viewBox="0 0 21 21" className="block">
        {grid.map((row, r) => row.map((cell, c) => (
          <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={cell ? '#111827' : 'transparent'} />
        )))}
        {/* Center clear area for brand initial */}
        <rect x={8} y={8} width={5} height={5} fill="white" />
        <rect x={8.5} y={8.5} width={4} height={4} rx={0.5} fill="#10B981" />
        <text x={10.5} y={11} textAnchor="middle" fontSize={2.5} fill="white" fontWeight="bold" fontFamily="sans-serif">
          {brandName[0]?.toUpperCase() || 'G'}
        </text>
      </svg>
    </div>
  );
}

/* ── Occasions & Currencies ──────────────────────────────────── */

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'christmas', label: 'Christmas', emoji: '🎄' },
  { id: 'new-baby', label: 'New Baby', emoji: '👶' },
  { id: 'new-home', label: 'New Home', emoji: '🏠' },
  { id: 'get-well', label: 'Get Well', emoji: '💪' },
  { id: 'eid', label: 'Eid', emoji: '🙏' },
];

const CURRENCIES = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
];

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

/* ── Main Component ────────────────────────────────────────────── */

export default function GiftsSendPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const sender = useAppStore((s) => s.sender);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<GiftCardBrand | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [occasion, setOccasion] = useState(viewParams.occasion || 'birthday');
  const [message, setMessage] = useState('');
  const [purchasedCard, setPurchasedCard] = useState<PurchasedCard | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedCountry !== 'all' ? `?country=${selectedCountry}` : '';
      const res = await fetch(`/api/gift-cards/brands${params}`);
      const data = await res.json();
      setBrands(data.brands ?? []);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // Seed if empty
  useEffect(() => {
    if (brands.length === 0 && !loading) {
      fetch('/api/gift-cards/seed-brands', { method: 'POST' })
        .then(() => fetchBrands())
        .catch(() => {});
    }
  }, [brands.length, loading]);

  // Pre-select brand if passed in params
  useEffect(() => {
    if (viewParams.brand && brands.length > 0) {
      const found = brands.find(b => b.id === viewParams.brand);
      if (found) setSelectedBrand(found);
    }
  }, [viewParams.brand, brands]);

  const filteredBrands = useMemo(() => {
    if (!searchQuery) return brands;
    return brands.filter(b =>
      b.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brands, searchQuery]);

  const selectedOcc = OCCASIONS.find(o => o.id === occasion);
  const selectedCur = CURRENCIES.find(c => c.code === currency);

  const handlePurchase = async () => {
    if (!selectedBrand || !amount || !currency) {
      toast.error('Please select a brand and enter an amount');
      return;
    }

    if (!sender) {
      toast.error('Please log in to purchase a gift card');
      navigate('login');
      return;
    }

    setPurchasing(true);
    try {
      const res = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          amount: parseFloat(amount),
          currency,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          recipientPhone: recipientPhone || undefined,
          occasion,
          message: message || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Purchase failed');
        return;
      }

      setPurchasedCard(data.giftCard);
      setStep(4);
      toast.success('Gift card purchased successfully!');
    } catch {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const copyCode = () => {
    if (purchasedCard) {
      navigator.clipboard.writeText(purchasedCard.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate('gifts')}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">
            {step === 1 && 'Choose Brand'}
            {step === 2 && 'Card Details'}
            {step === 3 && 'Review & Confirm'}
            {step === 4 && 'Gift Card Ready!'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${s <= step ? 'bg-emerald-500 w-6' : 'bg-gray-200 w-2'}`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* ═══ STEP 1: Select Brand ═══ */}
        {step === 1 && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Country filter */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSelectedCountry('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selectedCountry === 'all' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                All
              </button>
              {MERCH_COUNTRIES.map(c => (
                <button key={c.code} onClick={() => setSelectedCountry(c.code)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selectedCountry === c.code ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  {c.flag} {c.code}
                </button>
              ))}
            </div>

            {/* Brand grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
              {loading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-4 space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-2 w-14 bg-gray-100 animate-pulse rounded" />
                  </div>
                ))
              ) : filteredBrands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => { setSelectedBrand(brand); setCurrency(brand.countryCode === 'KE' ? 'KES' : brand.countryCode === 'NG' ? 'NGN' : brand.countryCode === 'GH' ? 'GHS' : brand.countryCode === 'ZA' ? 'ZAR' : brand.countryCode === 'UG' ? 'UGX' : 'TZS'); setStep(2); }}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:shadow-md hover:border-emerald-300 active:scale-[0.98] ${
                    selectedBrand?.id === brand.id ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-border/60 bg-white'
                  }`}
                >
                  <BrandLogo brand={brand} size="md" />
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{brand.brandName}</p>
                  <p className="text-[10px] text-gray-400">
                    {MERCH_COUNTRIES.find(c => c.code === brand.countryCode)?.flag} {brand.country}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {selectedCur?.symbol || '$'}{brand.minAmount} - {selectedCur?.symbol || '$'}{brand.maxAmount}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ STEP 2: Details ═══ */}
        {step === 2 && selectedBrand && (
          <>
            {/* Selected brand */}
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-white">
              <BrandLogo brand={selectedBrand} size="lg" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{selectedBrand.brandName}</p>
                <p className="text-xs text-gray-500">{selectedBrand.category} · {selectedBrand.country}</p>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200">Verified</Badge>
            </div>

            {/* Amount */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Amount ({selectedCur?.name})</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={selectedBrand.minAmount}
                max={selectedBrand.maxAmount}
                className="text-lg font-mono"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.filter(a => a >= selectedBrand.minAmount && a <= selectedBrand.maxAmount).map(qa => (
                  <button
                    key={qa}
                    onClick={() => setAmount(String(qa))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${amount === String(qa) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {selectedCur?.symbol || '$'}{qa.toLocaleString()}
                  </button>
                ))}
              </div>
              {parseFloat(amount) > 0 && (parseFloat(amount) < selectedBrand.minAmount || parseFloat(amount) > selectedBrand.maxAmount) && (
                <p className="text-xs text-red-500">Amount must be between {selectedCur?.symbol}{selectedBrand.minAmount} and {selectedCur?.symbol}{selectedBrand.maxAmount}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Occasion */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Occasion</Label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setOccasion(o.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${occasion === o.id ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                  >
                    <span>{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Recipient Details</Label>
              <Input placeholder="Recipient name" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              <Input placeholder="Recipient email (optional)" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
              <Input placeholder="Recipient phone (optional)" type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Personal Message (optional)</Label>
              <Textarea
                placeholder="Write something special..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue to Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {/* ═══ STEP 3: Review & Confirm ═══ */}
        {step === 3 && selectedBrand && (
          <>
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
              {/* Card header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <BrandLogo brand={selectedBrand} size="lg" />
                  <div>
                    <p className="font-bold text-lg">{selectedBrand.brandName}</p>
                    <p className="text-emerald-200 text-sm">{selectedOcc?.emoji} {selectedOcc?.label}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-gray-900">
                    {selectedCur?.symbol}{parseFloat(amount || '0').toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{currency}</p>
                </div>

                <div className="h-px bg-border/50" />

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {recipientName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recipient</span>
                      <span className="font-semibold text-gray-900">{recipientName}</span>
                    </div>
                  )}
                  {recipientEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium text-gray-700">{recipientEmail}</span>
                    </div>
                  )}
                  {recipientPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-700">{recipientPhone}</span>
                    </div>
                  )}
                  {message && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                      <p className="text-xs text-amber-700 font-medium mb-1">Message</p>
                      <p className="text-sm text-amber-900 italic">&ldquo;{message}&rdquo;</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires</span>
                    <span className="font-medium text-gray-700">12 months from purchase</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg p-3">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Protected by smart contract escrow with blockchain verification</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold"
                  >
                    {purchasing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        <Sparkles className="mr-1 h-4 w-4" />
                        Purchase Gift Card
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ STEP 4: Success ═══ */}
        {step === 4 && purchasedCard && (
          <>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Gift Card Purchased!</h2>
              <p className="text-sm text-gray-500">Your gift card has been created and is ready to share.</p>
            </div>

            {/* Gift Card Display */}
            <div className="rounded-2xl border bg-white overflow-hidden shadow-lg">
              {/* Card header with gradient */}
              <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <BrandLogo brand={purchasedCard.brand} size="lg" />
                  <div>
                    <p className="font-bold text-lg">{purchasedCard.brand.brandName}</p>
                    <p className="text-emerald-200 text-sm">{OCCASIONS.find(o => o.id === purchasedCard.occasion)?.emoji} {OCCASIONS.find(o => o.id === purchasedCard.occasion)?.label || purchasedCard.occasion}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-gray-900">
                    {CURRENCIES.find(c => c.code === purchasedCard.currency)?.symbol || '$'}{purchasedCard.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{purchasedCard.currency}</p>
                </div>

                <div className="h-px bg-border/50" />

                {/* QR Code */}
                <div className="flex justify-center">
                  <VisualQRCode code={purchasedCard.code} brandName={purchasedCard.brand.brandName} size={160} />
                </div>

                {/* Code */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Gift Card Code</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border">
                    <code className="text-lg font-mono font-bold text-gray-900 tracking-wider">{purchasedCard.code}</code>
                    <button onClick={copyCode} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {purchasedCard.recipientName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">To</span>
                      <span className="font-semibold">{purchasedCard.recipientName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires</span>
                    <span className="font-medium">{purchasedCard.expiresAt ? new Date(purchasedCard.expiresAt).toLocaleDateString() : '12 months'}</span>
                  </div>
                  {purchasedCard.blockchainTxHash && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Shield className="h-3 w-3" /> Blockchain Verified
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 break-all truncate max-h-4">{purchasedCard.blockchainTxHash}</p>
                    </div>
                  )}
                </div>

                {purchasedCard.message && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-xs text-amber-700 font-medium mb-1">Message</p>
                    <p className="text-sm text-amber-900 italic">&ldquo;{purchasedCard.message}&rdquo;</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={copyCode}>
                    <Copy className="mr-1 h-4 w-4" /> Copy Code
                  </Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('gifts')}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
