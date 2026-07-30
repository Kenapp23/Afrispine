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

const EXCHANGE_LABELS: Record<string, string> = {
  NGX: 'NG', NSE: 'KE', JSE: 'ZA', GSE: 'GH', EGX: 'EG', BRVM: 'BRVM',
};

const EXCHANGE_CURRENCIES: Record<string, string> = {
  NGX: '₦', NSE: 'KSh', JSE: 'R', GSE: '₵', EGX: 'E£', BRVM: 'CFA',
};

function formatPrice(price: number, exchange: string): string {
  const currency = EXCHANGE_CURRENCIES[exchange] || '';
  if (price >= 1000) return `${currency}${price.toLocaleString('en', { maximumFractionDigits: 0 })}`;
  if (price >= 10) return `${currency}${price.toFixed(2)}`;
  return `${currency}${price.toFixed(3)}`;
}

function MiniSpark({ price, changePct }: { price: number; changePct: number }) {
  const pts = useMemo(() => {
    const history = generatePriceHistory(price, 0.015);
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    return prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * 80;
      const y = 24 - ((p - min) / range) * 20 - 2;
      return `${x},${y}`;
    }).join(' ');
  }, [price]);

  const color = changePct >= 0 ? '#059669' : '#dc2626';
  const gid = `mc-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox="0 0 80 24" className="w-20 h-6 shrink-0" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={`0,24 ${pts} 80,24`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MoversCompact() {
  const navigate = useAppStore((s) => s.navigate);
  const [movers, setMovers] = useState<MoverItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/wealth/prices/movers?type=all&limit=6');
        const data = await res.json();
        if (active) setMovers(data.movers || []);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (movers.length === 0) return null;

  return (
    <section className="bg-gray-50 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top movers</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Across African exchanges</p>
          </div>
          <button
            onClick={() => navigate('markets')}
            className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View all markets &rarr;
          </button>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {movers.slice(0, 6).map((s) => {
            const isUp = s.changePct >= 0;
            const label = EXCHANGE_LABELS[s.exchange] || s.exchange;
            return (
              <button
                key={`${s.ticker}-${s.exchange}`}
                onClick={() => navigate('wealth-stock', { ticker: s.ticker })}
                className={`flex-shrink-0 w-44 sm:w-auto rounded-lg border p-3 text-left hover:shadow-md transition-all ${
                  isUp ? 'border-green-200 bg-white' : 'border-red-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center h-4 min-w-[20px] rounded bg-gray-100 px-1 text-[9px] font-bold text-gray-500 uppercase">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{s.ticker}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(s.price, s.exchange)}</span>
                  <MiniSpark price={s.price} changePct={s.changePct} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}