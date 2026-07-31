'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app';
import { AchievementCard } from '@/components/afrispine/common/achievement-card';
import { Button } from '@/components/ui/button';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Wallet,
  Receipt,
  Clock,
  Shield,
  Info,
} from 'lucide-react';
import {
  STOCKS,
  getStockByTicker,
  calculateTradingFee,
  calculateFxMargin,
  generateOrderReference,
  EXCHANGES,
  type StockQuote,
} from '@/lib/wealth-data';
import { WealthDisclaimer } from './wealth-disclaimer';

// ─── FX rates (GBP → local currency) ───────────────────────
const FX_RATES: Record<string, number> = {
  KES: 169.3,
  NGN: 1950,
  ZAR: 23.5,
  GHS: 15.2,
  EGP: 63.5,
  XOF: 760,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: 'KES',
  NGN: 'NGN',
  ZAR: 'ZAR',
  GHS: 'GHS',
  EGP: 'EGP',
  XOF: 'XOF',
};

function getExchangeCurrency(exchangeId: string): string {
  const ex = EXCHANGES.find((e) => e.id === exchangeId);
  return ex?.currency ?? 'KES';
}

function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// ─── Slide animation variants ──────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// ─── Step indicator ────────────────────────────────────────
const STEPS = ['Choose Stock', 'Amount', 'Review & Pay', 'Confirmation'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={`hidden sm:block h-px flex-1 transition-colors duration-300 ${
                  isDone ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-medium hidden sm:block ${
                  isActive ? 'text-emerald-700' : isDone ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────
export function WealthBuyPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);

  // Pre-select stock from viewParams via lazy initializer (no effect needed)
  const [preselected] = useState(() => {
    const params = useAppStore.getState().viewParams;
    if (params?.ticker) {
      const stock = getStockByTicker(params.ticker);
      if (stock && (!params.exchange || stock.exchange === params.exchange)) {
        return { stock, step: 2 } as const;
      }
    }
    return { stock: null as StockQuote | null, step: 1 } as const;
  });

  const [step, setStep] = useState(preselected.step);
  const [direction, setDirection] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(preselected.stock);
  const [investMode, setInvestMode] = useState<'amount' | 'shares'>('amount');
  const [amountGbp, setAmountGbp] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    if (step === 4 && orderRef) {
      const timer = setTimeout(() => setShowAchievement(true), 800);
      return () => clearTimeout(timer);
    }
  }, [step, orderRef]);

  // All stocks flat list
  const allStocks = useMemo(() => Object.values(STOCKS).flat(), []);

  // Search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allStocks.slice(0, 12);
    return allStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.exchange.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q),
    );
  }, [searchQuery, allStocks]);

  // Calculated values for Step 2+
  const localCurrency = selectedStock
    ? getExchangeCurrency(
        Object.entries(STOCKS).find(([, stocks]) =>
          stocks.some((s) => s.ticker === selectedStock.ticker),
        )?.[0] ?? 'nse',
      )
    : 'KES';

  const fxRate = FX_RATES[localCurrency] ?? 150;

  const numericAmount = parseFloat(amountGbp) || 0;
  const numericShares = parseFloat(sharesInput) || 0;

  const estimatedShares = investMode === 'amount' && numericAmount > 0
    ? Math.floor((numericAmount * fxRate) / (selectedStock?.price ?? 0))
    : numericShares;

  const localAmount = estimatedShares * (selectedStock?.price ?? 0);
  const gbpCostFromShares = investMode === 'shares' && numericShares > 0
    ? localAmount / fxRate
    : numericAmount;

  const tradingFee = calculateTradingFee(numericAmount || gbpCostFromShares);
  const fxMargin = calculateFxMargin(numericAmount || gbpCostFromShares);
  const totalCharged = (numericAmount || gbpCostFromShares) + tradingFee + fxMargin;

  // Navigate to next/prev step
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => {
      const next = Math.min(s + 1, 4);
      if (next === 3) {
        setOrderRef(generateOrderReference());
      }
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  // Handle pay click
  const handlePay = () => {
    setShowPaymentAlert(true);
  };

  // ─── Step 1: Choose Stock ────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search African stocks..."
            className="pl-10 h-12 text-base rounded-lg border-emerald-200 focus-visible:ring-emerald-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
          {searchResults.map((stock) => {
            const isSelected = selectedStock?.ticker === stock.ticker && selectedStock?.exchange === stock.exchange;
            const isPositive = stock.changePct >= 0;

            return (
              <motion.button
                key={`${stock.exchange}-${stock.ticker}`}
                whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
                whileTap={{ scale: 0.995 }}
                onClick={() => setSelectedStock(stock)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border last:border-b-0 transition-colors ${
                  isSelected ? 'bg-emerald-50 ring-1 ring-emerald-300' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {stock.name}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {stock.ticker}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {stock.exchange}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm text-gray-900">
                    {CURRENCY_SYMBOLS[getExchangeCurrency(
                      Object.entries(STOCKS).find(([, stocks]) =>
                        stocks.some((s) => s.ticker === stock.ticker),
                      )?.[0] ?? 'nse',
                    )]} {formatNumber(stock.price)}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
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
                </div>
              </motion.button>
            );
          })}

          {searchResults.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No stocks found matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={goNext}
            disabled={!selectedStock}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Amount ──────────────────────────────────────
  function renderStep2() {
    if (!selectedStock) return null;

    const exchangeName =
      EXCHANGES.find((e) => e.id === Object.entries(STOCKS).find(([, stocks]) =>
        stocks.some((s) => s.ticker === selectedStock.ticker),
      )?.[0])?.name ?? selectedStock.exchange;

    const effectiveGbp = numericAmount || gbpCostFromShares;

    return (
      <div className="space-y-6">
        {/* Selected stock summary */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedStock.name}{' '}
                  <span className="text-emerald-700">({selectedStock.ticker})</span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {exchangeName} &middot; {localCurrency} {formatNumber(selectedStock.price)}
                </div>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${
                  selectedStock.changePct >= 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {selectedStock.changePct >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {selectedStock.changePct >= 0 ? '+' : ''}
                {selectedStock.changePct.toFixed(2)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setInvestMode('amount')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              investMode === 'amount'
                ? 'bg-emerald-600 text-white'
                : 'bg-background text-muted-foreground hover:text-gray-700'
            }`}
          >
            Invest by amount
          </button>
          <button
            onClick={() => setInvestMode('shares')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              investMode === 'shares'
                ? 'bg-emerald-600 text-white'
                : 'bg-background text-muted-foreground hover:text-gray-700'
            }`}
          >
            Invest by shares
          </button>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            {investMode === 'amount' ? 'Investment amount (GBP)' : 'Number of shares'}
          </label>
          <div className="relative">
            {investMode === 'amount' && (
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                &pound;
              </span>
            )}
            <Input
              type="number"
              min="0"
              step={investMode === 'amount' ? '1' : '1'}
              placeholder={investMode === 'amount' ? '100' : '10'}
              className={`h-12 text-base rounded-lg border-emerald-200 focus-visible:ring-emerald-400 ${
                investMode === 'amount' ? 'pl-8' : ''
              }`}
              value={investMode === 'amount' ? amountGbp : sharesInput}
              onChange={(e) =>
                investMode === 'amount'
                  ? setAmountGbp(e.target.value)
                  : setSharesInput(e.target.value)
              }
              autoFocus
            />
          </div>

          {/* Estimated result */}
          {estimatedShares > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {investMode === 'amount' ? 'Estimated shares' : 'Estimated cost'}
                </span>
                <span className="font-semibold text-gray-900">
                  {investMode === 'amount'
                    ? `~${estimatedShares.toLocaleString()} shares`
                    : `~\u00A3${formatNumber(gbpCostFromShares)}`}
                </span>
              </div>

              {/* FX conversion line */}
              <div className="text-xs text-muted-foreground">
                &pound;{formatNumber(effectiveGbp)} &rarr; {localCurrency}{' '}
                {formatNumber(localAmount, 0)} &rarr;{' '}
                {estimatedShares.toLocaleString()} shares at {localCurrency}{' '}
                {formatNumber(selectedStock.price)}
              </div>
            </motion.div>
          )}
        </div>

        {/* Fee breakdown */}
        {effectiveGbp > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Fee breakdown
            </h4>
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trading fee</span>
                <span className="font-medium">&pound;{formatNumber(tradingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FX margin (1.5%)</span>
                <span className="font-medium">&pound;{formatNumber(fxMargin)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>&pound;{formatNumber(totalCharged)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Stock prices change in real time. The shares you receive may differ
            slightly from the estimate shown above. FX rates are indicative and
            may vary at execution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={goBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={estimatedShares <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Review & Pay ────────────────────────────────
  function renderStep3() {
    if (!selectedStock) return null;
    const effectiveGbp = numericAmount || gbpCostFromShares;

    return (
      <div className="space-y-6">
        {/* Payment alert */}
        <AnimatePresence>
          {showPaymentAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Payment integration coming soon. Your order has been simulated
                  successfully.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Stock</span>
              <span className="font-medium text-right">
                {selectedStock.name} ({selectedStock.ticker})
              </span>

              <span className="text-muted-foreground">Exchange</span>
              <span className="font-medium text-right">{selectedStock.exchange}</span>

              <span className="text-muted-foreground">Approx. shares</span>
              <span className="font-medium text-right">
                {estimatedShares.toLocaleString()}
              </span>

              <span className="text-muted-foreground">Est. cost</span>
              <span className="font-medium text-right">
                &pound;{formatNumber(effectiveGbp)}
              </span>

              <span className="text-muted-foreground">AfriSpine fee</span>
              <span className="font-medium text-right">
                &pound;{formatNumber(tradingFee + fxMargin)}
              </span>

              <Separator className="col-span-2 my-1" />

              <span className="font-semibold text-gray-900">Total charged</span>
              <span className="font-bold text-emerald-700 text-right text-base">
                &pound;{formatNumber(totalCharged)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settlement info */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Settlement: T+3 (3 business days)
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your shares will appear in your portfolio after settlement.
                  Weekend and public holidays are excluded.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reference */}
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Order reference:</span>
          <span className="font-mono font-semibold text-gray-900">{orderRef}</span>
        </div>

        {/* Risk disclosure */}
        <div className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
          <Shield className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <p>
            Investing in stocks carries risk. You may receive fewer shares than
            estimated due to price movements between order placement and
            execution. Capital is at risk.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={goBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handlePay}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
            disabled={showPaymentAlert}
          >
            {showPaymentAlert ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Order Placed
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Pay &pound;{formatNumber(totalCharged)} &rarr;
              </>
            )}
          </Button>
          <PartnerDisclosure variant="card" />
        </div>
      </div>
    );
  }

  // ─── Step 4: Confirmation ────────────────────────────────
  function renderStep4() {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-8 space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Investment order placed!
          </h2>
          <p className="text-muted-foreground">
            Your order <span className="font-mono font-semibold text-gray-700">{orderRef}</span> has been submitted.
          </p>
        </div>

        {selectedStock && (
          <Card className="max-w-sm w-full border-emerald-200">
            <CardContent className="p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-medium">{selectedStock.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-medium">
                  ~{estimatedShares.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-emerald-700">
                  &pound;{formatNumber(totalCharged)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('markets')}
          >
            View portfolio
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => {
              setStep(1);
              setSelectedStock(null);
              setAmountGbp('');
              setSharesInput('');
              setOrderRef('');
              setShowPaymentAlert(false);
              setSearchQuery('');
            }}
          >
            Explore more stocks
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>

        <AchievementCard
          type="first_investment"
          data={selectedStock ? {
            stock: selectedStock.name,
            exchange: selectedStock.exchange,
            city: 'London',
            name: 'AfriSpine User',
          } : { stock: '', exchange: '', city: '', name: 'AfriSpine User' }}
          visible={showAchievement}
          onClose={() => setShowAchievement(false)}
        />
      </motion.div>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Explore African Stocks
        </h1>
        <p className="text-muted-foreground mt-1">
          Build wealth from the fastest-growing markets on earth.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}