'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AchievementCard } from '@/components/afrispine/common/achievement-card';
import { ReferralShareButtons } from '@/components/afrispine/common/referral-share';
import { useAppStore } from '@/stores/app';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Smartphone,
  Landmark,
  Zap,
  Globe,
  Loader2,
  CircleCheckBig,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Receipt,
  AlertCircle,
  TrendingUp,
  Shield,
  Sparkles,
  Banknote,
  Info,
} from 'lucide-react';

const corridors = [
  { from: 'GB', to: 'KE', sendLabel: 'GBP', receiveLabel: 'KES', label: 'UK → Kenya' },
  { from: 'GB', to: 'NG', sendLabel: 'GBP', receiveLabel: 'NGN', label: 'UK → Nigeria' },
  { from: 'GB', to: 'GH', sendLabel: 'GBP', receiveLabel: 'GHS', label: 'UK → Ghana' },
  { from: 'GB', to: 'TZ', sendLabel: 'GBP', receiveLabel: 'TZS', label: 'UK → Tanzania' },
  { from: 'GB', to: 'UG', sendLabel: 'GBP', receiveLabel: 'UGX', label: 'UK → Uganda' },
  { from: 'US', to: 'KE', sendLabel: 'USD', receiveLabel: 'KES', label: 'US → Kenya' },
  { from: 'US', to: 'NG', sendLabel: 'USD', receiveLabel: 'NGN', label: 'US → Nigeria' },
  { from: 'US', to: 'GH', sendLabel: 'USD', receiveLabel: 'GHS', label: 'US → Ghana' },
  { from: 'US', to: 'UG', sendLabel: 'USD', receiveLabel: 'UGX', label: 'US → Uganda' },
  { from: 'US', to: 'TZ', sendLabel: 'USD', receiveLabel: 'TZS', label: 'US → Tanzania' },
  { from: 'US', to: 'ZA', sendLabel: 'USD', receiveLabel: 'ZAR', label: 'US → South Africa' },
  { from: 'CA', to: 'KE', sendLabel: 'CAD', receiveLabel: 'KES', label: 'Canada → Kenya' },
  { from: 'CA', to: 'NG', sendLabel: 'CAD', receiveLabel: 'NGN', label: 'Canada → Nigeria' },
  { from: 'CA', to: 'GH', sendLabel: 'CAD', receiveLabel: 'GHS', label: 'Canada → Ghana' },
  { from: 'EU', to: 'KE', sendLabel: 'EUR', receiveLabel: 'KES', label: 'Europe → Kenya' },
  { from: 'EU', to: 'NG', sendLabel: 'EUR', receiveLabel: 'NGN', label: 'Europe → Nigeria' },
  { from: 'EU', to: 'GH', sendLabel: 'EUR', receiveLabel: 'GHS', label: 'Europe → Ghana' },
  { from: 'EU', to: 'TZ', sendLabel: 'EUR', receiveLabel: 'TZS', label: 'Europe → Tanzania' },
];

const quickAmounts: Record<string, number[]> = {
  GBP: [50, 100, 200, 500],
  USD: [50, 100, 200, 500],
  CAD: [50, 100, 200, 500],
  EUR: [50, 100, 200, 500],
};

const rails = [
  {
    id: 'mobile_money',
    label: 'Mobile money',
    icon: Smartphone,
    speed: 'Fast',
    desc: 'Direct to mobile wallet (M-Pesa, MTN, Airtel)',
    needs: 'Phone number',
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    icon: Landmark,
    speed: '1-2 hours',
    desc: 'Deposit to a bank account',
    needs: 'Bank account details',
  },
  {
    id: 'ripple',
    label: 'Ripple net',
    icon: Zap,
    speed: 'Coming soon',
    desc: 'Via MFS Africa — fast settlement across 35 African countries',
    needs: 'Bank account or wallet',
    badge: 'COMING SOON',
  },
  {
    id: 'papss',
    label: 'PAPSS',
    icon: Globe,
    speed: 'Coming soon',
    desc: 'Via Ecobank — local currency to local currency, no USD conversion',
    needs: 'Bank account',
    badge: 'COMING SOON',
  },
  {
    id: 'bill_pay',
    label: 'Pay a Bill',
    icon: Receipt,
    speed: '5 min',
    desc: 'Pay KPLC, Water, DStv, airtime for family',
    needs: 'Bill details',
  },
];

