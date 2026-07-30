'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { generatePriceHistory } from '@/lib/wealth-data';

interface MoverItem {
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: string;
}

const EXCHANGE_FLAGS: Record<string, string> = {
  NGX: '🇳🇬',
  NSE: '🇰🇪',
  JSE: '🇿🇦',
  GSE: '🇬🇭',
  EGX: '🇪🇬',
  BRVM: '🇨🇮',
};

const EXCHANGE_CURRENCIES: Record<string, string> = {
  NGX: '₦',
  NSE: 'KSh',
  JSE: 'R',
  GSE: '₵',
  EGX: 'E£',
  BRVM: 'CFA',
};

const TABS = [
  { label: 'All', filter: null },
  { label: 'NSE Kenya', filter: 'NSE' },
  { label: 'NGX Nigeria', filter: 'NGX' },
  { label: 'JSE', filter: 'JSE' },
  { label: 'GSE', filter: 'GSE' },
];

function formatPrice(price: number, exchange: string): string {
  const currency = EXCHANGE_CURRENCIES[exchange] || '';
  if (price >= 1000) return `${currency}${price.toLocaleString('en', { maximumFractionDigits: 0 })}`;
  if (price >= 10) return `${currency}${price.toFixed(2)}`;
  return `${currency}${price.toFixed(3)}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return vol.toString();
}

function MoverSparkline({ price, changePct }: { price: number; changePct: number }) {
  const points = useMemo(() => {
    const history = generatePriceHistory(price, 0.018);
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 160, h = 36;
    return prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
  }, [price]);

  const color = changePct >= 0 ? '#059669' : '#dc2626';
  const gradId = `mg-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="my-1">
      <svg viewBox="0 0 160 36" className="w-full h-8" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={`0,36 ${points} 160,36`} fill={`url(#${gradId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function BiggestMovers() {
  const navigate = useAppStore((s) => s.navigate);
  const [movers, setMovers] = useState<MoverItem[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/wealth/prices/movers?type=all&limit=12');
        const data = await res.json();
        if (active) setMovers(data.movers || []);
      } catch { /* silently fail */ }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const filtered = activeTab
    ? movers.filter((m) => m.exchange === activeTab)
    : movers;

  return (
    <section className="w-full py-10 sm:py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Today&apos;s Biggest Movers
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Live from 8 African stock exchanges
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.filter)}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.filter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No stocks found for this filter.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar">
            {filtered.map((stock) => {
              const isPositive = stock.changePct >= 0;
              const flag = EXCHANGE_FLAGS[stock.exchange] || '';
              const borderClass = isPositive ? 'border-l-green-500' : 'border-l-red-500';

              return (
                <div
                  key={`${stock.ticker}-${stock.exchange}`}
                  className={`bg-white border border-gray-200 border-l-4 ${borderClass} rounded-lg p-4 hover:shadow-md transition-shadow`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{flag}</span>
                      <span className="font-bold text-gray-900 text-sm">{stock.ticker}</span>
                      <span className="text-gray-400 text-xs">{stock.exchange}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPositive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isPositive ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </span>
                  </div>

                  {/* Price & change */}
                  <div className="mb-1">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(stock.price, stock.exchange)}
                    </div>
                    <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{stock.change.toFixed(2)} today
                    </div>
                  </div>

                  {/* Sparkline graph */}
                  <MoverSparkline price={stock.price} changePct={stock.changePct} />

                  {/* Volume & market cap */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-3">
                    <span>Vol: {formatVolume(stock.volume)}</span>
                    <span>MCap: {stock.marketCap}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('wealth-stock', { ticker: stock.ticker })}
                      className="flex-1 text-xs font-medium py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate('wealth-buy', { ticker: stock.ticker })}
                      className="flex-1 text-xs font-medium py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View all link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('markets')}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1 transition-colors"
          >
            View all markets
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}