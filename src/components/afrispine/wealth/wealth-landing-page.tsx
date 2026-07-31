'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  TrendingUp,
  Globe,
  Star,
  BarChart3,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Wallet,
  AlertTriangle,
  Landmark,
  PieChart,
  Coins,
} from 'lucide-react';

/* ── Account activation gate ─────────────────────────────────── */

function useWealthAccountGate() {
  const navigate = useAppStore((s) => s.navigate);
  const sessionToken = useAppStore((s) => s.sessionToken);
  const [checking, setChecking] = React.useState(true);
  const [hasAccount, setHasAccount] = React.useState(false);

  React.useEffect(() => {
    if (!sessionToken) { setChecking(false); return; }
    let cancelled = false;
    fetch('/api/wealth/account/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data && !data.hasAccount) {
          navigate('wealth-activation');
        } else {
          setHasAccount(!!data?.hasAccount);
        }
      })
      .catch(() => setHasAccount(false))
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [sessionToken, navigate]);

  return { checking, hasAccount };
}

/* ── Static data ──────────────────────────────────────────────── */

const exchanges = [
  { id: 'ngx', flag: '🇳🇬', name: 'NGX Nigeria', index: '99,852', change: '+1.4%', return2025: '+51%' },
  { id: 'nse', flag: '🇰🇪', name: 'NSE Kenya', index: '5,213', change: '+0.8%', return2025: '+56%' },
  { id: 'gse', flag: '🇬🇭', name: 'GSE Ghana', index: '4,618', change: '+2.1%', return2025: '+134%' },
  { id: 'jse', flag: '🇿🇦', name: 'JSE South Africa', index: '84,210', change: '+0.3%', return2025: '+12%' },
  { id: 'egx', flag: '🇪🇬', name: 'EGX Egypt', index: '34,501', change: '-0.2%', return2025: '+40%' },
  { id: 'brvm', flag: '🇨🇮', name: 'BRVM (8 countries)', index: '287.6', change: '+0.5%', return2025: '+22%' },
];

const topPicks = [
  {
    ticker: 'SCOM',
    name: 'Safaricom',
    exchange: 'NSE',
    price: 'KES 17.45',
    gbpPrice: 10,
    change: '+3.2%',
    thesis: 'East Africa\'s telecoms giant with M-Pesa mobile money reaching 50M+ users and expanding into Ethiopia.',
  },
  {
    ticker: 'MTNGH',
    name: 'MTN Ghana',
    exchange: 'GSE',
    price: 'GHS 1.52',
    gbpPrice: 5,
    change: '+5.1%',
    thesis: 'Leading mobile operator in Ghana with 27M+ subscribers and growing fintech and data revenue streams.',
  },
  {
    ticker: 'EQTY',
    name: 'Equity Group',
    exchange: 'NSE',
    price: 'KES 71.20',
    gbpPrice: 25,
    change: '+1.8%',
    thesis: 'Pan-African banking group operating in 7 countries with strong digital banking and SME lending growth.',
  },
];

const featuredMarkets = [
  { name: 'GSE Ghana', return: '+134%', desc: 'Strongest-performing African bourse in 2025, driven by banking and telecoms.', color: 'from-emerald-500 to-teal-600' },
  { name: 'NSE Kenya', return: '+56%', desc: 'Tech and banking sectors lead gains with Safaricom and Equity Group surging.', color: 'from-teal-500 to-cyan-600' },
  { name: 'NGX Nigeria', return: '+51%', desc: 'Oil & gas recovery and FX liberalisation fuel investor confidence.', color: 'from-yellow-500 to-amber-600' },
];

/* ── Component ────────────────────────────────────────────────── */

