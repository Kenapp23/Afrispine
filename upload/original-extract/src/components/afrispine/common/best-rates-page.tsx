'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = 'https://open.er-api.com/v6/latest/USD';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const FEE_MULTIPLIER = 0.985; // 1.5% fee deducted

interface Corridor {
  from: string;
  to: string;
  label: string;
  sendCountry: string;
  receiveCountry: string;
}

const CORRIDORS: Corridor[] = [
  { from: 'GBP', to: 'KES', label: 'GBP → KES', sendCountry: 'GB', receiveCountry: 'KE' },
  { from: 'GBP', to: 'NGN', label: 'GBP → NGN', sendCountry: 'GB', receiveCountry: 'NG' },
  { from: 'GBP', to: 'GHS', label: 'GBP → GHS', sendCountry: 'GB', receiveCountry: 'GH' },
  { from: 'USD', to: 'KES', label: 'USD → KES', sendCountry: 'US', receiveCountry: 'KE' },
  { from: 'USD', to: 'NGN', label: 'USD → NGN', sendCountry: 'US', receiveCountry: 'NG' },
  { from: 'USD', to: 'GHS', label: 'USD → GHS', sendCountry: 'US', receiveCountry: 'GH' },
  { from: 'CAD', to: 'KES', label: 'CAD → KES', sendCountry: 'CA', receiveCountry: 'KE' },
  { from: 'CAD', to: 'NGN', label: 'CAD → NGN', sendCountry: 'CA', receiveCountry: 'NG' },
  { from: 'CAD', to: 'GHS', label: 'CAD → GHS', sendCountry: 'CA', receiveCountry: 'GH' },
];

function formatRate(rate: number, currency: string): string {
  if (currency === 'NGN') return rate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (currency === 'KES') return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function BestRatesPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (data.result !== 'success') throw new Error('API returned unsuccessful result');
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const getMidMarket = (from: string, to: string): number | null => {
    if (!rates) return null;
    // rates are all per 1 USD
    if (from === 'USD') return rates[to] ?? null;
    // For GBP: USD/rates.GBP gives GBP→USD, then multiply by rates.to
    if (rates[from]) {
      const crossToUsd = 1 / rates[from];
      return crossToUsd * (rates[to] ?? 0);
    }
    return null;
  };

  const handleSendNow = (corridor: Corridor) => {
    navigate('send', {
      from: corridor.sendCountry,
      to: corridor.receiveCountry,
      sendCurrency: corridor.from,
      receiveCurrency: corridor.to,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Best Rates — Live AfriSpine Exchange Rates
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rates are live, updated every 5 minutes. Your rate is locked for 15 minutes when you start a transfer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Live FX Rates
              </CardTitle>
              <CardDescription className="mt-1">
                {lastUpdated
                  ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                  : 'Loading rates…'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchRates(); }}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Unable to load rates</p>
              <p>{error}. Please try again in a moment.</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corridor</TableHead>
                <TableHead className="text-right">Our Rate</TableHead>
                <TableHead className="text-right">Mid-Market</TableHead>
                <TableHead className="text-right">You Save</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !rates
                ? Array.from({ length: 9 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                : CORRIDORS.map((corridor) => {
                    const midMarket = getMidMarket(corridor.from, corridor.to);
                    if (midMarket === null) return null;
                    const ourRate = midMarket * FEE_MULTIPLIER;
                    const savings = ((midMarket - ourRate) / midMarket) * 100;

                    return (
                      <TableRow key={corridor.label}>
                        <TableCell className="font-medium">{corridor.label}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {formatRate(ourRate, corridor.to)} {corridor.to}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatRate(midMarket, corridor.to)} {corridor.to}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {savings.toFixed(2)}% fee
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNow(corridor)}
                            className="gap-1 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            Send now →
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {/* Disclosure */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            AfriSpine charges a 1.5% service fee. The rate shown includes our fee.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}