const networks = [
  { id: 'm-pesa', label: 'M-Pesa', country: 'KE' },
  { id: 'mtn_momo', label: 'MTN MoMo', country: 'NG' },
  { id: 'airtel_money', label: 'Airtel Money', country: 'UG' },
];

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds < 60;
  const pct = (seconds / 300) * 100;
  const progressBarClass = urgent ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-1.5 ${urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
          <Clock className="h-3.5 w-3.5" />
          <span>
            Rate locked for {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
        {urgent && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
            Refreshing soon
          </Badge>
        )}
      </div>
      <Progress value={pct} className="h-1" />
    </div>
  );
}

// ─── Live FX Rate Indicator ────────────────────────────────
function LiveRateIndicator(props: {
  rate: number;
  sendCurrency: string;
  receiveCurrency: string;
  fetching: boolean;
}) {
  const { rate, sendCurrency, receiveCurrency, fetching } = props;

  const rateText = fetching ? 'Updating...' : `1 ${sendCurrency} = ${rate.toFixed(2)} ${receiveCurrency}`;
  const borderColor = fetching ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50/50';
  const dotColor = fetching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500';
  const textColor = fetching ? 'text-amber-700' : 'text-gray-900';

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${borderColor}`}>
      <div className={`h-2 w-2 rounded-full ${dotColor} transition-transform`} />
      <span className="text-xs text-muted-foreground">Live FX</span>
      <span className={`text-sm font-bold transition-colors ${textColor}`}>
        {rateText}
      </span>
    </div>
  );
}

// ─── Fee Calculator Display ──────────────────────────────────────────
function FeeCalculator(props: {
  sendAmount: number;
  sendCurrency: string;
  feeAmount: number;
  feePct: number;
  receiveAmount: number;
  receiveCurrency: string;
}) {
  const { sendAmount, sendCurrency, feeAmount, feePct, receiveAmount, receiveCurrency } = props;

  const competitorFee = sendAmount * 0.07;
  const savings = competitorFee - feeAmount;
  const feeBarWidth = Math.min(feePct * 10, 100);
  const hasSavings = savings > 0;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-b from-muted/30 to-transparent p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-semibold text-gray-900">Transfer cost breakdown</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Fee: {feePct}%</span>
          <span>{feeAmount.toFixed(2)} {sendCurrency}</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${feeBarWidth}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">Only {feePct}% fee — among the lowest in the market</p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">You send</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {sendAmount.toFixed(2)}
            <span className="text-sm font-medium text-muted-foreground ml-1">{sendCurrency}</span>
          </p>
        </div>
        <div className="rounded-lg bg-background p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Transfer fee</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {feeAmount.toFixed(2)}
            <span className="text-sm font-medium text-muted-foreground ml-1">{sendCurrency}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Recipient receives</span>
          </div>
          <span className="text-xl font-bold text-emerald-700">
            {receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-sm font-medium text-emerald-600 ml-1">{receiveCurrency}</span>
          </span>
        </div>
      </div>

      {hasSavings && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
          <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              You save {savings.toFixed(2)} {sendCurrency} vs competitors
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              Compared to the industry average 7% fee
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Field Error ─────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
      <span className="text-xs text-destructive">{message}</span>
    </div>
  );
}

// ─── Step 1: Amount & Corridor ────────────────────────────────
const SEND_CURRENCIES = [
  { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  { code: 'CAD', label: 'CAD (C$)', flag: '🇨🇦' },
  { code: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
];

function StepAmount() {
  const store = useAppStore();
  const [amount, setAmount] = useState(store.sendAmount || '');
  const [corridorKey, setCorridorKey] = useState(`${store.sendCorridor.from}-${store.sendCorridor.to}`);
  const [fetching, setFetching] = useState(false);
  const [amountError, setAmountError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedCurrency, setSelectedCurrency] = useState(store.preferredCurrency || store.sendCurrency);

  const filteredCorridors = corridors.filter((c) => c.sendLabel === selectedCurrency);
  const activeCorridor = corridors.find((c) => `${c.from}-${c.to}` === corridorKey) || filteredCorridors[0] || corridors[0];

  const fetchQuote = useCallback(async (sendAmt: number) => {
    if (!sendAmt || sendAmt <= 0) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/fx?from=${activeCorridor.from}&to=${activeCorridor.to}&amount=${sendAmt}`);
      let rate = 193.42;
      let fee = sendAmt * 0.015;
      let feePct = 1.5;
      if (res.ok) {
        const data = await res.json();
        if (data.rate) rate = data.rate;
        if (data.fee !== undefined) fee = data.fee;
        if (data.feePct !== undefined) feePct = data.feePct;
      }
      const receiveAmt = sendAmt * rate - fee;
      store.updateQuote({
        sendCorridor: { from: activeCorridor.from, to: activeCorridor.to },
        sendCurrency: activeCorridor.sendLabel,
        receiveCurrency: activeCorridor.receiveLabel,
        sendAmount: sendAmt,
        fxRate: rate,
        feeAmount: fee,
        feePct,
        receiveAmount: Math.round(receiveAmt * 100) / 100,
        totalCharged: Math.round((sendAmt + fee) * 100) / 100,
        quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        quoteId: `QT-${Date.now()}`,
      });
    } catch {
      const rate = 193.42;
      const fee = sendAmt * 0.015;
      const receiveAmt = sendAmt * rate - fee;
      store.updateQuote({
        sendCorridor: { from: activeCorridor.from, to: activeCorridor.to },
        sendCurrency: activeCorridor.sendLabel,
        receiveCurrency: activeCorridor.receiveLabel,
        sendAmount: sendAmt,
        fxRate: rate,
        feeAmount: fee,
        feePct: 1.5,
        receiveAmount: Math.round(receiveAmt * 100) / 100,
        totalCharged: Math.round((sendAmt + fee) * 100) / 100,
        quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        quoteId: `QT-${Date.now()}`,
      });
    } finally {
      setFetching(false);
    }
  }, [activeCorridor, store]);

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setAmount(cleaned);
    setAmountError('');

    const num = parseFloat(cleaned);
    if (num > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchQuote(num), 300);
    }
  };

  const handleCorridorChange = (key: string) => {
    setCorridorKey(key);
    const num = parseFloat(amount as string);
    if (num > 0) {
      const corridor = corridors.find((c) => `${c.from}-${c.to}` === key);
      if (corridor) {
        store.updateQuote({
          sendCorridor: { from: corridor.from, to: corridor.to },
          sendCurrency: corridor.sendLabel,
          receiveCurrency: corridor.receiveLabel,
        });
      }
    }
  };

  const handleQuickAmount = (amt: number) => {
    setAmount(String(amt));
    setAmountError('');
    fetchQuote(amt);
  };

  const handleContinue = () => {
    const num = parseFloat(amount as string);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (num < 1) {
      setAmountError('Minimum send amount is 1.00');
      return;
    }
    if (num > 5000) {
      setAmountError('Maximum single transfer is 5,000.00');
      return;
    }
    store.setSendStep(2);
  };

  const currentCorridor = corridors.find((c) => `${c.from}-${c.to}` === corridorKey) || corridors[0];
  const presets = quickAmounts[currentCorridor.sendLabel] || quickAmounts.USD;
  const hasQuote = store.sendAmount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>How much would you like to send?</CardTitle>
        <CardDescription>Select the corridor and enter the amount</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency selector */}
        <div className="space-y-2">
          <Label>Send currency</Label>
          <div className="flex flex-wrap gap-2">
            {SEND_CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                type="button"
                onClick={() => {
                  setSelectedCurrency(cur.code);
                  store.setPreferredCurrency(cur.code);
                  // Auto-select the first corridor of the new currency
                  const first = corridors.find((c) => c.sendLabel === cur.code);
                  if (first) {
                    const key = `${first.from}-${first.to}`;
                    setCorridorKey(key);
                    const num = parseFloat(amount as string);
                    if (num > 0) {
                      store.updateQuote({
                        sendCorridor: { from: first.from, to: first.to },
                        sendCurrency: first.sendLabel,
                        receiveCurrency: first.receiveLabel,
                      });
                    }
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selectedCurrency === cur.code
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-border bg-background text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {cur.flag} {cur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corridor selector */}
        <div className="space-y-2">
          <Label>Send from → Receive in</Label>
          <Select value={corridorKey} onValueChange={handleCorridorChange}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(filteredCorridors.length > 0 ? filteredCorridors : corridors).map((c) => (
                <SelectItem key={`${c.from}-${c.to}`} value={`${c.from}-${c.to}`}>
                  {c.label} ({c.sendLabel} → {c.receiveLabel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Live FX rate indicator */}
        {hasQuote && (
          <LiveRateIndicator
            rate={store.fxRate}
            sendCurrency={store.sendCurrency}
            receiveCurrency={store.receiveCurrency}
            fetching={fetching}
          />
        )}

        {/* Amount inputs */}
        <div className="relative">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sendAmount" className="text-sm font-medium">You send</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {currentCorridor.sendLabel}
                </span>
                <Input
                  id="sendAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`pl-16 text-xl font-bold ${amountError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  min="1"
                  max="5000"
                  aria-invalid={!!amountError}
                />
              </div>
              <FieldError message={amountError} />
            </div>

            {/* Swap arrow (desktop) */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-emerald-600 text-white shadow-md">
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">They receive</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {currentCorridor.receiveLabel}
                </span>
                <Input
                  readOnly
                  value={hasQuote ? store.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}
                  className="pl-16 text-xl font-bold bg-emerald-50/50 border-emerald-200 text-emerald-700"
                  placeholder="0.00"
                />
              </div>
              {hasQuote && !fetching && (
                <p className="text-[11px] text-emerald-600 font-medium">
                  = {(store.receiveAmount / store.sendAmount).toFixed(2)} {store.receiveCurrency} per 1 {store.sendCurrency}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick amount presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick amounts</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((amt) => {
              const isActive = parseFloat(amount as string) === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-border bg-background text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {currentCorridor.sendLabel} {amt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fee calculator display */}
        {hasQuote && !fetching && (
          <FeeCalculator
            sendAmount={store.sendAmount}
            sendCurrency={store.sendCurrency}
            feeAmount={store.feeAmount}
            feePct={store.feePct}
            receiveAmount={store.receiveAmount}
            receiveCurrency={store.receiveCurrency}
          />
        )}

        {/* Loading state */}
        {hasQuote && fetching && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Getting best rate...</span>
          </div>
        )}

        {/* Quote expiry */}
        {hasQuote && !fetching && store.quoteExpiresAt && (
          <CountdownTimer expiresAt={store.quoteExpiresAt} />
        )}

        <Button
          onClick={handleContinue}
          disabled={!hasQuote || fetching}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 h-11 text-base"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Step 2: Choose Rail ────────────────────────────────────
function StepRail() {
  const store = useAppStore();

  const diasporaCurrencies = ['GBP', 'USD', 'CAD', 'EUR'];
  const isDiaspora = diasporaCurrencies.includes(store.sendCurrency);

  const isRailDisabled = (railId: string) => {
    if (railId === 'ripple' && store.sendCurrency !== 'USD') return true;
    if (railId === 'papss' && isDiaspora) return true;
    return false;
  };

  const getDisabledTooltip = (railId: string) => {
    if (railId === 'ripple' && store.sendCurrency !== 'USD')
      return 'Ripple rail available for USD sends only';
    if (railId === 'papss' && isDiaspora)
      return 'PAPSS is for Africa-to-Africa transfers only';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose delivery method</CardTitle>
        <CardDescription>How should your recipient receive the money?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rails.map((rail) => {
            const Icon = rail.icon;
            const selected = store.selectedRail === rail.id;
            const disabled = isRailDisabled(rail.id);
            const tooltipText = getDisabledTooltip(rail.id);

            const card = (
              <button
                key={rail.id}
                onClick={() => {
                  if (disabled) return;
                  store.updateQuote({ selectedRail: rail.id, selectedNetwork: '', selectedProvider: null });
                  if (rail.id !== 'mobile_money') {
                    store.updateQuote({ selectedNetwork: '' });
                  }
                }}
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : selected
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                      : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer'
                }`}
              >
                {selected && !disabled && (
                  <div className="absolute top-3 right-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                    selected && !disabled ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{rail.label}</p>
                      {'badge' in rail && rail.badge && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] font-bold px-1.5 py-0">
                          {rail.badge as string}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{rail.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      rail.speed === 'Fast' || rail.speed === '5 min'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ''
                    }`}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {rail.speed}
                  </Badge>
                  <span className="text-muted-foreground">Needs: {rail.needs}</span>
                </div>
              </button>
            );

            if (disabled) {
              return (
                <Tooltip key={rail.id}>
                  <TooltipTrigger asChild>
                    {card}
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return card;
          })}
        </div>

        {/* Bill pay notice */}
        {store.selectedRail === 'bill_pay' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
            <p>Bill payments have a separate flow. Click &apos;Pay a Bill&apos; to continue.</p>
            <Button
              onClick={() => useAppStore.getState().navigate('bills')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Pay a Bill
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Network selector for mobile money */}
        {store.selectedRail === 'mobile_money' && (
          <div className="space-y-2">
            <Label>Mobile network</Label>
            <Select
              value={store.selectedNetwork}
              onValueChange={(v) => store.updateQuote({ selectedNetwork: v })}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => store.setSendStep(1)} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={() => store.setSendStep(3)}
            disabled={!store.selectedRail || store.selectedRail === 'bill_pay'}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-11"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 3: Recipient ────────────────────────────────────────
function StepRecipient() {
  const store = useAppStore();
  const [dbRecipients, setDbRecipients] = useState<any[]>([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [name, setName] = useState(store.recipientName);
  const [phone, setPhone] = useState(store.recipientPhone);
  const [bankName, setBankName] = useState(store.recipientBankName);
  const [accountNumber, setAccountNumber] = useState(store.recipientAccountNumber);
  const [rippleAddress, setRippleAddress] = useState(store.recipientRippleAddress);
  const [papssIban, setPapssIban] = useState(store.recipientPapssIban);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch saved recipients from DB
  useEffect(() => {
    const senderId = store.senderId;
    if (!senderId) return;
    fetch(`/api/recipients?senderId=${senderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.recipients) setDbRecipients(data.recipients);
      })
      .catch(() => {});
  }, [store.senderId]);

  const handleSelectSaved = (recipientId: string) => {
    setSelectedSaved(recipientId);
    setErrors({});
    const rec = dbRecipients.find((r) => r.id === recipientId);
    if (rec) {
      setName(rec.fullName);
      setPhone(rec.phone);
      setBankName(rec.bankName || '');
      setAccountNumber(rec.accountNumber || '');
      setRippleAddress(rec.rippleAddress || '');
      setPapssIban(rec.papssIban || '');
      store.updateQuote({
        recipientName: rec.fullName,
        recipientPhone: rec.phone,
        recipientCountry: rec.country,
        recipientBankName: rec.bankName || '',
        recipientAccountNumber: rec.accountNumber || '',
        recipientRippleAddress: rec.rippleAddress || '',
        recipientPapssIban: rec.papssIban || '',
      });
    }
  };

  const clearSaved = () => {
    setSelectedSaved('');
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = 'Please enter the recipient\'s full name (at least 2 characters)';
    }

    if (store.selectedRail === 'mobile_money') {
      if (!phone || phone.trim().length < 6) {
        newErrors.phone = 'Please enter a valid phone number (at least 6 digits)';
      }
    }

    if (store.selectedRail === 'bank') {
      if (!bankName || bankName.trim().length < 2) {
        newErrors.bankName = 'Please enter the bank name';
      }
      if (!accountNumber || accountNumber.trim().length < 4) {
        newErrors.accountNumber = 'Please enter a valid account number';
      }
    }

    if (store.selectedRail === 'ripple' && (!rippleAddress || !rippleAddress.startsWith('r'))) {
      newErrors.rippleAddress = 'Ripple address must start with "r"';
    }

    if (store.selectedRail === 'papss' && (!papssIban || papssIban.trim().length < 10)) {
      newErrors.papssIban = 'Please enter a valid PAPSS IBAN';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    store.updateQuote({
      recipientName: name,
      recipientPhone: phone,
      recipientBankName: bankName,
      recipientAccountNumber: accountNumber,
      recipientRippleAddress: rippleAddress,
      recipientPapssIban: papssIban,
    });
    store.setSendStep(4);
  };

  const recipientCountry = store.sendCorridor.to;
  const countryLabels: Record<string, string> = {
    KE: 'Kenya', NG: 'Nigeria', GH: 'Ghana', TZ: 'Tanzania', UG: 'Uganda', ZA: 'South Africa',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who are you sending to?</CardTitle>
        <CardDescription>Choose a saved recipient or enter new details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saved recipients from DB */}
        {dbRecipients.length > 0 && (
          <div className="space-y-2">
            <Label>Saved recipients</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
              {dbRecipients
                .filter((r) => r.country === recipientCountry || true)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectSaved(r.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                      selectedSaved === r.id
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                        : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                      {r.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.phone || r.country}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {dbRecipients.length > 0 && <Separator />}

        {/* Manual entry */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="recipientName">Recipient name <span className="text-destructive">*</span></Label>
            <Input
              id="recipientName"
              placeholder="Full name as on their ID"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearSaved();
                clearFieldError('name');
              }}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              aria-invalid={!!errors.name}
            />
            <FieldError message={errors.name} />
          </div>

          {/* Phone — for mobile money */}
          {store.selectedRail === 'mobile_money' && (
            <div className="space-y-1">
              <Label htmlFor="recipientPhone">Phone number <span className="text-destructive">*</span></Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder={store.selectedNetwork === 'm-pesa' ? '+254 7XX XXX XXX' : '+254 7XX XXX XXX'}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearSaved();
                  clearFieldError('phone');
                }}
                className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={!!errors.phone}
              />
              <FieldError message={errors.phone} />
              {store.selectedNetwork && !errors.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Delivering via {networks.find((n) => n.id === store.selectedNetwork)?.label || 'Mobile money'}
                </p>
              )}
            </div>
          )}

          {/* Bank fields */}
          {store.selectedRail === 'bank' && (
            <>
              <div className="space-y-1">
                <Label>Bank name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. Equity Bank"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    clearSaved();
                    clearFieldError('bankName');
                  }}
                  className={errors.bankName ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.bankName}
                />
                <FieldError message={errors.bankName} />
              </div>
              <div className="space-y-1">
                <Label>Account number <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    clearSaved();
                    clearFieldError('accountNumber');
                  }}
                  className={errors.accountNumber ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.accountNumber}
                />
                <FieldError message={errors.accountNumber} />
              </div>
            </>
          )}

          {/* Ripple address */}
          {store.selectedRail === 'ripple' && (
            <div className="space-y-1">
              <Label htmlFor="rippleAddress">Ripple address <span className="text-destructive">*</span></Label>
              <Input
                id="rippleAddress"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={rippleAddress}
                onChange={(e) => {
                  setRippleAddress(e.target.value);
                  clearSaved();
                  clearFieldError('rippleAddress');
                }}
                className={errors.rippleAddress ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={!!errors.rippleAddress}
              />
              <FieldError message={errors.rippleAddress} />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Enter the recipient&apos;s Ripple wallet address for fast settlement.
              </p>
            </div>
          )}

          {/* PAPSS IBAN */}
          {store.selectedRail === 'papss' && (
            <div className="space-y-1">
              <Label htmlFor="papssIban">PAPSS IBAN <span className="text-destructive">*</span></Label>
              <Input
                id="papssIban"
                placeholder="e.g. NG92 0000 0000 0000 0000 0000 000"
                value={papssIban}
                onChange={(e) => {
                  setPapssIban(e.target.value);
                  clearSaved();
                  clearFieldError('papssIban');
                }}
                className={errors.papssIban ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={!!errors.papssIban}
              />
              <FieldError message={errors.papssIban} />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Enter the recipient&apos;s IBAN reachable via the Pan-African Payment &amp; Settlement System.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Receiving country</Label>
            <Input
              readOnly
              value={countryLabels[recipientCountry] || recipientCountry}
              className="bg-muted/50"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => store.setSendStep(2)} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-11"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 4: Review & Pay (payment popup) ───────────────────────
function StepReviewPay() {
  const store = useAppStore();
  const [paying, setPaying] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      // Generate a reference for this transfer
      const transactionRef = `AS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // Step 1: Initialize the collection (charge the sender)
      const res = await fetch('/api/send/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: store.totalCharged,
          sendCurrency: store.sendCurrency,
          receiveCurrency: store.receiveCurrency,
          recipientPhone: store.recipientPhone,
          recipientName: store.recipientName,
          recipientCountry: store.sendCorridor?.to || '',
          rail: store.selectedRail,
          senderEmail: store.sender?.email || '',
          reference: transactionRef,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Payment initialization failed. Please try again.');
        return;
      }

      if (data.checkoutUrl) {
        // Redirect to Eversend's hosted checkout page
        // The webhook will handle the rest (collection.completed → execute payout)
        toast.info('Redirecting to secure payment...');
        window.location.href = data.checkoutUrl;
      } else {
        // No checkout URL — collection was initiated via other method
        toast.success('Payment initiated! Processing your transfer...');
        // TODO: Poll for status or rely on webhook
      }
    } catch (err) {
      console.error('[StepReviewPay] handlePay error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const railLabel = rails.find((r) => r.id === store.selectedRail)?.label || store.selectedRail;
  const networkLabel = networks.find((n) => n.id === store.selectedNetwork)?.label || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review and pay</CardTitle>
        <CardDescription>Confirm the details before you pay</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transfer summary — visually prominent */}
        <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You send</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {store.sendAmount.toFixed(2)} {store.sendCurrency}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">They receive</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {store.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {store.receiveCurrency}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Exchange rate</span>
              <span className="font-medium">{store.fxRate.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Transfer fee</span>
              <span className="font-medium">{store.feeAmount.toFixed(2)} {store.sendCurrency}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total you pay</span>
            <span className="text-lg font-bold text-emerald-700">
              {store.totalCharged.toFixed(2)} {store.sendCurrency}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Recipient</p>
            <p className="font-medium mt-0.5">{store.recipientName}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium mt-0.5">{store.recipientPhone || '—'}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Delivery method</p>
            <p className="font-medium mt-0.5">{railLabel}{networkLabel ? ` (${networkLabel})` : ''}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Quote reference</p>
            <p className="font-mono text-xs mt-0.5">{store.quoteId}</p>
          </div>
        </div>

        {store.quoteExpiresAt && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <CountdownTimer expiresAt={store.quoteExpiresAt} />
          </div>
        )}

        {/* Save card checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="saveCard"
            checked={saveCard}
            onCheckedChange={(checked) => setSaveCard(checked === true)}
          />
          <Label htmlFor="saveCard" className="text-sm font-normal cursor-pointer">
            Save my card for faster recurring sends
          </Label>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Secured by Eversend — Card &amp; Bank Transfer accepted</span>
        </div>

        {/* Compliance disclosure */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
          <p>AfriSpine is a payment routing platform. Your card is charged securely by Eversend. Funds are delivered to your recipient by the selected licensed provider. AfriSpine does not hold your funds at any time. By clicking Pay you agree to our <button onClick={() => store.navigate('terms')} className="underline font-medium">Terms of Service</button> and <button onClick={() => store.navigate('privacy')} className="underline font-medium">Privacy Policy</button>.</p>
        </div>

        {store.sendCurrency === 'USD' && store.sendAmount > 3000 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p><strong>US Regulatory Notice:</strong> Transactions above $3,000 may be reported to US financial regulators as required by law (Bank Secrecy Act). This is routine and does not affect your transfer.</p>
          </div>
        )}

        {store.sendCurrency === 'CAD' && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <p><strong>Canadian cards are charged in USD.</strong> Your card network will convert CAD to USD at their rate. The USD amount shown is what our payment processor charges.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => store.setSendStep(3)} className="flex-1" disabled={paying}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handlePay}
            disabled={paying || store.sendAmount <= 0}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-11 text-base"
          >
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening payment...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Pay {store.totalCharged.toFixed(2)} {store.sendCurrency}
              </>
            )}
          </Button>
          <PartnerDisclosure variant="card" className="mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 5: Confirmation ──────────────────────────────
function StepConfirmation() {
  const store = useAppStore();
  const navigate = useAppStore((s) => s.navigate);
  const txn = store.currentTransaction;
  const [showAchievement, setShowAchievement] = useState(false);

  React.useEffect(() => {
    if (txn) {
      const timer = setTimeout(() => setShowAchievement(true), 800);
      return () => clearTimeout(timer);
    }
  }, [txn]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Animated success icon */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CircleCheckBig className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-20" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Transfer submitted</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        Your payment has been received and the transfer is being processed. Your recipient
        will be notified once the funds are delivered.
      </p>

      {txn && (
        <div className="mt-8 w-full max-w-md rounded-xl border border-border bg-muted/30 px-6 py-5 text-left">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Reference</p>
              <p className="font-mono font-medium mt-1">{txn.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
              <p className="font-medium mt-1">{txn.amount.toFixed(2)} {txn.sendCurrency}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Recipient</p>
              <p className="font-medium mt-1">{txn.recipient}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 mt-1">
                Processing
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {txn && (
          <Button
            variant="outline"
            onClick={() => navigate('transfer-detail', { id: txn.id })}
            className="h-11"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Track this transfer
          </Button>
        )}
        <Button
          onClick={() => {
            store.resetSendFlow();
            navigate('send');
          }}
          className="bg-emerald-600 text-white hover:bg-emerald-700 h-11"
        >
          Send another
        </Button>
      </div>

      <AchievementCard
        type="first_send"
        data={{
          amount: txn?.amount?.toString() || '0',
          currency: txn?.sendCurrency || 'USD',
          country: store.recvCountry || 'KE',
          name: 'AfriSpine User',
        }}
        visible={showAchievement}
        onClose={() => setShowAchievement(false)}
      />

      {store.sender?.referralCode && (
        <div className="mt-4 w-full max-w-md">
          <ReferralShareButtons referralCode={store.sender.referralCode} compact />
        </div>
      )}
    </div>
  );
}

// ─── Step Progress Indicator ────────────────────────────────
function StepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = step === stepNum;
        const done = step > stepNum;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                i < step ? 'bg-emerald-600' : 'bg-muted-foreground/20'
              }`} />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block transition-colors ${
                isActive ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Send Flow ─────────────────────────────────
export function SendFlow() {
  const store = useAppStore();
  const step = store.sendStep;
  const viewParams = useAppStore((s) => s.viewParams);

  // Deep-link support: read URL query params on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const amount = params.get('amount');

    if (!from && !to && !amount) return;

    const updates: Record<string, unknown> = {};

    if (from && to) {
      const corridor = corridors.find(c => c.from === from && c.to === to);
      if (corridor) {
        updates.sendCorridor = { from: corridor.from, to: corridor.to };
        updates.sendCurrency = corridor.sendLabel;
        updates.receiveCurrency = corridor.receiveLabel;
      }
    } else if (from) {
      const corridor = corridors.find(c => c.from === from);
      if (corridor) {
        updates.sendCorridor = { from: corridor.from, to: corridor.to };
        updates.sendCurrency = corridor.sendLabel;
        updates.receiveCurrency = corridor.receiveLabel;
      }
    } else if (to) {
      const corridor = corridors.find(c => c.to === to);
      if (corridor) {
        updates.sendCorridor = { from: corridor.from, to: corridor.to };
        updates.sendCurrency = corridor.sendLabel;
        updates.receiveCurrency = corridor.receiveLabel;
      }
    }

    if (amount) {
      updates.sendAmount = Number(amount);
    }

    if (Object.keys(updates).length > 0) {
      store.updateQuote(updates);
      store.setSendStep(2);
    }
  }, []);

  // Handle programmatic viewParams (set via navigate())
  React.useEffect(() => {
    if (viewParams.from && viewParams.to) {
      const corridor = corridors.find(c => c.from === viewParams.from && c.to === viewParams.to);
      if (corridor) {
        store.updateQuote({
          sendCorridor: { from: corridor.from, to: corridor.to },
          sendCurrency: corridor.sendLabel,
          receiveCurrency: corridor.receiveLabel,
        });
      }
    }
    if (viewParams.amount) {
      store.updateQuote({ sendAmount: Number(viewParams.amount) });
    }
  }, []);

  const stepLabels = ['Amount', 'Delivery', 'Recipient', 'Review', 'Done'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer money</h1>
        {step < 5 && (
          <p className="text-muted-foreground">Step {step} of 4 — {stepLabels[step - 1]}</p>
        )}
      </div>

      {/* Step progress */}
      {step < 5 && <StepProgress step={step} labels={stepLabels} />}

      {/* Step content */}
      {step === 1 && <StepAmount />}
      {step === 2 && <StepRail />}
      {step === 3 && <StepRecipient />}
      {step === 4 && <StepReviewPay />}
      {step === 5 && <StepConfirmation />}
    </div>
  );
}