'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  TrendingUp,
  Globe,
  Clock,
  Star,
  BarChart3,
  Building2,
  ChevronRight,
  Zap,
  DollarSign,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { EXCHANGES, getTopMovers, generatePriceHistory, type StockQuote, type ExchangeInfo } from '@/lib/wealth-data';
import { WealthDisclaimer } from '@/components/afrispine/wealth/wealth-disclaimer';

// ─── Mini Sparkline SVG ──────────────────────────────────────
function MiniSparkline({ basePrice, changePct, width = 120, height = 40 }: { basePrice: number; changePct: number; width?: number; height?: number }) {
  const points = React.useMemo(() => {
    const history = generatePriceHistory(basePrice, 0.015);
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    return prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
  }, [basePrice, height, width]);

  const color = changePct >= 0 ? '#059669' : '#dc2626';
  const gradId = `grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Live Exchange Index Card ────────────────────────────────
function ExchangeCard({ exchange }: { exchange: ExchangeInfo }) {
  const navigate = useAppStore((s) => s.navigate);
  const [liveData, setLiveData] = React.useState(exchange);
  const [pulsing, setPulsing] = React.useState(false);

  // Simulate live micro-updates every 5s
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => {
        const microChange = (Math.random() - 0.48) * 0.15;
        const newPct = parseFloat((prev.indexChangePct + microChange).toFixed(2));
        const newVal = parseFloat((prev.indexValue * (1 + microChange / 100)).toFixed(0));
        setPulsing(true);
        setTimeout(() => setPulsing(false), 600);
        return { ...prev, indexValue: newVal, indexChangePct: newPct, indexChange: parseFloat((newVal - exchange.indexValue + exchange.indexChange).toFixed(1)) };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [exchange]);

  const isUp = liveData.indexChangePct >= 0;
  const statusMap: Record<string, { label: string; color: string; active: boolean }> = {
    ngx: { label: 'Launching with Dangote IPO', color: 'border-yellow-300 bg-yellow-50/80', active: true },
    jse: { label: 'Live — Q4 2026', color: 'border-blue-200 bg-blue-50/80', active: false },
    nse: { label: 'Live — via Ziidi model', color: 'border-teal-200 bg-teal-50/80', active: true },
    gse: { label: 'Live — Q1 2027', color: 'border-emerald-200 bg-emerald-50/80', active: false },
    egx: { label: 'Researching', color: 'border-gray-200 bg-gray-50/80', active: false },
    brvm: { label: 'Researching', color: 'border-gray-200 bg-gray-50/80', active: false },
  };
  const status = statusMap[liveData.id] || { label: 'Researching', color: 'border-gray-200 bg-gray-50/80', active: false };

  return (
    <button
      onClick={() => navigate('wealth-market', { exchangeId: liveData.id })}
      className={`rounded-xl border-2 p-6 ${status.color} transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left w-full cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{liveData.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{liveData.indexName} Index &middot; {liveData.marketCapUsd}</p>
        </div>
        <div className="text-right">
          <span className={`text-xl font-bold transition-colors ${pulsing ? 'scale-105 inline-block' : ''} ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {liveData.indexValue.toLocaleString()}
          </span>
          <p className={`text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {isUp ? '+' : ''}{liveData.indexChangePct.toFixed(2)}%
          </p>
        </div>
      </div>
      {/* Mini sparkline */}
      <div className="mt-3 -mx-1">
        <MiniSparkline basePrice={liveData.indexValue} changePct={liveData.indexChangePct} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm text-muted-foreground">{status.label}</p>
        <p className="text-xs text-muted-foreground">
          2025 YTD: <span className="font-semibold text-emerald-600">{exchange.return2025}</span>
        </p>
      </div>
      <div className="flex items-center justify-end mt-1 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        View stocks <ChevronRight className="h-3 w-3 inline" />
      </div>
    </button>
  );
}

export function MarketsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [exchangeData] = React.useState(EXCHANGES);
  const [topGainers, setTopGainers] = React.useState<StockQuote[]>([]);
  const [topLosers, setTopLosers] = React.useState<StockQuote[]>([]);
  const [mostActive, setMostActive] = React.useState<StockQuote[]>([]);
  const [activeTab, setActiveTab] = React.useState<'gainers' | 'losers' | 'active'>('gainers');
  React.useEffect(() => {
    setTopGainers(getTopMovers('gainers', 6));
    setTopLosers(getTopMovers('losers', 6));
    setMostActive(getTopMovers('active', 6));
  }, []);

  const currentMovers = activeTab === 'gainers' ? topGainers : activeTab === 'losers' ? topLosers : mostActive;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 px-4 py-1.5 text-sm">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              AfriSpine Wealth
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Explore African markets
              <span className="block text-emerald-600 mt-2">from anywhere</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Access stock exchanges across Nigeria, Kenya, Ghana, South Africa and more.
              AfriSpine handles FX conversion so you can access investments in USD, GBP, or EUR
              — no local currency account needed.
            </p>
          </div>
        </div>
      </section>

      {/* Featured: Dangote IPO */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-yellow-400/20 text-yellow-200 border-yellow-400/30 text-sm">
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Featured Opportunity
                </Badge>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Dangote Refinery IPO
                </h2>
                <p className="mt-4 text-emerald-100 leading-relaxed">
                  The largest IPO in African history. $40–50B valuation, up to $5B raise.
                  USD-denominated dividends. Expected September 2026.
                  Invest from abroad — no naira account required.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-200">
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
                  className="mt-8 bg-yellow-400 text-emerald-900 hover:bg-yellow-300 font-semibold"
                >
                  Learn more &amp; register
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'NGX Return (2025)', value: '+51%', icon: TrendingUp },
                  { label: 'Investor Interest', value: '$2B+', icon: BarChart3 },
                  { label: 'Annual Export Rev.', value: '$6.4B', icon: DollarSign },
                  { label: 'Refinery Capacity', value: '650K bpd', icon: Building2 },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur p-5">
                    <stat.icon className="h-5 w-5 text-yellow-300 mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-emerald-200 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exchange Coverage — Live Index Data (Clickable) */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Live exchange indices
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real-time index data across African exchanges. Click any exchange to explore its stocks.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exchangeData.map((ex) => (
              <ExchangeCard key={ex.id} exchange={ex} />
            ))}
          </div>
        </div>
      </section>

      {/* Today's Biggest Movers — Cards with sparklines */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Today&apos;s Biggest Movers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Top performing stocks across all tracked exchanges.
            </p>
          </div>
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {([['gainers', 'Top Gainers', TrendingUp], ['losers', 'Top Losers', TrendingDown], ['active', 'Most Active', Activity]] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-muted-foreground hover:text-gray-700'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Cards Grid with sparklines */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMovers.map((s) => {
              const isUp = s.changePct >= 0;
              return (
                <div
                  key={s.ticker}
                  className={`rounded-xl border-2 p-5 transition-all hover:shadow-md cursor-pointer group ${isUp ? 'border-l-green-400 bg-green-50/30' : 'border-l-red-400 bg-red-50/30'}`}
                  onClick={() => navigate('wealth-stock', { ticker: s.ticker })}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{s.ticker}</span>
                      <Badge variant="outline" className="text-[10px] font-normal">{s.exchange}</Badge>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                    </span>
                  </div>
                  {/* Sparkline */}
                  <div className="my-2">
                    <MiniSparkline basePrice={s.price} changePct={s.changePct} width={200} height={48} />
                  </div>
                  {/* Price + name */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{s.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{s.name}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 h-7"
                      onClick={(e) => { e.stopPropagation(); navigate('wealth-buy', { ticker: s.ticker }); }}
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              );
            })}
            {currentMovers.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">Loading market data...</div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How AfriSpine Wealth works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three problems solved — one platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'One API, every exchange',
                desc: 'Through mystocks.africa and Mansa Markets, we access JSE, NGX, NSE Kenya, GSE, BRVM and more via a single integration with USD settlement and real-time webhooks. No more five separate broker relationships.',
              },
              {
                icon: Zap,
                title: 'No CDS account needed',
                desc: 'The Ziidi model pools investor funds via M-PESA into a single CDS account managed by Kestrel Capital. Individual ownership is recorded digitally. No paperwork, no in-person visits, no barrier to entry.',
              },
              {
                icon: DollarSign,
                title: 'AfriSpine handles FX',
                desc: 'Convert USD, GBP, or EUR to KES, NGN, GHS at competitive rates. AfriSpine is the payment rail — no 3–5% bank FX fees, no wire transfers, no 5–7 step processes. Fund and access investments in one flow.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <item.icon className="h-7 w-7 text-emerald-600" />
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
            Start with the Dangote IPO
          </h2>
          <p className="mt-4 text-lg text-emerald-200">
            The first opportunity is the biggest. Register for IPO updates — no account needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('dangote-ipo')}
              className="bg-yellow-400 text-emerald-900 hover:bg-yellow-300 font-semibold"
            >
              Register for Dangote IPO
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate('signup')}
            >
              Create full account
            </Button>
          </div>
        </div>
      </section>
      <WealthDisclaimer variant="general" />
    </div>
  );
}