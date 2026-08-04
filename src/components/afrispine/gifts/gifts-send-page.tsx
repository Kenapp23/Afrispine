'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  Search,
  Loader2,
  Clock,
} from 'lucide-react';
import { MERCH_COUNTRIES, MERCH_CATEGORIES, MERCHANTS } from '@/lib/merchants';

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

/* ── Logo Component ────────────────────────────────────────────── */

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ((hash % 360) + 360) % 360;
}

function extractDomainFromUrl(url: string): string {
  if (url.includes('logo.clearbit.com/')) {
    return url.replace('https://logo.clearbit.com/', '').replace('http://logo.clearbit.com/', '');
  }
  return '';
}

function BrandLogo({ brand, size = 'md' }: { brand: { brandName: string; logoUrl: string; slug?: string; category?: string }; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  // Resolve the best logo URL:
  // 1. brand.logoUrl from API (may be empty if DB has no logo)
  // 2. MERCHANTS lookup by slug (matches seed data)
  // 3. MERCHANTS lookup by brandName (covers DB brands with null slug)
  const resolvedUrl = useMemo(() => {
    // 1. Use API-provided URL if present
    if (brand.logoUrl && !brand.logoUrl.includes('placeholder')) {
      return brand.logoUrl;
    }
    // 2. Match by slug first (most reliable)
    if (brand.slug) {
      const bySlug = MERCHANTS.find((m) => m.slug === brand.slug);
      if (bySlug?.logoUrl) return bySlug.logoUrl;
    }
    // 3. Match by brandName as fallback (handles null slug from DB)
    if (brand.brandName) {
      const byName = MERCHANTS.find((m) => m.name === brand.brandName);
      if (byName?.logoUrl) return byName.logoUrl;
    }
    return '';
  }, [brand.logoUrl, brand.slug, brand.brandName]);

  // Use server-side proxy: /api/brand-logo?domain=X
  const proxyUrl = useMemo(() => {
    let domain = extractDomainFromUrl(resolvedUrl);
    if (!domain && brand.slug) {
      const m = MERCHANTS.find((x) => x.slug === brand.slug);
      if (m?.logoUrl) domain = extractDomainFromUrl(m.logoUrl);
    }
    return domain ? `/api/brand-logo?domain=${encodeURIComponent(domain)}` : '';
  }, [resolvedUrl, brand.slug]);

  const [imgFailed, setImgFailed] = useState(false);

  const containerCls: Record<string, string> = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-12 w-12 rounded-xl',
    lg: 'h-16 w-16 rounded-2xl',
    xl: 'h-20 w-20 rounded-2xl',
  };
  const textCls: Record<string, string> = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-lg',
  };

  const initials = brand.brandName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fallbackHue = nameToHue(brand.brandName);

  // No logo available → distinctive colored initials
  if (!proxyUrl || imgFailed) {
    return (
      <div
        className={containerCls[size] + ' flex items-center justify-center text-white font-semibold shrink-0'}
        style={{ backgroundColor: `hsl(${fallbackHue}, 55%, 45%)` }}
      >
        <span className={textCls[size]}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={containerCls[size] + ' shrink-0 overflow-hidden bg-white'}>
      <img
        src={proxyUrl}
        alt={brand.brandName}
        className="h-full w-full object-contain p-1"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

/* ── Currencies ───────────────────────────────────────────────── */

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
  const [submitting, setSubmitting] = useState(false);
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<GiftCardBrand | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

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

  const selectedCur = CURRENCIES.find(c => c.code === currency);

  const handleJoinWaitlist = async () => {
    if (!selectedBrand) {
      toast.error('Please select a brand first');
      return;
    }
    setSubmitting(true);
    try {
      const email = waitlistEmail || sender?.email || '';
      const res = await fetch('/api/gift-cards/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          brandName: selectedBrand.brandName,
          email,
          country: selectedBrand.country,
          countryCode: selectedBrand.countryCode,
          ...(amount ? { preferredAmount: parseFloat(amount), preferredCurrency: currency } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to join waitlist'); return; }
      setWaitlistSubmitted(true);
      toast.success('You\'re on the list! We\'ll notify you when gift cards launch.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
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
    setWaitlistSubmitted(false);
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
            {step === 2 && !waitlistSubmitted && 'Join Waitlist'}
            {step === 2 && waitlistSubmitted && 'Waitlist Confirmation'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2].map(s => (
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

        {/* STEP 2: Waitlist Form */}
        {step === 2 && selectedBrand && !waitlistSubmitted && (
          <div className="mx-auto max-w-lg space-y-5">
            {/* Selected brand card */}
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-white">
              <BrandLogo brand={selectedBrand} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{selectedBrand.brandName}</p>
                <p className="text-xs text-gray-500">{selectedBrand.category} {'\u00B7'} {selectedBrand.country}</p>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 shrink-0">Verified</Badge>
            </div>

            {/* Preferred amount (optional) */}
            <div className="space-y-3 rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Preferred Amount <span className="text-gray-400 font-normal">(optional)</span></Label>
                <span className="text-xs text-gray-400">{selectedCur?.name}</span>
              </div>
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

            {/* Email input (only if user not logged in) */}
            {!sender?.email && (
              <div className="space-y-2 rounded-xl border bg-white p-4">
                <Label className="text-sm font-semibold">Email for waitlist notification *</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                />
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={handleJoinWaitlist}
              disabled={submitting || (!waitlistEmail && !sender?.email)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Join Waitlist
                </>
              )}
            </Button>

            {!sender?.email && !waitlistEmail && (
              <p className="text-xs text-gray-400 text-center">Enter your email above to join the waitlist.</p>
            )}
          </div>
        )}

        {/* STEP 2 (SUCCESS): Waitlist Confirmation */}
        {step === 2 && waitlistSubmitted && selectedBrand && (
          <div className="mx-auto max-w-lg space-y-5">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-amber-100">
                <Bell className="size-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">You're on the waitlist!</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Gift cards are launching soon. We'll notify you when {selectedBrand.brandName} gift cards become available.
              </p>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <BrandLogo brand={selectedBrand} size="lg" />
                  <div>
                    <p className="font-bold text-lg text-gray-900">{selectedBrand.brandName}</p>
                    <p className="text-sm text-gray-500">{selectedBrand.category} · {selectedBrand.country}</p>
                  </div>
                </div>
                <div className="h-px bg-border/50" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Preferred Amount</p>
                    <p className="font-bold text-gray-900">{amount ? selectedCur?.symbol + parseFloat(amount).toLocaleString() : 'Not specified'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="font-bold text-gray-900">{currency}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <p className="text-sm text-emerald-700 font-medium">We'll email {waitlistEmail || sender?.email || 'you'} when this brand goes live.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setWaitlistSubmitted(false); setStep(1); }}>
                    Browse More Brands
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
