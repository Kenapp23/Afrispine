'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  RefreshCw,
  Check,
  X,
  Zap,
  Crown,
  Loader2,
} from 'lucide-react';

interface RateData {
  corridor: string;
  sendCurrency: string;
  receiveCurrency: string;
  rate: number;
  fee: number;
  estimatedDelivery: string;
}

const defaultRates: RateData[] = [
  { corridor: 'United Kingdom → Kenya', sendCurrency: 'GBP', receiveCurrency: 'KES', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
  { corridor: 'United States → Kenya', sendCurrency: 'USD', receiveCurrency: 'KES', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
  { corridor: 'United Kingdom → Nigeria', sendCurrency: 'GBP', receiveCurrency: 'NGN', rate: 0, fee: 0, estimatedDelivery: '1-2 hours' },
  { corridor: 'United Kingdom → Ghana', sendCurrency: 'GBP', receiveCurrency: 'GHS', rate: 0, fee: 0, estimatedDelivery: 'Minutes' },
];

const fallbackRates: RateData[] = [
  { corridor: 'United Kingdom → Kenya', sendCurrency: 'GBP', receiveCurrency: 'KES', rate: 193.42, fee: 2.99, estimatedDelivery: 'Minutes' },
  { corridor: 'United States → Kenya', sendCurrency: 'USD', receiveCurrency: 'KES', rate: 153.78, fee: 3.99, estimatedDelivery: 'Minutes' },
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

export function PricingPage() {
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
        // Fallback
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
      {/* ── Live Rates Section ── */}
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

      {/* ── Pricing Tiers ── */}
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
                <span className="text-4xl font-bold text-gray-900">£4.99</span>
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

      {/* ── Feature Comparison Table ── */}
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

      <p className="text-center text-xs text-muted-foreground">
        Rates are indicative and may vary at the time of transaction. Final rate
        and fees are confirmed before you pay. Pro subscription is billed
        monthly and can be cancelled at any time.
      </p>
    </div>
  );
}