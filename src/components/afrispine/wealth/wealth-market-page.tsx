'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Search,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { EXCHANGES, type StockQuote, type ExchangeInfo } from '@/lib/wealth-data';

/* ── Types ───────────────────────────────────────────────────── */

interface StockRow {
  ticker: string;
  company: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
  high52w: number;
  low52w: number;
  sector: string;
}

interface ExchangeData {
  name: string;
  index: string;
  change: string;
  changePct: string;
  currency: string;
  stocks: StockRow[];
}

/* ── Helpers ─────────────────────────────────────────────────── */

function countryToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
    .join('');
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
  return vol.toLocaleString();
}

function mapQuoteToRow(q: StockQuote): StockRow {
  return {
    ticker: q.ticker,
    company: q.name,
    price: q.price,
    change: q.change,
    changePct: q.changePct,
    volume: formatVolume(q.volume),
    marketCap: q.marketCap,
    high52w: q.week52High,
    low52w: q.week52Low,
    sector: q.sector,
  };
}

/* ── Loading skeleton ─────────────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-40 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────── */

export function WealthMarketPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const exchangeId = viewParams.exchange || '';

  const [search, setSearch] = React.useState('');
  const [activeSector, setActiveSector] = React.useState('All');
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ExchangeData | null>(null);

  React.useEffect(() => {
    if (!exchangeId) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/wealth/prices/${exchangeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Exchange "${exchangeId}" not found`);
        return res.json() as Promise<{ exchange: ExchangeInfo; stocks: StockQuote[] }>;
      })
      .then(({ exchange, stocks }) => {
        if (cancelled) return;
        const isUp = exchange.indexChangePct >= 0;
        setData({
          name: exchange.name,
          index: exchange.indexValue.toLocaleString(),
          change: `${isUp ? '+' : ''}${exchange.indexChange.toLocaleString()}`,
          changePct: `${isUp ? '+' : ''}${exchange.indexChangePct.toFixed(2)}%`,
          currency: exchange.currency,
          stocks: stocks.map(mapQuoteToRow),
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exchangeId]);

  // Derive sectors from fetched data
  const allSectors = React.useMemo(() => {
    const sectors = new Set(data?.stocks.map((s) => s.sector) ?? []);
    return ['All', ...Array.from(sectors).sort()];
  }, [data]);

  // Reset sector when data changes
  React.useEffect(() => {
    setActiveSector('All');
  }, [exchangeId]);

  // If no exchange param, show exchange overview grid
  if (!exchangeId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('wealth-landing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">African Stock Exchanges</h1>
            <p className="text-sm text-muted-foreground">Select an exchange to view listed companies</p>
          </div>
        </div>

        {/* Exchange Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXCHANGES.map((ex) => {
            const changeStr = `${ex.indexChangePct >= 0 ? '+' : ''}${ex.indexChangePct.toFixed(2)}%`;
            const isUp = ex.indexChangePct >= 0;
            return (
              <Card
                key={ex.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
                onClick={() => navigate('wealth-market', { exchange: ex.id })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                      {countryToFlag(ex.flag)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ex.name}</h3>
                      <p className="text-xs text-muted-foreground">Market cap: {ex.marketCapUsd}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Index</p>
                      <p className="text-lg font-bold text-gray-900">{ex.indexValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">2025 Return</p>
                      <p className={`text-lg font-bold ${ex.return2025.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                        {ex.return2025}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                      {changeStr} today
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Risk disclaimer */}
        <div className="flex gap-3 text-sm text-muted-foreground pt-4 border-t">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <p className="leading-relaxed">
            Investing in African stock markets carries risk including possible loss of principal. Past performance is not indicative of future results.
            All data is delayed by at least 15 minutes. AfriSpine acts as an intermediary and does not provide investment advice.
          </p>
        </div>
      </div>
    );
  }

  const filteredStocks = (data?.stocks || []).filter((s) => {
    const matchesSearch =
      !search ||
      s.ticker.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase());
    const matchesSector = activeSector === 'All' || s.sector === activeSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Back + Exchange header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('wealth-market')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                data?.name || exchangeId.toUpperCase()
              )}
            </h1>
            {!loading && data && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-semibold text-gray-900">{data.index}</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${data.changePct.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                  {data.changePct.startsWith('-') ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  {data.change} ({data.changePct})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stocks by name or ticker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sector tabs */}
      <Tabs value={activeSector} onValueChange={setActiveSector}>
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <TabsList className="w-fit">
            {allSectors.map((sector) => (
              <TabsTrigger key={sector} value={sector} className="text-xs sm:text-sm">
                {sector}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={activeSector} className="mt-0">
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <TableSkeleton />
              </CardContent>
            </Card>
          ) : filteredStocks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-muted-foreground">No stocks match your search or filter.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Ticker</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Company</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Price</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Change</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Change %</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Volume</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Mkt Cap</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">52W High</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">52W Low</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock) => {
                      const isUp = stock.changePct >= 0;
                      return (
                        <tr
                          key={stock.ticker}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate('wealth-stock', { ticker: stock.ticker, exchange: exchangeId })}
                        >
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-mono text-xs">
                              {stock.ticker}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{stock.company}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{stock.price.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isUp ? '+' : ''}{stock.change.toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isUp ? '+' : ''}{stock.changePct.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground font-mono">{stock.volume}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs">{stock.marketCap}</td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">{stock.high52w.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">{stock.low52w.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('wealth-buy', { ticker: stock.ticker });
                              }}
                            >
                              Buy
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Risk disclaimer */}
      <div className="flex gap-3 text-sm text-muted-foreground pt-4 border-t">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <p className="leading-relaxed">
          Investing in African stock markets carries risk including possible loss of principal. Past performance is not indicative of future results.
          All data is delayed by at least 15 minutes. AfriSpine acts as an intermediary and does not provide investment advice.
        </p>
      </div>
    </div>
  );
}