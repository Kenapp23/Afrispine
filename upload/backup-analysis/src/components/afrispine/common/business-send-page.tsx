'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Shield,
  Building2,
  Globe,
  Banknote,
  Loader2,
  Info,
  Zap,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const SELL_CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar', flag: '🇺🇸' },
  { value: 'GBP', label: 'GBP — British Pound', flag: '🇬🇧' },
  { value: 'EUR', label: 'EUR — Euro', flag: '🇪🇺' },
];

const BUY_CURRENCIES = [
  { value: 'KES', label: 'KES — Kenyan Shilling', flag: '🇰🇪' },
  { value: 'NGN', label: 'NGN — Nigerian Naira', flag: '🇳🇬' },
  { value: 'GHS', label: 'GHS — Ghanaian Cedi', flag: '🇬🇭' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling', flag: '🇺🇬' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling', flag: '🇹🇿' },
  { value: 'ZAR', label: 'ZAR — South African Rand', flag: '🇿🇦' },
];

const COUNTRY_OPTIONS = [
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'UG', label: 'Uganda' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'ZA', label: 'South Africa' },
];

const PURPOSE_OPTIONS = [
  { value: 'supplier_payment', label: 'Supplier payment' },
  { value: 'profit_repatriation', label: 'Profit repatriation' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

// Mid-market reference rates (approximate)
const MID_RATES: Record<string, number> = {
  'USD-KES': 129.4,
  'USD-NGN': 1550.0,
  'USD-GHS': 15.1,
  'USD-UGX': 3750.0,
  'USD-TZS': 2650.0,
  'USD-ZAR': 18.2,
  'GBP-KES': 164.2,
  'GBP-NGN': 1960.0,
  'GBP-GHS': 19.1,
  'GBP-UGX': 4760.0,
  'GBP-TZS': 3370.0,
  'GBP-ZAR': 23.1,
  'EUR-KES': 140.5,
  'EUR-NGN': 1680.0,
  'EUR-GHS': 16.4,
  'EUR-UGX': 4080.0,
  'EUR-TZS': 2885.0,
  'EUR-ZAR': 19.8,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'UGX' || currency === 'TZS' || currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'UGX' || currency === 'TZS' || currency === 'NGN' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function generateRef(): string {
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `BIZ-2026-${num}`;
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Get Quote', 'Beneficiary', 'Review', 'Confirm'];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = num === step;
        const isCompleted = num < step;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className={`h-px w-6 sm:w-10 ${num <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium hidden sm:block ${
                  isActive ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
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

// ─── Step 1: Get a Live Quote ───────────────────────────────────────────────

function StepQuote() {
  const {
    bizSellCurrency, bizBuyCurrency, bizSellAmount,
    bizFxRate, bizMarginPct, bizBuyAmount, bizMarginAmount, bizTotalCharged,
    updateBizQuote, setBizStep,
  } = useAppStore();

  const midRateKey = `${bizSellCurrency}-${bizBuyCurrency}`;
  const midRate = MID_RATES[midRateKey] || 100;
  const ourRate = midRate * (1 - bizMarginPct / 100);
  const bankRate = midRate * (1 - 3.75 / 100); // banks typically charge ~3.75% more
  const buyAmount = bizSellAmount * ourRate;
  const marginAmount = bizSellAmount * (bizMarginPct / 100);
  const totalCharged = bizSellAmount + marginAmount;
  const savings = bizSellAmount * (bankRate - ourRate);

  const handleGetQuote = () => {
    if (bizSellAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    updateBizQuote({
      bizFxRate: ourRate,
      bizBuyAmount: buyAmount,
      bizMarginAmount: marginAmount,
      bizTotalCharged: totalCharged,
    });
    setBizStep(2);
  };

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Currency &amp; Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* You Sell */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">You sell</label>
            <div className="flex items-center gap-3">
              <Select
                value={bizSellCurrency}
                onValueChange={(v) => updateBizQuote({ bizSellCurrency: v })}
              >
                <SelectTrigger className="w-44 sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SELL_CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="mr-2">{c.flag}</span>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                step={100}
                value={bizSellAmount || ''}
                onChange={(e) => updateBizQuote({ bizSellAmount: parseFloat(e.target.value) || 0 })}
                className="flex-1 font-mono text-lg"
                placeholder="50,000"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          {/* You Buy */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">You buy (auto-calculated)</label>
            <div className="flex items-center gap-3">
              <Select
                value={bizBuyCurrency}
                onValueChange={(v) => updateBizQuote({ bizBuyCurrency: v })}
              >
                <SelectTrigger className="w-44 sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUY_CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="mr-2">{c.flag}</span>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                readOnly
                value={bizSellAmount > 0 ? fmtCurrency(buyAmount, bizBuyCurrency) : ''}
                className="flex-1 font-mono text-lg bg-muted/50"
                placeholder="—"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Display */}
      {bizSellAmount > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Mid-market reference: <span className="font-mono font-medium text-gray-700">1 {bizSellCurrency} = {midRate.toFixed(midRate > 100 ? 1 : 4)} {bizBuyCurrency}</span>
                </p>
                <p className="text-emerald-700 font-medium">
                  Our rate: <span className="font-mono">1 {bizSellCurrency} = {ourRate.toFixed(ourRate > 100 ? 1 : 4)} {bizBuyCurrency}</span>
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">{bizMarginPct}% margin</Badge>
                </p>
                <p className="text-emerald-600">
                  You save vs bank: <span className="font-semibold">~3%</span>{' '}
                  <span className="font-mono">(≈ {fmtCurrency(savings, bizBuyCurrency)})</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleGetQuote}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
      >
        Get Quote
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

// ─── Step 2: Beneficiary Details ────────────────────────────────────────────

function StepBeneficiary() {
  const {
    bizBeneficiaryName, bizBeneficiaryBank, bizBeneficiaryAccount, bizBeneficiarySwift,
    bizBeneficiaryCountry, bizPurposeOfPayment, bizBuyCurrency,
    updateBizQuote, setBizStep,
  } = useAppStore();

  // Map buy currency to default country
  const defaultCountry = useMemo(() => {
    const map: Record<string, string> = { KES: 'KE', NGN: 'NG', GHS: 'GH', UGX: 'UG', TZS: 'TZ', ZAR: 'ZA' };
    return map[bizBuyCurrency] || 'KE';
  }, [bizBuyCurrency]);

  const handleNext = () => {
    if (!bizBeneficiaryName.trim()) { toast.error('Beneficiary name is required'); return; }
    if (!bizBeneficiaryBank.trim()) { toast.error('Bank name is required'); return; }
    if (!bizBeneficiaryAccount.trim()) { toast.error('Account number is required'); return; }
    if (!bizPurposeOfPayment) { toast.error('Purpose of payment is required'); return; }
    setBizStep(3);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Beneficiary Details
          </CardTitle>
          <CardDescription>Enter the recipient&apos;s bank account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-900">Beneficiary name *</label>
              <Input
                value={bizBeneficiaryName}
                onChange={(e) => updateBizQuote({ bizBeneficiaryName: e.target.value })}
                placeholder="e.g. Global Suppliers Ltd"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Country *</label>
              <Select
                value={bizBeneficiaryCountry || defaultCountry}
                onValueChange={(v) => updateBizQuote({ bizBeneficiaryCountry: v })}
              >
                <FormControl2>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl2>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Bank name *</label>
              <Input
                value={bizBeneficiaryBank}
                onChange={(e) => updateBizQuote({ bizBeneficiaryBank: e.target.value })}
                placeholder="e.g. Equity Bank Kenya"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Account number / IBAN *</label>
              <Input
                value={bizBeneficiaryAccount}
                onChange={(e) => updateBizQuote({ bizBeneficiaryAccount: e.target.value })}
                placeholder="e.g. 0123456789012"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">SWIFT / BIC</label>
              <Input
                value={bizBeneficiarySwift}
                onChange={(e) => updateBizQuote({ bizBeneficiarySwift: e.target.value })}
                placeholder="e.g. EABOROBB"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-900">Purpose of payment *</label>
              <Select
                value={bizPurposeOfPayment}
                onValueChange={(v) => updateBizQuote({ bizPurposeOfPayment: v })}
              >
                <FormControl2>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                </FormControl2>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setBizStep(1)} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          Review
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Small wrapper for Select inside grid (FormControl equivalent) ──────────
function FormControl2({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Step 3: Review & Confirm ───────────────────────────────────────────────

function StepReview() {
  const {
    bizSellCurrency, bizBuyCurrency, bizSellAmount, bizBuyAmount, bizFxRate,
    bizMarginPct, bizMarginAmount, bizTotalCharged,
    bizBeneficiaryName, bizBeneficiaryBank, bizBeneficiaryAccount, bizBeneficiarySwift, bizBeneficiaryCountry,
    bizPurposeOfPayment,
    setBizStep, resetBizFlow, updateBizQuote,
  } = useAppStore();

  const ref = useMemo(() => generateRef(), []);

  const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === bizBeneficiaryCountry)?.label || bizBeneficiaryCountry;
  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.value === bizPurposeOfPayment)?.label || bizPurposeOfPayment;

  const handleConfirm = () => {
    // In a real app, this would call an API to create the transaction
    updateBizQuote({ bizQuoteExpiresAt: new Date(Date.now() + 30 * 60000).toISOString() });
    setBizStep(4);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-emerald-200">
        <CardHeader className="bg-emerald-50/50 rounded-t-lg">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Transaction Summary
          </CardTitle>
          <CardDescription>Review the details before confirming</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ArrowUpRight className="h-4 w-4" /> You sell
              </span>
              <span className="font-bold text-lg">{fmtCurrency(bizSellAmount, bizSellCurrency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Rate
              </span>
              <span className="font-mono font-medium">
                1 {bizSellCurrency} = {bizFxRate.toFixed(bizFxRate > 100 ? 2 : 4)} {bizBuyCurrency}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ArrowDownLeft className="h-4 w-4" /> You buy
              </span>
              <span className="font-bold text-lg text-emerald-700">{fmtCurrency(bizBuyAmount, bizBuyCurrency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">AfriSpine margin</span>
              <span className="text-red-600">
                {bizMarginPct}% = {fmtCurrency(bizMarginAmount, bizSellCurrency)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-1.5 bg-emerald-50 -mx-4 px-4 rounded-lg">
              <span className="font-semibold text-gray-900">Total charged</span>
              <span className="font-bold text-lg text-gray-900">{fmtCurrency(bizTotalCharged, bizSellCurrency)}</span>
            </div>
          </div>

          <Separator />

          {/* Beneficiary & Settlement Details */}
          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beneficiary</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{bizBeneficiaryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span>{bizBeneficiaryBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono text-xs">{bizBeneficiaryAccount}</span>
              </div>
              {bizBeneficiarySwift && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SWIFT / BIC</span>
                  <span className="font-mono text-xs">{bizBeneficiarySwift}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span>{countryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose</span>
                <span>{purposeLabel}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settlement</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                Next business day by 17:00 EAT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs text-emerald-600">{ref}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Disclosure */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            This transaction will be subject to AML screening. AfriSpine does not hold funds. The FX conversion and settlement is executed by our licensed FX partner. By confirming you certify the purpose of payment is accurate.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setBizStep(2)} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
        >
          <Shield className="mr-2 h-5 w-5" />
          Pay {fmtCurrency(bizTotalCharged, bizSellCurrency)}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Confirmation ───────────────────────────────────────────────────

function StepConfirmed() {
  const { navigate, resetBizFlow } = useAppStore();
  const ref = useMemo(() => generateRef(), []);

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Quote confirmed. Processing your transaction.</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Your FX transaction has been submitted for processing. You&apos;ll receive a confirmation email with the settlement timeline.
        </p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/20">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-medium text-emerald-600">{ref}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected settlement</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                Next business day by 17:00 EAT
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">Processing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => {
            resetBizFlow();
            navigate('business');
          }}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Business Home
        </Button>
        <Button
          onClick={() => {
            resetBizFlow();
            navigate('business');
          }}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Go to Business Portal
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BusinessSendPage() {
  const { bizStep, resetBizFlow, navigate } = useAppStore();

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button */}
      {bizStep < 4 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (bizStep === 1) {
              resetBizFlow();
              navigate('business');
            } else {
              resetBizFlow();
            }
          }}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      )}

      {/* Header */}
      <div className="text-center mb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business FX Send</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fast, transparent FX for African business payments
        </p>
      </div>

      {/* Step Indicator */}
      {bizStep < 4 && <StepIndicator step={bizStep} />}

      {/* Step Content */}
      {bizStep === 1 && <StepQuote />}
      {bizStep === 2 && <StepBeneficiary />}
      {bizStep === 3 && <StepReview />}
      {bizStep === 4 && <StepConfirmed />}
    </div>
  );
}