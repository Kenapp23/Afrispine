'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Store, Smartphone, Banknote, Ticket, ChevronDown, ShieldCheck, Star, Bell } from 'lucide-react';
import { MERCH_COUNTRIES, MERCHANTS } from '@/lib/merchants';

/* ── Types ────────────────────────────────────────────────────── */

interface GiftCardBrand {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string;
  country: string;
  countryCode: string;
  category: string;
  description: string | null;
  isVerified: boolean;
  minAmount: number;
  maxAmount: number;
}

/* ── Category config ─────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  Supermarket: '#059669',
  Electronics: '#475569',
  Fashion: '#EC4899',
  'Airtime/Telecom': '#EA580C',
  Travel: '#0284C7',
  'Food & Dining': '#E11D48',
  Healthcare: '#0D9488',
  Entertainment: '#7C3AED',
  'E-Commerce': '#D97706',
  Utilities: '#4B5563',
  General: '#059669',
};

const DEFAULT_COLOR = '#059669';

const CATEGORY_LABELS: string[] = [
  'Supermarket', 'Electronics', 'Fashion', 'Airtime/Telecom',
  'Travel', 'Food & Dining', 'Healthcare', 'Entertainment',
  'E-Commerce', 'Utilities',
];

/* ── Gift Card Brand Card Component ─────────────────────────── */

/* Deterministic hue from string — gives each brand a unique color */
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ((hash % 360) + 360) % 360;
}

function extractDomain(url: string): string {
  if (url.includes('logo.clearbit.com/')) {
    return url.replace('https://logo.clearbit.com/', '').replace('http://logo.clearbit.com/', '');
  }
  return '';
}

