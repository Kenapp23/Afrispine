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

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 whitespace-nowrap px-5 py-1.5 cursor-pointer hover:bg-white/10 rounded-md transition-colors group"
    >
      <span className="flex items-center justify-center h-6 min-w-[32px] rounded bg-white/20 px-2 text-xs font-bold text-white uppercase tracking-wider group-hover:bg-white/30 transition-colors">
        {label}
      </span>
      <span className="text-white font-semibold text-sm">{item.ticker}</span>
      <span className="text-white/60 text-sm">{formatPrice(item.price, item.exchange)}</span>
      <span className={`${colorClass} font-semibold text-sm`}>{formatChange(item.changePct)}</span>
    </button>
  );
}

export default function MarketTicker() {
  const [movers, setMovers] = useState<MoverItem[]>([]);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/wealth/prices/movers?type=all&limit=10');
        const data = await res.json();
        if (active) setMovers(data.movers || []);
      } catch { /* silently fail */ }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (movers.length === 0) return null;

  const items = [...movers, ...movers];

  return (
    <div className="w-full bg-emerald-900 overflow-hidden py-1.5" role="marquee" aria-label="Live market ticker">
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
  );
}