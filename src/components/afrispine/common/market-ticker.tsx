'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';

interface MoverItem {
  ticker: string;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
}

const EXCHANGE_LABELS: Record<string, string> = {
  NGX: 'NG',
  NSE: 'KE',
  JSE: 'ZA',
  GSE: 'GH',
  EGX: 'EG',
  BRVM: 'BRVM',
};

const EXCHANGE_CURRENCIES: Record<string, string> = {
  NGX: '₦',
  NSE: 'KSh',
  JSE: 'R',
  GSE: '₵',
  EGX: 'E£',
  BRVM: 'CFA',
};

// Hardcoded fallback data — always renders even if API is down
const FALLBACK_MOVERS: MoverItem[] = [
  { ticker: 'SCOM', exchange: 'NSE', price: 40.50, change: 0.25, changePct: 0.62 },
  { ticker: 'DANGCEM', exchange: 'NGX', price: 8500, change: 270, changePct: 3.28 },
  { ticker: 'NPN', exchange: 'JSE', price: 1285, change: 26.50, changePct: 2.11 },
  { ticker: 'MTNGH', exchange: 'GSE', price: 0.95, change: 0.014, changePct: 1.50 },
  { ticker: 'MTN', exchange: 'JSE', price: 188, change: 1.50, changePct: 0.80 },
  { ticker: 'ZENITHBANK', exchange: 'NGX', price: 42.30, change: 0.80, changePct: 1.93 },
  { ticker: 'EQTY', exchange: 'NSE', price: 48.00, change: 0.80, changePct: 1.69 },
  { ticker: 'SBK', exchange: 'JSE', price: 215, change: 2.80, changePct: 1.32 },
  { ticker: 'MTNN', exchange: 'NGX', price: 280.50, change: 3.10, changePct: 1.12 },
  { ticker: 'CAL', exchange: 'GSE', price: 3.20, change: 0.08, changePct: 2.56 },
];

function formatPrice(price: number, exchange: string): string {
  const currency = EXCHANGE_CURRENCIES[exchange] || '';
  if (price >= 1000) return `${currency}${price.toLocaleString('en', { maximumFractionDigits: 0 })}`;
  if (price >= 10) return `${currency}${price.toFixed(2)}`;
  return `${currency}${price.toFixed(3)}`;
}

function formatChange(changePct: number): string {
  const sign = changePct >= 0 ? '+' : '';
  return `${sign}${changePct.toFixed(2)}%`;
}

function TickerItem({ item, onClick }: { item: MoverItem; onClick: () => void }) {
  const label = EXCHANGE_LABELS[item.exchange] || item.exchange;
  const isPositive = item.changePct >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 cursor-pointer hover:bg-white/10 rounded-md transition-colors group"
    >
      <span className="flex items-center justify-center h-5 min-w-[28px] rounded bg-white/15 px-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-white font-semibold text-sm">{item.ticker}</span>
      <span className="text-white/70 text-xs tabular-nums">{formatPrice(item.price, item.exchange)}</span>
      <span className={`${colorClass} text-xs font-semibold tabular-nums flex items-center gap-0.5`}>
        {arrow} {formatChange(item.changePct)}
      </span>
    </button>
  );
}

export default function MarketTicker() {
  const [movers, setMovers] = useState<MoverItem[]>(FALLBACK_MOVERS);
  const [live, setLive] = useState(false);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/wealth/prices/movers?type=all&limit=10');
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.movers && data.movers.length > 0) {
          setMovers(data.movers);
          setLive(true);
        }
      } catch (e) {
        // Keep showing fallback data — ticker always visible
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Always render — never returns null
  const items = [...movers, ...movers];

  return (
    <div className="w-full bg-emerald-900 overflow-hidden" role="marquee" aria-label="Live market ticker">
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-emerald-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-emerald-900 to-transparent z-10 pointer-events-none" />

        {/* Powered by badge - left side */}
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 bg-emerald-900">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              {live ? '● Live' : '◈ Markets'}
            </span>
            <span className="text-[10px] text-white/40">|</span>
            <span className="text-[10px] text-white/50">Mystocks Africa</span>
          </div>
        </div>

        {/* Scrolling ticker items */}
        <div className="animate-ticker-scroll flex w-max">
          {items.map((item, i) => (
            <TickerItem
              key={`${item.ticker}-${i}`}
              item={item}
              onClick={() => navigate('wealth-stock', { ticker: item.ticker })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}