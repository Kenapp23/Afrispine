'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ArrowRight, MessageSquareHeart, Zap, Store, Smartphone, Banknote, Ticket } from 'lucide-react';
import { allMerchants, getMerchantsByCountry, MERCH_COUNTRIES, type Merchant } from '@/lib/merchants';

/* ── Occasion data ─────────────────────────────────────────────── */

const occasions = [
  { id: 'christmas', emoji: '🎄', label: 'Christmas' },
  { id: 'new-baby', emoji: '👶', label: 'New Baby' },
  { id: 'graduation', emoji: '🎓', label: 'Graduation' },
  { id: 'wedding', emoji: '💒', label: 'Wedding' },
  { id: 'birthday', emoji: '🎂', label: 'Birthday' },
  { id: 'new-home', emoji: '🏠', label: 'New Home' },
  { id: 'get-well', emoji: '💪', label: 'Get Well' },
  { id: 'eid', emoji: '🙏', label: 'Eid' },
] as const;

/* ── How-it-works steps ────────────────────────────────────────── */

const steps = [
  {
    icon: Gift,
    title: 'Choose an occasion & amount',
    description: 'Pick the perfect occasion, set your amount, and select a merchant.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Personalise your message',
    description: 'Add a heartfelt note that makes your gift truly special.',
  },
  {
    icon: Zap,
    title: 'Delivered instantly',
    description: 'Your loved one receives a gift voucher via WhatsApp or email.',
  },
];

/* ── Merchant logo component with fallback ────────────────────── */