function GiftCardBrandCard({ brand }: { brand: GiftCardBrand }) {
  const navigate = useAppStore((s) => s.navigate);
  const color = CATEGORY_COLORS[brand.category] || DEFAULT_COLOR;
  const countryInfo = MERCH_COUNTRIES.find((c) => c.code === brand.countryCode);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Resolve the Clearbit logo URL
  const resolvedUrl = useMemo(() => {
    if (brand.logoUrl && !brand.logoUrl.includes('placeholder')) return brand.logoUrl;
    if (brand.slug) {
      const bySlug = MERCHANTS.find((m) => m.slug === brand.slug);
      if (bySlug?.logoUrl) return bySlug.logoUrl;
    }
    if (brand.brandName) {
      const byName = MERCHANTS.find((m) => m.name === brand.brandName);
      if (byName?.logoUrl) return byName.logoUrl;
    }
    return '';
  }, [brand.logoUrl, brand.slug, brand.brandName]);

  // Use server-side proxy: /api/brand-logo?domain=X
  const proxyUrl = useMemo(() => {
    let domain = extractDomain(resolvedUrl);
    if (!domain && brand.slug) {
      const m = MERCHANTS.find((x) => x.slug === brand.slug);
      if (m?.logoUrl) domain = extractDomain(m.logoUrl);
    }
    return domain ? `/api/brand-logo?domain=${encodeURIComponent(domain)}` : '';
  }, [resolvedUrl, brand.slug]);

  const initials = brand.brandName
    .split(/\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fallbackHue = nameToHue(brand.brandName);

  const gradientStyle = {
    background: 'linear-gradient(135deg, ' + color + ', ' + color + 'cc)',
  };

  const flag = countryInfo ? countryInfo.flag : '\uD83C\uDF0D';
  const hasRealLogo = !!proxyUrl && !imgFailed;

  return (
    <button
      onClick={() => navigate('gifts-send', { brand: brand.id })}
      className="group relative rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer text-left border border-gray-100 hover:border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 w-full"
      aria-label={'Send ' + brand.brandName + ' gift card'}
    >
      <div
        className="relative h-24 sm:h-28 flex items-center justify-center p-3"
        style={gradientStyle}
      >
        <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" aria-hidden="true" />

        {hasRealLogo ? (
          <div className="relative z-[1]">
            {!imgLoaded && <div className="h-14 w-14 rounded-xl bg-white/20 animate-pulse" />}
            <img
              src={proxyUrl}
              alt={brand.brandName}
              className={"h-14 w-14 rounded-xl object-contain shadow-lg transition-opacity duration-300 " + (imgLoaded ? 'opacity-100' : 'opacity-0 absolute')}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
            />
          </div>
        ) : (
          <div
            className="relative z-[1] h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `hsl(${fallbackHue}, 55%, 45%)` }}
          >
            <span className="text-2xl font-extrabold text-white drop-shadow-sm">{initials}</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">{brand.brandName}</h3>
          {brand.isVerified && <ShieldCheck className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden="true">{flag}</span>
            <span className="text-[11px] text-gray-500 font-medium">{brand.country}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">{brand.category}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Brand Card Skeleton ─────────────────────────────────────── */

function BrandCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 w-full">
      <Skeleton className="h-24 sm:h-28 w-full rounded-none" />
      <div className="p-3 sm:p-3.5">
        <Skeleton className="h-4 w-3/4 mb-2 rounded" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────── */

const BRANDS_PER_PAGE = 36;

export default function GiftsHubPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [showCount, setShowCount] = useState(BRANDS_PER_PAGE);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedCountry !== 'all' ? '?country=' + selectedCountry : '';
      const res = await fetch('/api/gift-cards/brands' + params);
      if (!res.ok) throw new Error('Failed to fetch brands');
      const data = await res.json();
      setBrands(data.brands ?? []);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  useEffect(() => { setShowCount(BRANDS_PER_PAGE); }, [selectedCountry, selectedCategory]);

  useEffect(() => {
    if (!seeded && brands.length === 0 && !loading) {
      fetch('/api/gift-cards/seed-brands', { method: 'POST' })
        .then(r => r.json())
        .then(() => { setSeeded(true); fetchBrands(); })
        .catch(() => {});
    }
  }, [brands.length, loading, seeded]);

  const filteredBrands = useMemo(() => {
    if (selectedCategory === 'all') return brands;
    return brands.filter(b => b.category === selectedCategory);
  }, [brands, selectedCategory]);

  const displayedBrands = useMemo(() => filteredBrands.slice(0, showCount), [filteredBrands, showCount]);
  const hasMore = filteredBrands.length > showCount;
  const totalBrandCount = brands.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of brands) {
      counts[b.category] = (counts[b.category] || 0) + 1;
    }
    return counts;
  }, [brands]);

  const comingSoonSteps = [
    { icon: Store, title: 'Browse brands', description: 'Explore 100+ verified African brands across 10+ categories.' },
    { icon: Star, title: 'Set your preferences', description: 'Tell us your preferred brands and amounts.' },
    { icon: Bell, title: 'Be first to know', description: 'Get notified the moment gift cards go live.' },
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.2)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.12)_0%,_transparent_50%)]" />
        <div className="absolute top-6 right-8 text-5xl opacity-20 select-none hidden sm:block" aria-hidden="true">{'\uD83C\uDF81'}</div>
        <div className="absolute bottom-10 left-6 text-4xl opacity-15 select-none hidden md:block" aria-hidden="true">{'\u2728'}</div>

        <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/30 px-4 py-1.5 text-xs font-semibold text-amber-200 mb-6 backdrop-blur-sm">
            Coming Soon
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Gift Cards for{' '}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">Africa</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-amber-100/80 max-w-xl mx-auto leading-relaxed">
            We&apos;re building the easiest way to send gift cards across Africa. Browse our brand partners and join the waitlist to be the first to know when we launch.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50 shadow-lg shadow-amber-900/30 rounded-full px-8 h-12 text-base font-bold" onClick={() => navigate('gifts-send', {})}>
              Join the Waitlist <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-6 h-12 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm" onClick={() => navigate('gifts-redeem')}>
              Redeem a Card
            </Button>
          </div>
        </div>
      </section>

      {/* Brands we're working with */}
      <section className="mx-auto max-w-4xl px-5 -mt-8 relative z-10">
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Brands we&apos;re working with</h2>
          <p className="mt-1 text-sm text-gray-500">Preview the categories and partners joining our gift card platform.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Smartphone, title: 'Airtime & Mobile Money', description: 'Top up Safaricom, MTN, Airtel and other networks across Africa.', action: 'Learn More', gradient: 'from-amber-500 to-orange-500' },
            { icon: Banknote, title: 'Shopping Vouchers', description: 'Redeemable at supermarkets, restaurants, fashion stores and more.', action: 'Learn More', gradient: 'from-yellow-500 to-amber-500' },
            { icon: Ticket, title: 'Entertainment', description: 'Gift cards for streaming, movies, gaming and more.', action: 'Learn More', gradient: 'from-orange-500 to-amber-500' },
          ].map((cat) => (
            <Card key={cat.title} className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white overflow-hidden" onClick={() => navigate('gifts-send', { occasion: 'birthday' })}>
              <CardContent className="p-6">
                <div className={"inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br " + cat.gradient + " text-white mb-4 shadow-md"}><cat.icon className="size-6" /></div>
                <h3 className="font-bold text-gray-900 text-lg">{cat.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{cat.description}</p>
                <Button variant="ghost" className="mt-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-0 font-semibold text-sm">
                  {cat.action} <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What's coming */}
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What&apos;s coming</h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">Here&apos;s what we&apos;re building — and how you can get early access.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          {comingSoonSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < comingSoonSteps.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px border-t-2 border-dashed border-amber-200" aria-hidden="true" />
                )}
                <div className="relative z-10 flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                  <Icon className="size-6" />
                </div>
                <span className="mt-1 text-xs font-bold text-amber-600 uppercase tracking-widest">Step {i + 1}</span>
                <h3 className="mt-2 text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Gift Card Brands */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 mb-4">
            <Star className="size-3" />
            Verified Brands
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Brands Coming Soon</h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            {totalBrandCount}+ verified brands across {MERCH_COUNTRIES.length} countries
          </p>
        </div>

        {/* Country filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setSelectedCountry('all')}
            className={selectedCountry === 'all' ? 'rounded-full px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white shadow-sm' : 'rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-100'}
          >{'\uD83C\uDF0D'} All</button>
          {MERCH_COUNTRIES.map((c) => (
            <button key={c.code} onClick={() => setSelectedCountry(c.code)} className={selectedCountry === c.code ? 'rounded-full px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white shadow-sm' : 'rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-100'}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'rounded-full px-3 py-1 text-[11px] font-semibold bg-gray-900 text-white' : 'rounded-full px-3 py-1 text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'}
          >All Categories</button>
          {CATEGORY_LABELS.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'rounded-full px-3 py-1 text-[11px] font-semibold bg-gray-900 text-white' : 'rounded-full px-3 py-1 text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'}>
              {cat}{categoryCounts[cat] ? ' (' + categoryCounts[cat] + ')' : ''}
            </button>
          ))}
        </div>

        {/* Brand Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, i) => <BrandCardSkeleton key={i} />)}
          </div>
        ) : displayedBrands.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No brands found for this filter.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {displayedBrands.map((b) => <GiftCardBrandCard key={b.id} brand={b} />)}
            </div>
            <div className="mt-8 flex flex-col items-center gap-3">
              {hasMore && (
                <Button variant="outline" className="rounded-full px-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-semibold" onClick={() => setShowCount((prev: number) => prev + BRANDS_PER_PAGE)}>
                  Show More Brands <ChevronDown className="size-4 ml-1" />
                </Button>
              )}
              <p className="text-xs text-gray-400">
                Showing {displayedBrands.length} of {filteredBrands.length} brands
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Become a Merchant CTA */}
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xl shadow-emerald-600/15">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5" aria-hidden="true" />
          <div className="relative">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-white/20 mb-5">
              <Store className="size-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              List your business on<br className="hidden sm:block" /> AfriSpine Gift Cards
            </h2>
            <p className="mt-3 text-emerald-100 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Join verified African merchants accepting gift cards. Reach new customers and grow your business across the continent.
            </p>
            <Button size="lg" className="mt-8 bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg rounded-full px-8 h-12 text-base font-semibold" onClick={() => navigate('gifts-merchant')}>
              Register as a Brand <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <div className="h-8" />
    </main>
  );
}