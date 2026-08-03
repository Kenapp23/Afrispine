'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  Copy,
  Search,
  Loader2,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { MERCH_COUNTRIES, MERCH_CATEGORIES, LOCAL_LOGO_MAP } from '@/lib/merchants';

/* ── Types ──────────────────────────────────────────────────────── */

interface GiftCardBrand {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string;
  country: string;
  countryCode: string;
  category: string;
  description: string | null;
  minAmount: number;
  maxAmount: number;
  smartContractAddress: string | null;
  brandColor: string;
  isActive: boolean;
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

function BrandLogo({ brand, size = 'md' }: { brand: { brandName: string; logoUrl: string; slug?: string; category?: string }; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const localPath = brand.slug ? LOCAL_LOGO_MAP[brand.slug] : null;
  const [useFallback, setUseFallback] = useState(false);

  const sizes: Record<string, { wrap: string; img: string }> = {
    sm: { wrap: 'h-8 w-8 rounded-lg', img: 'h-8 w-8 rounded-lg object-contain' },
    md: { wrap: 'h-12 w-12 rounded-xl', img: 'h-12 w-12 rounded-xl object-contain' },
    lg: { wrap: 'h-16 w-16 rounded-2xl', img: 'h-16 w-16 rounded-2xl object-contain' },
    xl: { wrap: 'h-20 w-20 rounded-2xl', img: 'h-20 w-20 rounded-2xl object-contain' },
  };

  const initials = brand.brandName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const catColors: Record<string, string> = {
    Supermarket: 'bg-emerald-600', Electronics: 'bg-slate-600', Fashion: 'bg-pink-600',
    'Airtime/Telecom': 'bg-orange-500', Travel: 'bg-sky-600', 'Food & Dining': 'bg-rose-600',
    Healthcare: 'bg-teal-600', Entertainment: 'bg-violet-600', 'E-Commerce': 'bg-emerald-600',
    Utilities: 'bg-gray-500', General: 'bg-emerald-600',
  };
  const fallbackBg = catColors[brand.category || 'General'] ?? 'bg-emerald-600';

  if (useFallback || !localPath) {
    return (
      <div className={sizes[size].wrap + ' ' + fallbackBg + ' flex items-center justify-center text-white font-bold shadow-sm shrink-0'}>
        <span className={size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-lg' : 'text-xs'}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={sizes[size].img + ' shrink-0'}>
      <img src={localPath} alt={brand.brandName} className="h-full w-full object-contain" onError={() => setUseFallback(true)} />
    </div>
  );
}

/* ── QR Code Visual Component ──────────────────────────────── */

function VisualQRCode({ code, brandName, size = 160 }: { code: string; brandName: string; size?: number }) {
  const grid = useMemo(() => {
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
          const val = ((seed * (r * 31 + c * 17 + 7)) + r * c) % 100;
          cells[r][c] = val < 45;
        }
      }
    }
    return cells;
  }, [code]);

  return (
    <div className="relative inline-block bg-white rounded-xl p-2 shadow-md border border-gray-200" style={{ width: size + 16, height: size + 16 }}>
      <svg width={size} height={size} viewBox="0 0 21 21" className="block">
        {grid.map((row, r) => row.map((cell, c) => (
          <rect key={r + '-' + c} x={c} y={r} width={1} height={1} fill={cell ? '#111827' : 'transparent'} />
        )))}
        <rect x={8} y={8} width={5} height={5} fill="white" />
        <rect x={8.5} y={8.5} width={4} height={4} rx={0.5} fill="#10B981" />
        <text x={10.5} y={11} textAnchor="middle" fontSize={2.5} fill="white" fontWeight="bold" fontFamily="sans-serif">
          {brandName[0]?.toUpperCase() || 'G'}
        </text>
      </svg>
    </div>
  );
}

/* ── Real-time Card Preview ─────────────────────────────────── */

function CardPreview({ brand, amount, currency, recipientName, symbol }: {
  brand: GiftCardBrand;
  amount: string;
  currency: string;
  recipientName: string;
  symbol: string;
}) {
  const displayAmount = parseFloat(amount || '0');
  const color = brand.brandColor || '#059669';

  return (
    <div className="w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {/* Top accent bar */}
      <div className="h-2" style={{ backgroundColor: color }} />
      {/* Card body */}
      <div className="bg-white px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-6">
          <BrandLogo brand={brand} size="lg" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Gift Card</span>
        </div>
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-0.5">Amount</p>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {symbol}{displayAmount > 0 ? displayAmount.toLocaleString() : '---'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{currency}</p>
        </div>
        <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">To</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {recipientName || 'Recipient name'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Brand</p>
            <p className="text-sm text-gray-600">{brand.brandName}</p>
          </div>
        </div>
      </div>
      {/* Bottom bar */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: color + '0D' }}>
        <span className="text-[10px] font-medium" style={{ color: color }}>AfriSpine</span>
        <Shield className="h-3.5 w-3.5" style={{ color: color }} />
      </div>
    </div>
  );
}