export function WealthLandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { checking, hasAccount } = useWealthAccountGate();

  if (checking) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(20,184,166,0.1)_0%,_transparent_50%)]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 60L60 0M-10 10L10 -10M50 70L70 50\" stroke=\"white\" stroke-width=\"0.5\" fill=\"none\"/%3E%3C/svg%3E")' }} />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 px-4 py-1.5 text-sm backdrop-blur-sm">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              AfriSpine Wealth
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
              Unlock Africa&apos;s Wealth.{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                From $10.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-emerald-100/80 leading-relaxed max-w-2xl mx-auto">
              Buy fractional shares on Africa&apos;s fastest-growing stock exchanges — Nigeria, Kenya, Ghana, South Africa and more.
              Access investments in GBP or USD. No local bank account needed.
            </p>

            {/* Key stat cards */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Globe, label: 'Markets Available', value: '6+', subtext: 'Across Africa', color: 'from-emerald-500/20 to-teal-500/20' },
                { icon: Coins, label: 'Minimum Investment', value: '$10', subtext: 'Fractional shares', color: 'from-amber-500/20 to-yellow-500/20' },
                { icon: BarChart3, label: 'Avg. Returns (2025)', value: '+52%', subtext: 'Top 3 exchanges', color: 'from-cyan-500/20 to-blue-500/20' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl bg-gradient-to-br ${stat.color} border border-white/10 backdrop-blur-sm p-5 text-white transition-all hover:border-white/20 hover:scale-[1.02]`}
                >
                  <stat.icon className="h-5 w-5 text-emerald-300 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm font-medium text-emerald-200 mt-1">{stat.label}</p>
                  <p className="text-xs text-emerald-300/60 mt-0.5">{stat.subtext}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('wealth-market')}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-lg shadow-emerald-900/30 px-8 h-12 text-base"
              >
                Start Investing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm px-8 h-12 text-base"
                onClick={() => navigate('wealth-bonds')}
              >
                <Landmark className="mr-2 h-4 w-4" />
                Learn More
              </Button>
            </div>
            <PartnerDisclosure variant="inline" className="mt-4 text-center" />
          </div>
        </div>
      </section>

      {/* ── Quick Action Bar ── */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
              onClick={() => navigate('wealth-portfolio')}
            >
              <Wallet className="mr-1.5 h-4 w-4" />
              My Investments
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
              onClick={() => navigate('wealth-bonds')}
            >
              <Landmark className="mr-1.5 h-4 w-4" />
              Bonds & Fixed Income
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
              onClick={() => navigate('dangote-ipo')}
            >
              <PieChart className="mr-1.5 h-4 w-4" />
              Dangote IPO
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Dangote IPO */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-700 text-white p-8 sm:p-12 lg:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-orange-300/10 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-yellow-400/20 text-yellow-100 border-yellow-400/30 text-sm">
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Featured Opportunity
                </Badge>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Dangote Refinery IPO
                </h2>
                <p className="mt-4 text-amber-100 leading-relaxed">
                  The largest IPO in African history. $40–50B valuation, up to $5B raise.
                  USD-denominated dividends. Expected September 2026.
                  Invest from abroad — no naira account required.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Up to $5B raise
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    September 2026
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    Open to diaspora
                  </span>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate('dangote-ipo')}
                  className="mt-8 bg-white text-amber-800 hover:bg-amber-50 font-semibold"
                >
                  Register your interest
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'NGX Return (2025)', value: '+51%', icon: TrendingUp },
                  { label: 'Investor Interest', value: '$2B+', icon: BarChart3 },
                  { label: 'Annual Export Rev.', value: '$6.4B', icon: DollarSign },
                  { label: 'Refinery Capacity', value: '650K bpd', icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur p-5">
                    <stat.icon className="h-5 w-5 text-yellow-300 mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-amber-200 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Snapshot */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 sm:p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Your portfolio will appear here after your first investment</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Start investing in African stocks and track your holdings, dividends, and performance all in one place.
            </p>
            <Button
              className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => navigate('wealth-market')}
            >
              Start investing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Exchange Cards */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Live exchange coverage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real-time data from the most vibrant bourses on the African continent.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exchanges.map((ex) => (
              <Card
                key={ex.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
                onClick={() => navigate('wealth-market', { exchange: ex.id })}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                    {ex.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{ex.name}</h3>
                    <p className="text-xs text-muted-foreground">Index: {ex.index}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${ex.change.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                      {ex.change}
                    </p>
                    <p className="text-xs text-muted-foreground">2025: {ex.return2025}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Picks */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Top picks for you
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Curated stocks our analysts believe offer strong growth potential.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topPicks.map((stock) => (
              <Card key={stock.ticker} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-xs">
                          {stock.ticker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{stock.exchange}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-1">{stock.name}</h3>
                    </div>
                    <span className={`text-sm font-semibold ${stock.change.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                      {stock.change}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {stock.thesis}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">{stock.price}</p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => navigate('wealth-stock', { ticker: stock.ticker })}
                    >
                      Buy from &pound;{stock.gbpPrice}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured markets
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Africa&apos;s fastest-growing exchanges in 2025.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {featuredMarkets.map((m) => (
              <div
                key={m.name}
                className={`relative rounded-2xl bg-gradient-to-br ${m.color} p-8 text-white overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]`}
                onClick={() => navigate('wealth-market', { exchange: m.name.toLowerCase().split(' ')[0] })}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <p className="relative text-4xl font-bold">{m.return}</p>
                <p className="relative text-lg font-semibold mt-2">{m.name}</p>
                <p className="relative text-sm text-white/80 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How AfriSpine Wealth works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to start investing in Africa.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Globe,
                title: 'Browse & research',
                desc: 'Explore stocks across NGX, NSE, GSE, JSE, EGX and BRVM. View real-time prices, charts, and analyst picks — all from your dashboard.',
              },
              {
                step: '2',
                icon: DollarSign,
                title: 'Access investments in GBP or USD',
                desc: 'No need for a local currency account. Pay from your AfriSpine wallet or card — we handle the FX conversion at competitive rates.',
              },
              {
                step: '3',
                icon: Shield,
                title: 'Track & grow',
                desc: 'Monitor your portfolio, receive dividends, and reinvest automatically. Your holdings are tracked in real time across all exchanges.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <item.icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Start investing in Africa today
          </h2>
          <p className="mt-4 text-lg text-emerald-200">
            Browse markets, pick stocks, and build a portfolio — all from your AfriSpine account.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('wealth-market')}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold"
            >
              Browse all markets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Risk Disclaimer */}
      <section className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">
              Investing in African stock markets carries risk including possible loss of principal. Past performance is not indicative of future results.
              All data is delayed by at least 15 minutes. AfriSpine acts as an intermediary and does not provide investment advice.
              Please read our full risk disclosure before investing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}