function MerchantLogo({ merchant, size = 'md' }: { merchant: Merchant; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 rounded-lg text-xs',
    md: 'h-12 w-12 rounded-xl text-sm',
    lg: 'h-16 w-16 rounded-2xl text-base',
  };
  const fallbackSizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-12 w-12 rounded-xl',
    lg: 'h-16 w-16 rounded-2xl',
  };
  const imgSize = {
    sm: 'h-8 w-8 rounded-lg object-contain',
    md: 'h-12 w-12 rounded-xl object-contain',
    lg: 'h-16 w-16 rounded-2xl object-contain',
  };

  return (
    <div className="relative">
      <img
        src={merchant.logoUrl}
        alt={merchant.name}
        className={imgSize[size]}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div
        className={`hidden ${fallbackSizes[size]} bg-emerald-600 flex items-center justify-center text-white font-bold ${sizeClasses[size].split(' ').pop()}`}
      >
        {merchant.name.charAt(0)}
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────── */

export default function GiftsHubPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const displayedMerchants = useMemo(() => {
    if (selectedCountry === 'all') return allMerchants.slice(0, 12);
    return getMerchantsByCountry(selectedCountry);
  }, [selectedCountry]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.2)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(20,184,166,0.12)_0%,_transparent_50%)]" />
        {/* Decorative elements */}
        <div className="absolute top-6 right-8 text-5xl opacity-20 select-none hidden sm:block" aria-hidden="true">🎁</div>
        <div className="absolute bottom-10 left-6 text-4xl opacity-15 select-none hidden md:block" aria-hidden="true">✨</div>
        <div className="absolute top-20 left-1/4 text-3xl opacity-10 select-none hidden lg:block" aria-hidden="true">🌟</div>

        <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 text-xs font-semibold text-emerald-200 mb-6 backdrop-blur-sm">
            <Gift className="size-3.5" />
            AfriSpine Gifts
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Send Gifts to{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Africa
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-emerald-100/80 max-w-xl mx-auto leading-relaxed">
            Instant digital gift delivery to Kenya, Nigeria, Ghana and more.
            Airtime, mobile money &amp; vouchers — delivered in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-lg shadow-emerald-900/30 rounded-full px-8 h-12 text-base font-bold"
              onClick={() => {
                const first = occasions[0];
                navigate('gifts-send', { occasion: first.id });
              }}
            >
              Send a gift
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 h-12 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              onClick={() => navigate('gifts-redeem')}
            >
              Redeem a voucher
            </Button>
          </div>
        </div>
      </section>

      {/* ── Gift Category Cards ── */}
      <section className="mx-auto max-w-4xl px-5 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Smartphone,
              title: 'Airtime Top-Up',
              description: 'Instantly top up Safaricom, MTN, Airtel and other networks across Africa. From £5.',
              action: 'Send Airtime',
              gradient: 'from-emerald-500 to-teal-500',
            },
            {
              icon: Banknote,
              title: 'Mobile Money',
              description: 'Send directly to M-Pesa, MTN MoMo, Airtel Money wallets. Your loved ones get funds in minutes.',
              action: 'Send Mobile Money',
              gradient: 'from-amber-500 to-orange-500',
            },
            {
              icon: Ticket,
              title: 'Gift Vouchers',
              description: 'Redeemable at 100+ African brands — supermarkets, restaurants, fashion and more.',
              action: 'Browse Vouchers',
              gradient: 'from-cyan-500 to-blue-500',
            },
          ].map((cat) => (
            <Card
              key={cat.title}
              className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white overflow-hidden"
              onClick={() => navigate('gifts-send', { occasion: 'birthday' })}
            >
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${cat.gradient} text-white mb-4 shadow-md`}>{
                  <cat.icon className="size-6" />
                }</div>
                <h3 className="font-bold text-gray-900 text-lg">{cat.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{cat.description}</p>
                <Button
                  variant="ghost"
                  className="mt-4 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-0 font-semibold text-sm"
                >
                  {cat.action}
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Occasion Selection Grid (Step 1) ────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">
            Step 1
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            What&apos;s the occasion?
          </h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Pick an occasion and we&apos;ll help you craft the perfect gift.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {occasions.map((occ) => (
            <button
              key={occ.id}
              onClick={() => navigate('gifts-send', { occasion: occ.id })}
              className="group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-amber-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              aria-label={`Send a ${occ.label} gift`}
            >
              <span className="text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-110">
                {occ.emoji}
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">
                {occ.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            How it works
          </h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Three simple steps to brighten someone&apos;s day.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden sm:block absolute top-7 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px border-t-2 border-dashed border-amber-200"
                    aria-hidden="true"
                  />
                )}

                {/* Step number badge */}
                <div className="relative z-10 flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                  <Icon className="size-6" />
                </div>
                <span className="mt-1 text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Step {i + 1}
                </span>
                <h3 className="mt-2 text-base font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Featured Merchants ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Redeem at top African brands
          </h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Gift vouchers accepted at {allMerchants.length}+ stores across {MERCH_COUNTRIES.length} countries.
          </p>
        </div>

        {/* Country filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCountry('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              selectedCountry === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            All Countries
          </button>
          {MERCH_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                selectedCountry === c.code
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        {/* Merchant grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6">
          {displayedMerchants.map((m) => (
            <div
              key={m.id}
              className="flex flex-col items-center gap-2 group cursor-default"
            >
              <div className="transition-transform duration-200 group-hover:scale-105">
                <MerchantLogo merchant={m} size="md" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                  {m.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {MERCH_COUNTRIES.find((c) => c.code === m.countryCode)?.flag} {m.country}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          &amp; {allMerchants.length}+ merchants across Kenya, Nigeria, Ghana, South Africa, Uganda, Tanzania&hellip;
        </p>
      </section>

      {/* ── Become a Merchant CTA ───────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xl shadow-amber-600/15">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5" aria-hidden="true" />

          <div className="relative">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-white/20 mb-5">
              <Store className="size-7 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              List your business on<br className="hidden sm:block" /> AfriSpine Gifts
            </h2>
            <p className="mt-3 text-amber-100 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Join hundreds of African merchants already accepting AfriSpine gift vouchers.
              Grow your customer base today.
            </p>

            <Button
              size="lg"
              className="mt-8 bg-white text-amber-700 hover:bg-amber-50 shadow-lg rounded-full px-8 h-12 text-base font-semibold"
              onClick={() => navigate('gifts-merchant')}
            >
              Register as a merchant
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-8" />
    </main>
  );
}