'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  RefreshCw,
  Check,
  X,
  Zap,
  Crown,
  Loader2,
  Shield,
  TrendingUp,
  Building2,
  ArrowRight,
  Clock,
  Banknote,
} from 'lucide-react';
import { useAppStore, ViewName } from '@/stores/app';

interface RateData {
  corridor: string;
  sendCurrency: string;
  receiveCurrency: string;
  rate: number;
  fee: number;
  estimatedDelivery: string;
}

const defaultRates: RateData[] = [
  { corridor: 'United States → Kenya', sendCurrency: 'USD', receiveCurrency: 'KES', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
  { corridor: 'United Kingdom → Kenya', sendCurrency: 'GBP', receiveCurrency: 'KES', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
  { corridor: 'United Kingdom → Nigeria', sendCurrency: 'GBP', receiveCurrency: 'NGN', rate: 0, fee: 0, estimatedDelivery: '1-2 hours' },
  { corridor: 'United Kingdom → Ghana', sendCurrency: 'GBP', receiveCurrency: 'GHS', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
];

const fallbackRates: RateData[] = [
  { corridor: 'United States → Kenya', sendCurrency: 'USD', receiveCurrency: 'KES', rate: 153.78, fee: 3.99, estimatedDelivery: 'Minutes' },
  { corridor: 'United Kingdom → Kenya', sendCurrency: 'GBP', receiveCurrency: 'KES', rate: 193.42, fee: 2.99, estimatedDelivery: 'Minutes' },
  { corridor: 'United Kingdom → Nigeria', sendCurrency: 'GBP', receiveCurrency: 'NGN', rate: 1987.5, fee: 2.49, estimatedDelivery: '1-2 hours' },
  { corridor: 'United Kingdom → Ghana', sendCurrency: 'GBP', receiveCurrency: 'GHS', rate: 15.32, fee: 2.99, estimatedDelivery: 'Minutes' },
];

const features = [
  { name: 'Transfer fee', standard: '1.5%', pro: '0.75%' },
  { name: 'Rate lock duration', standard: '15 minutes', pro: '30 minutes' },
  { name: 'Priority routing', standard: false, pro: true },
  { name: 'FX rate alerts', standard: false, pro: true },
  { name: 'Scheduled / recurring sends', standard: false, pro: true },
  { name: 'Group sends', standard: false, pro: true },
  { name: 'Airtime top-up', standard: true, pro: true },
  { name: 'Bill payments', standard: true, pro: true },
  { name: 'Basic support', standard: true, pro: true },
  { name: 'Priority support', standard: false, pro: true },
];

/* ── Competitor Comparison Data ── */
interface CompetitorRow {
  provider: string;
  feePct: string;
  speed: string;
  hiddenFees: string;
  fxMargin: string;
  mobileMoney: boolean;
  isHighlight?: boolean;
}

const competitorData: CompetitorRow[] = [
  {
    provider: 'AfriSpine',
    feePct: '1.5%',
    speed: 'Minutes',
    hiddenFees: 'None',
    fxMargin: '< 0.5%',
    mobileMoney: true,
    isHighlight: true,
  },
  {
    provider: 'Western Union',
    feePct: '3–8%',
    speed: 'Minutes–Hours',
    hiddenFees: 'FX markup',
    fxMargin: '3–5%',
    mobileMoney: true,
  },
  {
    provider: 'WorldRemit',
    feePct: '2–6%',
    speed: 'Minutes',
    hiddenFees: 'FX markup',
    fxMargin: '2–4%',
    mobileMoney: true,
  },
  {
    provider: 'Remitly',
    feePct: '1.5–4%',
    speed: 'Minutes–Hours',
    hiddenFees: 'FX markup',
    fxMargin: '1.5–3%',
    mobileMoney: true,
  },
];

export function PricingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [rates, setRates] = useState<RateData[]>(defaultRates);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fx');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRates(data);
        } else {
          setRates(fallbackRates);
        }
      } else {
        setRates(fallbackRates);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      toast.error('Could not fetch rates, showing indicative rates');
      setRates(fallbackRates);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.plan === 'pro') {
          setIsPro(true);
        }
      }
    } catch {
      // not subscribed
    }
  }, []);

  useEffect(() => {
    fetchRates();
    checkSubscription();
  }, [fetchRates, checkSubscription]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/subscription', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.access_code) {
          const win = (window as unknown as { PaystackPop: { setup: (c: Record<string, unknown>) => { openIframe: () => void } } }).PaystackPop;
          if (win) {
            win.setup({
              key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || '',
              access_code: data.access_code,
              onClose: () => {
                toast.info('Payment window closed');
                setSubscribing(false);
              },
              callback: () => {
                setIsPro(true);
                setSubscribing(false);
                toast.success('Welcome to AfriSpine Pro!');
              },
            }).openIframe();
            return;
          }
        }
        setIsPro(true);
        setSubscribing(false);
        toast.success('Welcome to AfriSpine Pro!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Subscription failed');
        setSubscribing(false);
      }
    } catch {
      toast.error('Network error, please try again');
      setSubscribing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-16">
      {/* ═══════════════════════════════════════════
          Live Rates Section
      ═══════════════════════════════════════════ */}
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Live rates
          </h1>
          <p className="mt-2 text-muted-foreground">
            Indicative exchange rates and fees for popular corridors
          </p>
          {lastUpdated && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Updated {lastUpdated}</span>
              <button
                onClick={fetchRates}
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            : rates.map((r, i) => (
                <Card key={i} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {r.corridor}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {r.estimatedDelivery}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-600">
                        1 {r.sendCurrency}
                      </span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {r.rate.toFixed(2)} {r.receiveCurrency}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Transfer fee: {r.fee.toFixed(2)} {r.sendCurrency}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Competitor Comparison Table
      ═══════════════════════════════════════════ */}
      <div>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            How AfriSpine compares
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            We put our pricing head-to-head with the biggest names in remittances.
            See why 10,000+ senders switched to AfriSpine.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-900">
                      Provider
                    </th>
                    <th className="text-center py-3.5 px-3 font-semibold text-gray-900">
                      Fee
                    </th>
                    <th className="text-center py-3.5 px-3 font-semibold text-gray-900">
                      Speed
                    </th>
                    <th className="text-center py-3.5 px-3 font-semibold text-gray-900">
                      Hidden Fees
                    </th>
                    <th className="text-center py-3.5 px-3 font-semibold text-gray-900">
                      FX Margin
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-gray-900">
                      Mobile Money
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorData.map((row, idx) => (
                    <tr
                      key={row.provider}
                      className={
                        row.isHighlight
                          ? 'bg-emerald-50 border-b border-emerald-100'
                          : idx < competitorData.length - 1
                            ? 'border-b border-border/50'
                            : ''
                      }
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {row.isHighlight && (
                            <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 border-0">
                              Best
                            </Badge>
                          )}
                          <span className={row.isHighlight ? 'font-bold text-emerald-700' : 'font-medium text-gray-700'}>
                            {row.provider}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={row.isHighlight ? 'font-bold text-emerald-700' : 'text-gray-700'}>
                          {row.feePct}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-700">
                        {row.speed}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {row.isHighlight ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                            {row.hiddenFees}
                          </span>
                        ) : (
                          <span className="text-amber-600">{row.hiddenFees}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={row.isHighlight ? 'font-bold text-emerald-700' : 'text-gray-700'}>
                          {row.fxMargin}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.mobileMoney ? (
                          <Check className="inline h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="inline h-4 w-4 text-muted-foreground/40" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Comparison based on publicly available pricing for UK → Kenya corridor as of 2025.
          Actual rates may vary by corridor and amount.
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          Exchange Rate Guarantee
      ═══════════════════════════════════════════ */}
      <div className="bg-emerald-50 rounded-2xl p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              Exchange Rate Guarantee
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you start a transfer on AfriSpine, we lock your exchange rate for{' '}
              <strong className="text-gray-900">15 minutes</strong> (30 minutes for Pro members).
              The rate you see is the rate you get — no last-minute markups, no surprises at checkout.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If the market moves in your favour during the lock window, we&apos;ll pass the
              better rate on to you. If it moves against us, we absorb the difference.
              That&apos;s our guarantee.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                'Rate locked the moment you enter your amount',
                'No hidden FX spread added at the payment step',
                'Pro members get 30-minute locks for peace of mind',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Pricing Tiers
      ═══════════════════════════════════════════ */}
      <div>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that fits your transfer needs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Standard */}
          <Card className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    AfriSpine Standard
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Free forever</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold text-gray-900">Free</span>
                <span className="ml-2 text-muted-foreground">No monthly fee</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  1.5% transfer fee
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  15-minute rate locks
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Airtime top-up
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Bill payments
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Basic support
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  Priority routing
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  Rate alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  Scheduled sends
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                disabled={true}
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="relative border-emerald-300 ring-2 ring-emerald-100">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-gray-900">
                      AfriSpine Pro
                    </CardTitle>
                    {isPro && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For frequent senders
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold text-gray-900">$4.99</span>
                <span className="ml-2 text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <strong>0.75%</strong> transfer fee (half price)
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <strong>30-minute</strong> rate locks
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Priority routing
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  FX rate alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Scheduled &amp; recurring sends
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Group sends
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Airtime top-up
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Priority support
                </li>
              </ul>
              {isPro ? (
                <Button
                  className="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default"
                  disabled={true}
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe to Pro'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Feature Comparison Table
      ═══════════════════════════════════════════ */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          Compare plans
        </h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Feature
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">
                      Standard
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-emerald-700 w-32">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr
                      key={f.name}
                      className={
                        i < features.length - 1
                          ? 'border-b border-border/50'
                          : ''
                      }
                    >
                      <td className="py-3 px-4 text-gray-700">{f.name}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof f.standard === 'boolean' ? (
                          f.standard ? (
                            <Check className="inline h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="inline h-4 w-4 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="font-medium">{f.standard}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof f.pro === 'boolean' ? (
                          f.pro ? (
                            <Check className="inline h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="inline h-4 w-4 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="font-semibold text-emerald-700">
                            {f.pro}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════
          Business FX Section
      ═══════════════════════════════════════════ */}
      <div className="bg-gray-50 rounded-2xl p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Business FX — Corporate Rates
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                For businesses transferring $5,000+ per transaction
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Banknote className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Volume Tier</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">$5,000+</p>
                <p className="text-sm text-muted-foreground">per transfer</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">FX Margin</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0.5–1%</p>
                <p className="text-sm text-muted-foreground">vs 3–5% at banks</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Settlement</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">Same Day</p>
                <p className="text-sm text-muted-foreground">T+0 for major corridors</p>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                'Dedicated account manager and priority support',
                'Custom rate quotes for large volumes (>$50,000)',
                'Bulk payment APIs for payroll and supplier payments',
                'Monthly settlement reports and audit trail',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate('business')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Get a Business FX quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        Rates are indicative and may vary at the time of transaction. Final rate
        and fees are confirmed before you pay. Pro subscription is billed
        monthly and can be cancelled at any time.
      </p>
    </div>
  );
}
