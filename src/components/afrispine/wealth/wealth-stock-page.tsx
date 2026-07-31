'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Building2,
  BarChart3,
  DollarSign,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────── */

interface StockDetail {
  ticker: string;
  company: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: string;
  marketCap: string;
  pe: number;
  divYield: number;
  high52w: number;
  low52w: number;
  sector: string;
  description: string;
  chartData: number[];
}

/* ── SVG chart helper ─────────────────────────────────────────── */

function MiniChart({ data, isUp }: { data: number[]; isUp: boolean }) {
  if (!data.length) return null;
  const w = 600;
  const h = 180;
  const padding = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (w - padding * 2) / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = padding + i * stepX;
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,${h - padding} ${points} ${w - padding},${h - padding}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 sm:h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isUp ? '#059669' : '#dc2626'} stopOpacity="0.2" />
          <stop offset="100%" stopColor={isUp ? '#059669' : '#dc2626'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#chartGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#059669' : '#dc2626'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {(() => {
        const lastX = padding + (data.length - 1) * stepX;
        const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2);
        return <circle cx={lastX} cy={lastY} r="4" fill={isUp ? '#059669' : '#dc2626'} />;
      })()}
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────────── */

export function WealthStockPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const ticker = (viewParams.ticker || '').toUpperCase();

  const [loading, setLoading] = React.useState(true);
  const [stock, setStock] = React.useState<StockDetail | null>(null);
  const [watchlisted, setWatchlisted] = React.useState(false);
  const [watchlistLoading, setWatchlistLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Fetch stock data from API
  React.useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/wealth/stock/${encodeURIComponent(ticker)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Stock not found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const q = data.stock;
        const hist = data.history || [];
        const prevClose = q.price / (1 + (q.changePct || 0) / 100);
        const mapped: StockDetail = {
          ticker: q.ticker,
          company: q.name,
          exchange: q.exchange,
          currency: q.exchange === 'NGX' ? 'NGN' : q.exchange === 'NSE' ? 'KES' : q.exchange === 'GSE' ? 'GHS' : q.exchange === 'JSE' ? 'ZAR' : q.exchange === 'EGX' ? 'EGP' : 'XOF',
          price: q.price,
          change: q.change,
          changePct: q.changePct,
          open: prevClose,
          high: q.week52High,
          low: q.week52Low,
          prevClose,
          volume: q.volume >= 1e6 ? `${(q.volume / 1e6).toFixed(1)}M` : q.volume >= 1e3 ? `${(q.volume / 1e3).toFixed(0)}K` : String(q.volume),
          marketCap: q.marketCap || '—',
          pe: q.peRatio ?? 0,
          divYield: q.dividendYield ?? 0,
          high52w: q.week52High,
          low52w: q.week52Low,
          sector: q.sector || '—',
          description: q.description || `${q.name} is listed on the ${q.exchange}.`,
          chartData: hist.map((h: { price: number }) => h.price),
        };
        setStock(mapped);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [ticker]);

  // Check if watchlisted on load
  React.useEffect(() => {
    if (!ticker) return;
    fetch('/api/wealth/watchlist')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const items = data.items || data || [];
        setWatchlisted(Array.isArray(items) && items.some((w: any) => w.ticker === ticker));
      })
      .catch(() => {});
  }, [ticker]);

  // Toggle watchlist
  const toggleWatchlist = async () => {
    if (!stock || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      if (watchlisted) {
        await fetch('/api/wealth/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: stock.ticker, exchange: stock.exchange }),
        });
        setWatchlisted(false);
      } else {
        await fetch('/api/wealth/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: stock.ticker, exchange: stock.exchange }),
        });
        setWatchlisted(true);
      }
    } catch {
      // silently fail
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (!ticker) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('wealth-market')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to markets
        </Button>
        <p className="text-muted-foreground">No stock selected.</p>
      </div>
    );
  }

  const isUp = (stock?.changePct ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('wealth-market')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {loading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{stock?.company}</h1>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-xs">
                {stock?.ticker}
              </Badge>
              <Badge variant="outline" className="text-xs">{stock?.exchange}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{stock?.sector}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('wealth-market')}
            >
              Browse all markets
            </Button>
          </CardContent>
        </Card>
      ) : stock ? (
        <>
          {/* Price header + actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                  {stock.currency} {stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-lg font-semibold flex items-center gap-1 ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isUp ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                <span>Open: {stock.currency} {stock.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>High: {stock.currency} {stock.high.toLocaleString()}</span>
                <span>Low: {stock.currency} {stock.low.toLocaleString()}</span>
                <span>Prev: {stock.currency} {stock.prevClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={watchlisted ? 'secondary' : 'outline'}
                className={watchlisted ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'border-gray-200'}
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
              >
                <Star className={`mr-2 h-4 w-4 ${watchlisted ? 'fill-amber-500 text-amber-500' : ''}`} />
                {watchlisted ? 'Watchlisted' : 'Watchlist'}
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => navigate('wealth-buy', { ticker: stock.ticker })}
              >
                Place order
              </Button>
            </div>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">12-Month Price History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MiniChart data={stock.chartData} isUp={isUp} />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                <span>Jan 2025</span>
                <span>Jun 2025</span>
                <span>Dec 2025</span>
              </div>
            </CardContent>
          </Card>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Market Cap', value: stock.marketCap, icon: Building2, color: 'bg-emerald-100 text-emerald-600' },
              { label: 'P/E Ratio', value: stock.pe ? stock.pe.toFixed(1) + 'x' : 'N/A', icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
              { label: 'Dividend Yield', value: stock.divYield ? stock.divYield.toFixed(1) + '%' : 'N/A', icon: Percent, color: 'bg-amber-100 text-amber-600' },
              { label: '52W High', value: stock.currency + ' ' + stock.high52w.toLocaleString(), icon: ArrowUpRight, color: 'bg-emerald-100 text-emerald-600' },
              { label: '52W Low', value: stock.currency + ' ' + stock.low52w.toLocaleString(), icon: ArrowDownRight, color: 'bg-red-100 text-red-600' },
              { label: 'Volume', value: stock.volume, icon: Activity, color: 'bg-purple-100 text-purple-600' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">About {stock.company}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">{stock.exchange}</Badge>
                <Badge variant="secondary">{stock.sector}</Badge>
                <Badge variant="secondary">{stock.currency}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{stock.description}</p>
            </CardContent>
          </Card>

          {/* Actions (mobile) */}
          <div className="flex gap-3 sm:hidden">
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => navigate('wealth-buy', { ticker: stock.ticker })}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Place order
            </Button>
            <PartnerDisclosure variant="card" className="col-span-full" />
          </div>

          {/* Risk disclaimer */}
          <div className="flex gap-3 text-sm text-muted-foreground pt-4 border-t">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">
              Investing in African stock markets carries risk including possible loss of principal. Past performance is not indicative of future results.
              All data is delayed by at least 15 minutes. AfriSpine acts as an intermediary and does not provide investment advice.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}