/* ── Occasions & Currencies ──────────────────────────────────── */

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', emoji: '\u{1F382}' },
  { id: 'wedding', label: 'Wedding', emoji: '\u{1F492}' },
  { id: 'graduation', label: 'Graduation', emoji: '\u{1F393}' },
  { id: 'christmas', label: 'Christmas', emoji: '\u{1F384}' },
  { id: 'new-baby', label: 'New Baby', emoji: '\u{1F476}' },
  { id: 'new-home', label: 'New Home', emoji: '\u{1F3E0}' },
  { id: 'get-well', label: 'Get Well', emoji: '\u{1F4AA}' },
  { id: 'eid', label: 'Eid', emoji: '\u{1F64F}' },
];

const CURRENCIES = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '\u20A6', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH\u20B5', name: 'Ghanaian Cedi' },
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
  const [selectedCategory, setSelectedCategory] = useState('all');
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
      const params = selectedCountry !== 'all' ? '?country=' + selectedCountry : '';
      const res = await fetch('/api/gift-cards/brands' + params);
      const data = await res.json();
      setBrands(data.brands ?? []);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // Pre-select brand if passed in params
  useEffect(() => {
    if (viewParams.brand && brands.length > 0) {
      const found = brands.find(b => b.id === viewParams.brand);
      if (found && found.isActive) setSelectedBrand(found);
    }
  }, [viewParams.brand, brands]);

  // Filtered & counted brands
  const filteredBrands = useMemo(() => {
    let result = brands;
    if (selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.brandName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [brands, selectedCategory, searchQuery]);

  const availableCount = filteredBrands.filter(b => b.isActive).length;
  const comingSoonCount = filteredBrands.filter(b => !b.isActive).length;

  // Category counts for chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of brands) {
      counts[b.category] = (counts[b.category] || 0) + 1;
    }
    return counts;
  }, [brands]);

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
      if (!res.ok) { toast.error(data.error || 'Purchase failed'); return; }
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

  const handleBrandClick = (brand: GiftCardBrand) => {
    if (!brand.isActive) {
      toast('This brand is being activated — check back shortly', {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
      });
      return;
    }
    setSelectedBrand(brand);
    setCurrency(
      brand.countryCode === 'KE' ? 'KES' :
      brand.countryCode === 'NG' ? 'NGN' :
      brand.countryCode === 'GH' ? 'GHS' :
      brand.countryCode === 'ZA' ? 'ZAR' :
      brand.countryCode === 'UG' ? 'UGX' : 'TZS'
    );
    setStep(2);
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
            <div key={s} className={'h-2 rounded-full transition-all ' + (s <= step ? 'bg-emerald-500 w-6' : 'bg-gray-200 w-2')} />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5 space-y-5">
        {/* STEP 1: Brand Picker Grid */}
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

            {/* Country filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCountry('all')}
                className={'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' + (selectedCountry === 'all' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
              >
                All
              </button>
              {MERCH_COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' + (selectedCountry === c.code ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
                >
                  {c.flag} {c.code}
                </button>
              ))}
            </div>

            {/* Category filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ' + (selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                All Categories
              </button>
              {MERCH_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ' + (selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                >
                  {cat}{' '}
                  <span className="opacity-60">({categoryCounts[cat] || 0})</span>
                </button>
              ))}
            </div>

            {/* Live count */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{availableCount} brand{availableCount !== 1 ? 's' : ''} available</span>
              {comingSoonCount > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-amber-600 font-medium">{comingSoonCount} coming soon</span>
                </>
              )}
            </div>

            {/* Dense brand grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-white p-3 flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="h-2.5 w-16 bg-gray-100 animate-pulse rounded" />
                  </div>
                ))
              ) : filteredBrands.map(brand => {
                const inactive = !brand.isActive;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandClick(brand)}
                    className={'relative rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all active:scale-[0.97] ' +
                      (inactive
                        ? 'opacity-50 border-gray-100 bg-white cursor-default'
                        : 'hover:shadow-md hover:border-emerald-300 border-border/60 bg-white'
                      )
                    }
                  >
                    {/* Coming soon badge */}
                    {inactive && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                        Soon
                      </span>
                    )}
                    <BrandLogo brand={brand} size="lg" />
                    <p className="text-[11px] font-semibold text-gray-800 line-clamp-1 text-center leading-tight">
                      {brand.brandName}
                    </p>
                    <p className="text-[9px] text-gray-400 leading-tight">
                      {MERCH_COUNTRIES.find(c => c.code === brand.countryCode)?.flag} {brand.countryCode}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredBrands.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No brands match your filters.</p>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Card Details + Live Preview */}
        {step === 2 && selectedBrand && (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Selected brand */}
              <div className="flex items-center gap-3 p-4 rounded-xl border bg-white">
                <BrandLogo brand={selectedBrand} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{selectedBrand.brandName}</p>
                  <p className="text-xs text-gray-500">{selectedBrand.category} {'\u00B7'} {selectedBrand.country}</p>
                </div>
                <Badge variant="outline" className="text-emerald-700 border-emerald-200 shrink-0">Verified</Badge>
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
                      className={'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' + (amount === String(qa) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                    >
                      {selectedCur?.symbol}{qa.toLocaleString()}
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
                      <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} {'\u2014'} {c.name}</SelectItem>
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
                      className={'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ' + (occasion === o.id ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
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
            </div>

            {/* Right: Live Card Preview */}
            <div className="lg:sticky lg:top-20">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center lg:text-left">Preview</p>
              <CardPreview
                brand={selectedBrand}
                amount={amount}
                currency={currency}
                recipientName={recipientName}
                symbol={selectedCur?.symbol || '$'}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 3 && selectedBrand && (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
              <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, ' + (selectedBrand.brandColor || '#059669') + ', ' + (selectedBrand.brandColor || '#059669') + 'cc)' }}>
                <div className="flex items-center gap-3">
                  <BrandLogo brand={selectedBrand} size="lg" />
                  <div>
                    <p className="font-bold text-lg">{selectedBrand.brandName}</p>
                    <p className="text-white/80 text-sm">{selectedOcc?.emoji} {selectedOcc?.label}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-gray-900">
                    {selectedCur?.symbol}{parseFloat(amount || '0').toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{currency}</p>
                </div>
                <div className="h-px bg-border/50" />
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
                      <p className="text-sm text-amber-900 italic">{'\u201C'}{message}{'\u201D'}</p>
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
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && purchasedCard && (
          <div className="mx-auto max-w-lg space-y-5">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Gift Card Purchased!</h2>
              <p className="text-sm text-gray-500">Your gift card has been created and is ready to share.</p>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden shadow-lg">
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
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-gray-900">
                    {CURRENCIES.find(c => c.code === purchasedCard.currency)?.symbol || '$'}{purchasedCard.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{purchasedCard.currency}</p>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-center">
                  <VisualQRCode code={purchasedCard.code} brandName={purchasedCard.brand.brandName} size={160} />
                </div>
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
                    <p className="text-sm text-amber-900 italic">{'\u201C'}{purchasedCard.message}{'\u201D'}</p>
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
          </div>
        )}
      </div>
    </main>
  );
}
