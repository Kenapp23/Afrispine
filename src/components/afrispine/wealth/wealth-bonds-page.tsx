'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  AlertTriangle,
  Loader2,
  Star,
  Building2,
  Percent,
  Calendar,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { WealthDisclaimer } from './wealth-disclaimer';

// ─── Types ──────────────────────────────────────────────────
interface Bond {
  id: string;
  name: string;
  country: 'KE' | 'NG' | 'GH';
  yield: number;
  tenor: string;
  minInvestment: number;
  currency: string;
  taxFree: boolean;
  interestFrequency: string;
  issuer: string;
  couponRate?: number;
  maturityDate?: string;
}

interface BondSubscribeState {
  bond: Bond | null;
  step: number;
  amount: string;
  accessCode: string | null;
  error: string | null;
  processing: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  KE: '🇰🇪',
  NG: '🇳🇬',
  GH: '🇬🇭',
};

const CURRENCY_MAP: Record<string, string> = {
  KE: 'KES',
  NG: 'NGN',
  GH: 'GHS',
};

// ─── Slide animation variants ──────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// ─── Comparison data ───────────────────────────────────────
const COMPARISON_ITEMS = [
  {
    label: 'UK Savings ISA',
    rate: '~4.5%',
    period: 'per year',
    currency: 'GBP',
    highlight: false,
  },
  {
    label: 'Kenya T-Bond',
    rate: '~13%',
    period: 'per year',
    currency: 'KES',
    highlight: false,
  },
  {
    label: 'Kenya Infra Bond',
    rate: '~14%',
    period: 'TAX FREE',
    currency: 'KES',
    highlight: true,
  },
];

// ─── Step labels for subscribe modal ───────────────────────
const SUBSCRIBE_STEPS = ['Review', 'Payment', 'Confirmation'];

