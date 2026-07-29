'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  BookmarkX,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  STOCKS,
  getStockByTicker,
  EXCHANGES,
  type StockQuote,
} from '@/lib/wealth-data';
import { WealthDisclaimer } from './wealth-disclaimer';

// ─── Types ─────────────────────────────────────────────────
interface WatchlistItem {
  ticker: string;
  exchange: string;
  addedPrice: number;
  addedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────
function getExchangeCurrency(exchangeId: string): string {
  const ex = EXCHANGES.find((e) => e.id === exchangeId);
  return ex?.currency ?? 'KES';
}

function getExchangeName(exchangeId: string): string {
  const ex = EXCHANGES.find((e) => e.id === exchangeId);
  return ex?.name ?? exchangeId;
}

function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// ─── Main component ────────────────────────────────────────
export function WealthWatchlistPage() {
  const navigate = useAppStore((s) => s.navigate);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  // All stocks flat
  const allStocks = useMemo(() => Object.values(STOCKS).flat(), []);

  // Fetch watchlist on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchWatchlist() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/wealth/watchlist');
        if (!res.ok) throw new Error('Failed to fetch watchlist');
        const data = await res.json();
        if (!cancelled) {
          setWatchlist(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load watchlist');
          // Fallback to empty state instead of breaking
          setWatchlist([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWatchlist();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enrich watchlist items with current stock data
  const enrichedItems = useMemo(() => {
    return watchlist
      .map((item) => {
        const stock = getStockByTicker(item.ticker);
        if (!stock) return null;
        const changePct =
          item.addedPrice > 0
            ? ((stock.price - item.addedPrice) / item.addedPrice) * 100
            : 0;
        return { ...item, stock, changePct };
      })
      .filter(Boolean) as (WatchlistItem & { stock: StockQuote; changePct: number })[];
  }, [watchlist]);

  // Search results for add dialog
  const addSearchResults = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return allStocks.slice(0, 8);
    return allStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.exchange.toLowerCase().includes(q),
    );
  }, [addSearch, allStocks]);

  // Filter out already watchlisted stocks
  const availableStocks = useMemo(() => {
    const tickers = new Set(watchlist.map((w) => w.ticker));
    return addSearchResults.filter((s) => !tickers.has(s.ticker));
  }, [addSearchResults, watchlist]);

  // Remove from watchlist
  const handleRemove = useCallback(async (ticker: string) => {
    setRemoveLoading(ticker);
    try {
      const res = await fetch('/api/wealth/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
    } catch {
      // Optimistic removal already handled silently in Phase 1
      setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
    } finally {
      setRemoveLoading(null);
    }
  }, []);

  // Add to watchlist
  const handleAdd = useCallback(
    async (stock: StockQuote) => {
      setAddLoading(true);
      try {
        const res = await fetch('/api/wealth/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: stock.ticker,
            exchange: stock.exchange,
            addedPrice: stock.price,
          }),
        });
        if (!res.ok) throw new Error('Failed to add');
        const data = await res.json();
        setWatchlist((prev) => [
          ...prev,
          {
            ticker: stock.ticker,
            exchange: stock.exchange,
            addedPrice: stock.price,
            addedAt: data.addedAt || new Date().toISOString(),
          },
        ]);
        setAddSearch('');
        setAddDialogOpen(false);
      } catch {
        // Optimistic add in Phase 1
        setWatchlist((prev) => [
          ...prev,
          {
            ticker: stock.ticker,
            exchange: stock.exchange,
            addedPrice: stock.price,
            addedAt: new Date().toISOString(),
          },
        ]);
        setAddSearch('');
        setAddDialogOpen(false);
      } finally {
        setAddLoading(false);
      }
    },
    [],
  );

  // ─── Empty state ─────────────────────────────────────────
  if (!loading && enrichedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <BookmarkX className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Watchlist
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Your watchlist is empty. Browse markets to add stocks you&apos;re
            interested in tracking.
          </p>
          <Button
            onClick={() => navigate('markets')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            Browse markets
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-12">
          <WealthDisclaimer variant="general" />
        </div>
      </div>
    );
  }

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // ─── Main view with table ────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="h-7 w-7 text-emerald-600" />
            My Watchlist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enrichedItems.length} stock{enrichedItems.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add stock</span>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Ticker
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Company
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                    Exchange
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Added Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Current
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Change
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {enrichedItems.map((item, idx) => {
                    const isPositive = item.changePct >= 0;
                    const currency = getExchangeCurrency(
                      Object.entries(STOCKS).find(([, stocks]) =>
                        stocks.some((s) => s.ticker === item.stock.ticker),
                      )?.[0] ?? 'nse',
                    );

                    return (
                      <motion.tr
                        key={item.ticker}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.04 }}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono font-semibold text-sm">
                          <button
                            onClick={() =>
                              navigate('markets', {
                                ticker: item.ticker,
                                exchange: item.exchange,
                              })
                            }
                            className="text-emerald-700 hover:underline"
                          >
                            {item.stock.ticker}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {item.stock.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.stock.exchange}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {currency} {formatNumber(item.addedPrice)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {currency} {formatNumber(item.stock.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? '+' : ''}
                            {item.changePct.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(item.ticker)}
                            disabled={removeLoading === item.ticker}
                          >
                            {removeLoading === item.ticker ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8">
        <WealthDisclaimer variant="general" />
      </div>

      {/* ─── Add Stock Dialog ─────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
            <DialogDescription>
              Search for a stock to start tracking its performance.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or ticker..."
              className="pl-10 h-11 border-emerald-200 focus-visible:ring-emerald-400"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {availableStocks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {addSearch
                  ? `No stocks found matching "${addSearch}"`
                  : 'All available stocks are already in your watchlist.'}
              </div>
            ) : (
              availableStocks.map((stock) => {
                const isPositive = stock.changePct >= 0;
                return (
                  <motion.button
                    key={`${stock.exchange}-${stock.ticker}`}
                    whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => handleAdd(stock)}
                    disabled={addLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {stock.name}
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          {stock.ticker}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {getExchangeName(
                          Object.entries(STOCKS).find(([, stocks]) =>
                            stocks.some((s) => s.ticker === stock.ticker),
                          )?.[0] ?? 'nse',
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          isPositive ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositive ? '+' : ''}
                        {stock.changePct.toFixed(2)}%
                      </div>
                      <Plus className="h-4 w-4 text-emerald-500" />
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}