// ─── Main Component ────────────────────────────────────────
export function WealthBondsPage() {
  const navigate = useAppStore((s) => s.navigate);

  // ── Bond list state ──
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Subscribe modal state ──
  const [subscribe, setSubscribe] = useState<BondSubscribeState>({
    bond: null,
    step: 1,
    amount: '',
    accessCode: null,
    error: null,
    processing: false,
  });
  const [modalDirection, setModalDirection] = useState(1);

  // ── Fetch bonds on mount ──
  useEffect(() => {
    let cancelled = false;

    async function fetchBonds() {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await fetch('/api/wealth/bonds');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setBonds(Array.isArray(data) ? data : data.bonds ?? []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setFetchError(err?.message ?? 'Failed to load bonds. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBonds();
    return () => { cancelled = true; };
  }, []);

  // ── Open subscribe modal ──
  const openSubscribe = useCallback((bond: Bond) => {
    setSubscribe({
      bond,
      step: 1,
      amount: '',
      accessCode: null,
      error: null,
      processing: false,
    });
    setModalDirection(1);
  }, []);

  // ── Close subscribe modal ──
  const closeSubscribe = useCallback(() => {
    setSubscribe((prev) => ({ ...prev, bond: null, step: 1, amount: '', accessCode: null, error: null, processing: false }));
  }, []);

  // ── Subscribe step navigation ──
  const goSubscribeNext = useCallback(() => {
    setModalDirection(1);
    setSubscribe((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }));
  }, []);

  const goSubscribeBack = useCallback(() => {
    setModalDirection(-1);
    setSubscribe((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  // ── Handle payment (Step 2) ──
  const handlePay = useCallback(async () => {
    if (!subscribe.bond) return;
    const numericAmount = parseFloat(subscribe.amount);
    if (!numericAmount || numericAmount <= 0) return;

    setSubscribe((prev) => ({ ...prev, processing: true, error: null }));

    try {
      const res = await fetch('/api/wealth/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId: subscribe.bond.id,
          amount: numericAmount,
          currency: 'USD',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Payment failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      // Store accessCode from payment response
      setSubscribe((prev) => ({
        ...prev,
        processing: false,
        accessCode: data.accessCode ?? null,
      }));
      goSubscribeNext();
    } catch (err: any) {
      setSubscribe((prev) => ({
        ...prev,
        processing: false,
        error: err?.message ?? 'Payment failed. Please try again.',
      }));
    }
  }, [subscribe.bond, subscribe.amount, goSubscribeNext]);

  // ── Format helpers ──
  function formatNumber(n: number, decimals = 0): string {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: Bond Card Skeleton
  // ─────────────────────────────────────────────────────────
  function renderBondSkeletons() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-9 w-full rounded-md mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: Empty State
  // ─────────────────────────────────────────────────────────
  function renderEmptyState() {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            No bonds are currently available. Please check back soon.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 mt-1"
          >
            <Loader2 className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: Error State
  // ─────────────────────────────────────────────────────────
  function renderErrorState() {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <p className="text-red-700 text-sm font-medium">Unable to load bonds</p>
          <p className="text-red-600/70 text-xs max-w-sm">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 mt-1 border-red-200 text-red-700 hover:bg-red-100"
          >
            <Loader2 className="h-3.5 w-3.5" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: Bond Card
  // ─────────────────────────────────────────────────────────
  function renderBondCard(bond: Bond) {
    return (
      <motion.div
        key={bond.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow group">
          <CardContent className="p-5 space-y-3">
            {/* Header row: flag + name + tax-free badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl leading-none shrink-0">
                  {COUNTRY_FLAGS[bond.country] ?? '🌍'}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                    {bond.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {bond.issuer}
                  </p>
                </div>
              </div>
              {bond.taxFree && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0 gap-1 text-[10px] font-bold px-1.5 py-0 h-5">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                  TAX FREE
                </Badge>
              )}
            </div>

            {/* Yield */}
            <div className="flex items-baseline gap-1.5">
              <Percent className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-2xl font-bold text-emerald-700">
                {bond.yield}%
              </span>
              <span className="text-xs text-muted-foreground">yield</span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Tenor: <span className="font-medium text-gray-700">{bond.tenor}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span>Min: <span className="font-medium text-gray-700">{bond.currency} {formatNumber(bond.minInvestment)}</span></span>
              </div>
              <div className="text-muted-foreground">
                Interest: <span className="font-medium text-gray-700">{bond.interestFrequency}</span>
              </div>
              <div className="text-muted-foreground">
                Currency: <span className="font-medium text-gray-700">{bond.currency}</span>
              </div>
            </div>

            {/* Subscribe button */}
            <Button
              onClick={() => openSubscribe(bond)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 mt-1 group-hover:bg-emerald-700 transition-colors"
              size="sm"
            >
              Subscribe
              <span className="text-emerald-200">→</span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER: Subscribe Modal
  // ─────────────────────────────────────────────────────────
  function renderSubscribeModal() {
    if (!subscribe.bond) return null;
    const bond = subscribe.bond;
    const numericAmount = parseFloat(subscribe.amount) || 0;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeSubscribe}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-lg bg-white sm:rounded-xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={closeSubscribe}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {SUBSCRIBE_STEPS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === subscribe.step;
                const isDone = stepNum < subscribe.step;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && (
                      <div
                        className={`h-px flex-1 transition-colors duration-300 ${
                          isDone ? 'bg-emerald-500' : 'bg-border'
                        }`}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isActive
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          isActive
                            ? 'text-emerald-700'
                            : isDone
                              ? 'text-emerald-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step content with animation */}
            <AnimatePresence mode="wait" custom={modalDirection}>
              <motion.div
                key={subscribe.step}
                custom={modalDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {/* ── STEP 1: Review Bond Details & Enter Amount ── */}
                {subscribe.step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Subscribe to Bond</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Review details and enter your investment amount.
                      </p>
                    </div>

                    {/* Bond details card */}
                    <Card className="border-emerald-200 bg-emerald-50/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{COUNTRY_FLAGS[bond.country]}</span>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{bond.name}</div>
                            <div className="text-xs text-muted-foreground">{bond.issuer}</div>
                          </div>
                          {bond.taxFree && (
                            <Badge className="ml-auto bg-amber-100 text-amber-800 border-amber-200 gap-1 text-[10px] font-bold px-1.5 py-0 h-5">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              TAX FREE
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground block">Yield</span>
                            <span className="font-bold text-emerald-700 text-lg">{bond.yield}%</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Tenor</span>
                            <span className="font-semibold text-gray-900">{bond.tenor}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Interest</span>
                            <span className="font-medium text-gray-700">{bond.interestFrequency}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Min Investment</span>
                            <span className="font-medium text-gray-700">
                              {bond.currency} {formatNumber(bond.minInvestment)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Amount input */}
                    <div className="space-y-2">
                      <Label htmlFor="bond-amount" className="text-sm font-medium text-gray-700">
                        Investment Amount (USD)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          $
                        </span>
                        <Input
                          id="bond-amount"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="1,000"
                          className="h-12 text-base rounded-lg border-emerald-200 focus-visible:ring-emerald-400 pl-8"
                          value={subscribe.amount}
                          onChange={(e) =>
                            setSubscribe((prev) => ({ ...prev, amount: e.target.value }))
                          }
                          autoFocus
                        />
                      </div>
                      {numericAmount > 0 && numericAmount < 100 && (
                        <p className="text-xs text-amber-600">
                          Minimum subscription is typically $100 USD.
                        </p>
                      )}
                    </div>

                    {/* Estimated annual return */}
                    {numericAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 p-4"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Est. annual interest</span>
                          <span className="font-bold text-emerald-700">
                            ${formatNumber(numericAmount * (bond.yield / 100), 2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Based on {bond.yield}% yield{bond.taxFree ? ' (tax-free)' : ''} on ${formatNumber(numericAmount, 0)} invested
                        </p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end pt-2 gap-3">
                      <Button variant="outline" onClick={closeSubscribe} className="gap-1.5">
                        Cancel
                      </Button>
                      <Button
                        onClick={goSubscribeNext}
                        disabled={numericAmount <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
                      >
                        Continue
                        <span className="text-emerald-200">→</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Payment ── */}
                {subscribe.step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Complete Payment</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Pay securely to subscribe.
                      </p>
                    </div>

                    {/* Error display */}
                    {subscribe.error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3"
                      >
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700">Payment failed</p>
                          <p className="text-xs text-red-600 mt-0.5">{subscribe.error}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Order summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                          Payment Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                          <span className="text-muted-foreground">Bond</span>
                          <span className="font-medium text-right">{bond.name}</span>

                          <span className="text-muted-foreground">Yield</span>
                          <span className="font-medium text-right text-emerald-700">{bond.yield}%{bond.taxFree ? ' (tax-free)' : ''}</span>

                          <span className="text-muted-foreground">Tenor</span>
                          <span className="font-medium text-right">{bond.tenor}</span>

                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold text-right text-gray-900">
                            ${formatNumber(numericAmount, 2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment notice */}
                    <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
                      <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You will be redirected to our payment processor to complete payment securely.
                        AfriSpine does not store your card details.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={goSubscribeBack} className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handlePay}
                        disabled={subscribe.processing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
                      >
                        {subscribe.processing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            Pay ${formatNumber(numericAmount, 2)} securely
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Confirmation ── */}
                {subscribe.step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-6 space-y-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </motion.div>

                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Subscription Confirmed!
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Your bond subscription has been placed successfully.
                      </p>
                    </div>

                    <Card className="max-w-xs w-full border-emerald-200">
                      <CardContent className="p-4 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bond</span>
                          <span className="font-medium">{bond.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold text-emerald-700">
                            ${formatNumber(numericAmount, 2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. annual interest</span>
                          <span className="font-medium">
                            ${formatNumber(numericAmount * (bond.yield / 100), 2)}
                          </span>
                        </div>
                        {subscribe.accessCode && (
                          <div className="pt-2 border-t border-border">
                            <span className="text-[11px] text-muted-foreground">Payment Ref</span>
                            <p className="font-mono text-xs text-gray-500 mt-0.5 truncate">
                              {subscribe.accessCode}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-xs">
                      <Button
                        variant="outline"
                        className="gap-1.5 flex-1"
                        onClick={() => navigate('wealth-portfolio')}
                      >
                        View portfolio
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1"
                        onClick={closeSubscribe}
                      >
                        Done
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* ── Back navigation ── */}
        <button
          onClick={() => navigate('wealth-landing')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Wealth
        </button>

        {/* ════════════════════════════════════════════════════
            SECTION 1: HEADER
        ════════════════════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                Fixed Income
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Earn 12–16% on African
              <span className="text-emerald-700"> government bonds</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed max-w-xl">
              Kenya Treasury Bonds · Nigeria FGN Bonds · Ghana Eurobonds · Tax-free infrastructure bonds
            </p>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 2: WHY CONSIDER BONDS
        ════════════════════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Why Consider Bonds?</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {COMPARISON_ITEMS.map((item) => (
                <Card
                  key={item.label}
                  className={`overflow-hidden transition-all ${
                    item.highlight
                      ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <CardContent className="p-5 text-center space-y-3">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <div>
                      <span
                        className={`text-3xl font-bold ${
                          item.highlight ? 'text-emerald-700' : 'text-gray-900'
                        }`}
                      >
                        {item.rate}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.period}</p>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${
                        item.highlight
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-100'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {item.currency}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              All figures are indicative. Bond yields change at each auction. Past rates do not
              guarantee future returns.
            </p>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 3: AVAILABLE BONDS
        ════════════════════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Available Bonds</h2>
              {!loading && !fetchError && bonds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {bonds.length} bond{bonds.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {loading && renderBondSkeletons()}
            {fetchError && !loading && renderErrorState()}
            {!loading && !fetchError && bonds.length === 0 && renderEmptyState()}
            {!loading && !fetchError && bonds.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bonds.map(renderBondCard)}
              </div>
            )}
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 4: RISK DISCLAIMER
        ════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800/80 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-900 text-sm">Risk Disclaimer</p>
              <p>
                Investing in bonds carries risk including possible loss of principal. Bond prices
                can go down as well as up. Past performance does not guarantee future returns.
                AfriSpine is not a licensed investment adviser. This is not investment advice.
                Exchange rates fluctuate and may affect the value of your investment when
                converted back to your home currency. Tax treatment of investment returns varies
                by country and individual circumstances. Consult a qualified financial adviser
                before investing.
              </p>
            </div>
          </div>
        </section>

        {/* Standard wealth disclaimer */}
        <WealthDisclaimer variant="general" className="pb-8" />
      </div>

      {/* ── Subscribe Modal ── */}
      <AnimatePresence>
        {subscribe.bond && renderSubscribeModal()}
      </AnimatePresence>
    </div>
  );
}