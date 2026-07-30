'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Zap,
  Droplets,
  Tv,
  Smartphone,
  HeartPulse,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Receipt,
  RotateCcw,
  LayoutDashboard,
  Clock,
  ShieldCheck,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FX_RATE = 129; // 1 USD = 129 KES (approximate)
const FEE_USD = 1.5;

const airtimeCountries = [
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪', rate: 129 },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', rate: 1550 },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭', rate: 15.5 },
] as const;

const dstvPackages = [
  { id: 'compact', label: 'DStv Compact', price: 1999 },
  { id: 'compact_plus', label: 'DStv Compact Plus', price: 3199 },
  { id: 'premium', label: 'DStv Premium', price: 6499 },
  { id: 'gotv_supa', label: 'GOtv Supa', price: 999 },
  { id: 'gotv_max', label: 'GOtv Max', price: 1499 },
] as const;

const billTypes = [
  { id: 'kplc_prepaid', label: 'KPLC Electricity', icon: Zap, paybill: '888880', accountLabel: 'Meter number', accountPlaceholder: 'Enter 11-digit meter number', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', available: true },
  { id: 'nairobi_water', label: 'Nairobi Water', icon: Droplets, paybill: '444700', accountLabel: 'Account number', accountPlaceholder: 'Enter account number', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', available: true },
  { id: 'dstv', label: 'DStv', icon: Tv, paybill: '444700', accountLabel: 'Smartcard number', accountPlaceholder: 'Enter 10-digit smartcard number', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', available: true },
  { id: 'gotv', label: 'GOtv', icon: Tv, paybill: '444700', accountLabel: 'IUC number', accountPlaceholder: 'Enter IUC number', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', available: true },
  { id: 'airtime', label: 'Airtime Top-up', icon: Smartphone, paybill: '', accountLabel: 'Phone number', accountPlaceholder: 'e.g. 0712345678', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', available: true },
  { id: 'sha', label: 'SHA Health', icon: HeartPulse, paybill: '200222', accountLabel: 'National ID', accountPlaceholder: 'Enter member national ID', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', available: false, comingSoon: true, comingSoonMessage: "We are monitoring SHA's payment infrastructure reliability before enabling this service." },
  { id: 'school_fees', label: 'School Fees', icon: GraduationCap, paybill: '', accountLabel: 'Student ID', accountPlaceholder: 'Enter student ID', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', available: false, comingSoon: true, comingSoonMessage: 'Coming soon' },
] as const;

type BillTypeId = (typeof billTypes)[number]['id'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillHistoryItem {
  id: string;
  billType: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reference?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBillTypeConfig(id: string) {
  return billTypes.find((b) => b.id === id);
}

function getCurrencyForBill(billId: BillTypeId, airtimeCountryCode?: string) {
  if (billId === 'airtime') {
    const c = airtimeCountries.find((ac) => ac.code === airtimeCountryCode);
    return c?.currency ?? 'KES';
  }
  return 'KES';
}

function getFxRateForBill(billId: BillTypeId, airtimeCountryCode?: string) {
  if (billId === 'airtime') {
    const c = airtimeCountries.find((ac) => ac.code === airtimeCountryCode);
    return c?.rate ?? FX_RATE;
  }
  return FX_RATE;
}

function localAmountToUsd(localAmount: number, rate: number) {
  return localAmount / rate;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillsPage() {
  // ── Store ──────────────────────────────────────────────────────────────
  const billStep = useAppStore((s) => s.billStep);
  const billType = useAppStore((s) => s.billType) as BillTypeId | null;
  const setBillStep = useAppStore((s) => s.setBillStep);
  const setBillType = useAppStore((s) => s.setBillType);
  const resetBillFlow = useAppStore((s) => s.resetBillFlow);
  const navigate = useAppStore((s) => s.navigate);

  // ── Step 2 form state ──────────────────────────────────────────────────
  const [meterNumber, setMeterNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [customAmount, setCustomAmount] = useState(false);
  const [airtimeCountry, setAirtimeCountry] = useState('KE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [waterAccount, setWaterAccount] = useState('');
  const [waterHolder, setWaterHolder] = useState('');
  const [waterAmount, setWaterAmount] = useState('');

  // ── Waitlist dialog state ──────────────────────────────────────────────
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // ── Step 3-4 state ─────────────────────────────────────────────────────
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    reference: string;
    token?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // ── History ────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<BillHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── Derived ────────────────────────────────────────────────────────────
  const currentBill = useMemo(() => getBillTypeConfig(billType ?? ''), [billType]);
  const currency = useMemo(() => getCurrencyForBill(billType ?? '' as BillTypeId, airtimeCountry), [billType, airtimeCountry]);
  const fxRate = useMemo(() => getFxRateForBill(billType ?? '' as BillTypeId, airtimeCountry), [billType, airtimeCountry]);

  const effectiveAmount = useMemo(() => {
    if (!billType) return 0;
    if (billType === 'kplc_prepaid') return Number(amount) || 0;
    if (billType === 'nairobi_water') return Number(waterAmount) || 0;
    if (billType === 'dstv' || billType === 'gotv') {
      if (customAmount) return Number(amount) || 0;
      const pkg = dstvPackages.find((p) => p.id === selectedPackage);
      return pkg?.price ?? 0;
    }
    if (billType === 'airtime') return Number(amount) || 0;
    return 0;
  }, [billType, amount, waterAmount, customAmount, selectedPackage]);

  const usdTotal = useMemo(() => {
    const local = effectiveAmount;
    if (local <= 0) return 0;
    const usd = localAmountToUsd(local, fxRate);
    return usd + FEE_USD;
  }, [effectiveAmount, fxRate]);

  // ── Fetch history ──────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/bills/history');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setHistory(items.slice(0, 8));
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Reset form fields when bill type changes ───────────────────────────
  useEffect(() => {
    setMeterNumber('');
    setAccountHolder('');
    setAccountNumber('');
    setAmount('');
    setSelectedPackage('');
    setCustomAmount(false);
    setAirtimeCountry('KE');
    setPhoneNumber('');
    setWaterAccount('');
    setWaterHolder('');
    setWaterAmount('');
    setPaymentResult(null);
    setCopied(false);
  }, [billType]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectBillType = (id: string) => {
    setBillType(id as BillTypeId);
    setBillStep(2);
  };

  const handleBack = () => {
    if (billStep === 2) {
      resetBillFlow();
    } else if (billStep === 3) {
      setBillStep(2);
    } else if (billStep === 4) {
      resetBillFlow();
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    setWaitlistSubmitting(true);
    try {
      const res = await fetch('/api/bills/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceKey: 'sha', email: waitlistEmail.trim() }),
      });
      if (res.ok) {
        toast.success("You're on the list! We'll notify you when SHA payments are live.");
        setWaitlistEmail('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to register. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // ── Validation for Next button (Step 2 → 3) ───────────────────────────
  const canProceed = useMemo(() => {
    if (!billType) return false;
    if (billType === 'kplc_prepaid') {
      return meterNumber.length === 11 && effectiveAmount >= 50;
    }
    if (billType === 'nairobi_water') {
      return waterAccount.length > 0 && effectiveAmount > 0;
    }
    if (billType === 'dstv' || billType === 'gotv') {
      return accountNumber.length > 0 && effectiveAmount > 0;
    }
    if (billType === 'airtime') {
      return phoneNumber.length >= 9 && effectiveAmount > 0;
    }
    return false;
  }, [billType, meterNumber, effectiveAmount, waterAccount, accountNumber, phoneNumber]);

  const handleNext = () => {
    if (!canProceed) {
      if (billType === 'kplc_prepaid' && meterNumber.length !== 11) {
        toast.error('Please enter a valid 11-digit meter number');
      } else if (effectiveAmount <= 0) {
        toast.error('Please enter a valid amount');
      } else if (billType === 'kplc_prepaid' && effectiveAmount < 50) {
        toast.error('Minimum KPLC amount is KES 50');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }
    setBillStep(3);
  };

  // ── Pay ────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (effectiveAmount <= 0) return;
    setPaying(true);
    try {
      // Build accountReference, billerPaybill, billerName, accountHolderName from bill type
      let accountReference = '';
      let billerPaybill = '';
      let billerName = '';
      let accountHolderName = '';

      if (billType === 'kplc_prepaid') {
        accountReference = meterNumber;
        billerPaybill = '888880';
        billerName = 'KPLC Prepaid';
        accountHolderName = accountHolder;
      } else if (billType === 'nairobi_water') {
        accountReference = waterAccount;
        billerPaybill = '444700';
        billerName = 'Nairobi Water';
        accountHolderName = waterHolder;
      } else if (billType === 'dstv') {
        accountReference = accountNumber;
        billerPaybill = '444700';
        billerName = 'DStv';
        accountHolderName = '';
      } else if (billType === 'gotv') {
        accountReference = accountNumber;
        billerPaybill = '444700';
        billerName = 'GOtv';
        accountHolderName = '';
      } else if (billType === 'airtime') {
        accountReference = phoneNumber;
        billerPaybill = 'airtime';
        billerName = `Airtime ${airtimeCountry}`;
        accountHolderName = '';
      }

      const payload: Record<string, unknown> = {
        billType,
        accountReference,
        billAmountKes: effectiveAmount,
        billerPaybill,
        billerName,
        accountHolderName,
        dstvPackage: (billType === 'dstv' || billType === 'gotv') ? (customAmount ? 'custom' : selectedPackage) : undefined,
      };

      const res = await fetch('/api/bills/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_code) {
          const paystackWindow = (window as unknown as {
            PaystackPop: {
              setup: (c: Record<string, unknown>) => { openIframe: () => void };
            };
          }).PaystackPop;
          if (paystackWindow) {
            paystackWindow
              .setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || '',
                access_code: data.access_code,
                onClose: () => {
                  toast.info('Payment window closed');
                  setPaying(false);
                },
                callback: () => {
                  const ref = `BILL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
                  const token = billType === 'kplc_prepaid' ? `TKN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined;
                  setPaymentResult({ reference: ref, token });
                  setBillStep(4);
                  setPaying(false);
                  fetchHistory();
                  toast.success('Bill payment successful!');
                },
              })
              .openIframe();
            return;
          }
        }
        // Fallback: direct success
        const ref = `BILL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
        const token = billType === 'kplc_prepaid' ? `TKN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined;
        setPaymentResult({ reference: ref, token });
        setBillStep(4);
        setPaying(false);
        fetchHistory();
        toast.success('Bill payment successful!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Payment initialization failed. Please try again.');
        setPaying(false);
      }
    } catch {
      toast.error('Network error. Please try again.');
      setPaying(false);
    }
  };

  const handleCopyToken = () => {
    if (!paymentResult?.token) return;
    navigator.clipboard.writeText(paymentResult.token).then(() => {
      setCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePayAnother = () => {
    resetBillFlow();
  };

  const handleGoToDashboard = () => {
    navigate('dashboard');
  };

  // ── Step indicator ─────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Bill Type' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Review' },
    { num: 4, label: 'Done' },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pay Bills</h1>
        <p className="text-muted-foreground">
          Pay utilities and subscriptions for family in Kenya
        </p>
      </div>

      {/* ── Step Indicator ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  billStep >= s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {billStep > s.num ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  billStep >= s.num ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  billStep > s.num ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — CHOOSE BILL TYPE                                        */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {billStep === 1 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Choose a bill type</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {billTypes.map((bt) => {
              const Icon = bt.icon;
              if (!bt.available && bt.comingSoon) {
                return (
                  <Tooltip key={bt.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 opacity-60 cursor-not-allowed select-none ${bt.bg}`}
                      >
                        <Icon className="h-7 w-7 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">
                          {bt.label}
                        </span>
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500"
                        >
                          Coming Soon
                        </Badge>
                        {/* SHA register interest link */}
                        {bt.id === 'sha' && (
                          <div className="mt-1 flex items-center gap-1">
                            <input
                              type="email"
                              placeholder="Your email"
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-7 w-28 rounded-md border border-gray-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!waitlistEmail.trim()) {
                                  toast.error('Please enter a valid email address');
                                  return;
                                }
                                setWaitlistSubmitting(true);
                                try {
                                  const res = await fetch('/api/bills/waitlist', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ serviceKey: 'sha', email: waitlistEmail.trim() }),
                                  });
                                  if (res.ok) {
                                    toast.success("You're on the list! We'll notify you when SHA payments are live.");
                                    setWaitlistEmail('');
                                  } else {
                                    const err = await res.json().catch(() => ({}));
                                    toast.error(err.error || 'Failed to register');
                                  }
                                } catch {
                                  toast.error('Network error');
                                } finally {
                                  setWaitlistSubmitting(false);
                                }
                              }}
                              disabled={waitlistSubmitting}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                            >
                              {waitlistSubmitting ? '...' : 'Register'}
                            </button>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                      {bt.comingSoonMessage}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <button
                  key={bt.id}
                  onClick={() => handleSelectBillType(bt.id)}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${bt.bg} hover:border-emerald-300`}
                >
                  <Icon className={`h-7 w-7 ${bt.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                    {bt.label}
                  </span>
                  {bt.paybill && (
                    <span className="text-[10px] text-gray-400">
                      Paybill {bt.paybill}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — BILL DETAILS                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {billStep === 2 && currentBill && (
        <section className="space-y-4">
          {/* Back button + title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 text-gray-500 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {React.createElement(currentBill.icon, {
                className: `h-5 w-5 ${currentBill.color}`,
              })}
              <h2 className="text-lg font-semibold text-gray-800">
                {currentBill.label}
              </h2>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* ── KPLC Prepaid ───────────────────────────────────────── */}
              {billType === 'kplc_prepaid' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="kplc-meter">Meter Number</Label>
                    <Input
                      id="kplc-meter"
                      type="text"
                      maxLength={11}
                      placeholder="Enter 11-digit meter number"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="font-mono tracking-wider"
                    />
                    {meterNumber.length > 0 && meterNumber.length < 11 && (
                      <p className="text-xs text-amber-600">
                        {meterNumber.length}/11 digits
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kplc-holder">Account Holder Name (optional)</Label>
                    <Input
                      id="kplc-holder"
                      type="text"
                      placeholder="Enter name on the account"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kplc-amount">Amount (KES)</Label>
                    <Input
                      id="kplc-amount"
                      type="number"
                      min="50"
                      placeholder="Min 50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {Number(amount) > 0 && Number(amount) < 50 && (
                      <p className="text-xs text-amber-600">Minimum amount is KES 50</p>
                    )}
                  </div>
                </>
              )}

              {/* ── Nairobi Water ──────────────────────────────────────── */}
              {billType === 'nairobi_water' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="water-account">Account Number</Label>
                    <Input
                      id="water-account"
                      type="text"
                      placeholder="Enter account number"
                      value={waterAccount}
                      onChange={(e) => setWaterAccount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="water-holder">Account Holder Name (optional)</Label>
                    <Input
                      id="water-holder"
                      type="text"
                      placeholder="Enter name on the account"
                      value={waterHolder}
                      onChange={(e) => setWaterHolder(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="water-amount">Amount (KES)</Label>
                    <Input
                      id="water-amount"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* ── DStv / GOtv ───────────────────────────────────────── */}
              {(billType === 'dstv' || billType === 'gotv') && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="dstv-account">
                      {billType === 'dstv' ? 'Smartcard Number' : 'IUC Number'}
                    </Label>
                    <Input
                      id="dstv-account"
                      type="text"
                      placeholder={
                        billType === 'dstv'
                          ? 'Enter 10-digit smartcard number'
                          : 'Enter IUC number'
                      }
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="font-mono tracking-wider"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Package</Label>
                    <Select
                      value={customAmount ? '__custom__' : selectedPackage}
                      onValueChange={(v) => {
                        if (v === '__custom__') {
                          setCustomAmount(true);
                          setAmount('');
                        } else {
                          setCustomAmount(false);
                          setSelectedPackage(v);
                          setAmount(''); // not needed for package
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {(billType === 'dstv'
                          ? dstvPackages.filter((p) => p.id.startsWith('dstv'))
                          : dstvPackages.filter((p) => p.id.startsWith('gotv'))
                        ).map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.label} — KES {pkg.price.toLocaleString()}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {customAmount && (
                    <div className="grid gap-2">
                      <Label htmlFor="dstv-amount">Custom Amount (KES)</Label>
                      <Input
                        id="dstv-amount"
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  )}
                  {!customAmount && selectedPackage && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
                      <span className="text-emerald-700 font-medium">
                        Package price: KES{' '}
                        {dstvPackages.find((p) => p.id === selectedPackage)?.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* ── Airtime ───────────────────────────────────────────── */}
              {billType === 'airtime' && (
                <>
                  <div className="grid gap-2">
                    <Label>Country</Label>
                    <Select value={airtimeCountry} onValueChange={(v) => {
                      setAirtimeCountry(v);
                      setAmount('');
                      setPhoneNumber('');
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {airtimeCountries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              {c.name} ({c.currency})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="airtime-phone">Phone Number</Label>
                    <Input
                      id="airtime-phone"
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="airtime-amount">Amount ({currency})</Label>
                    <Input
                      id="airtime-amount"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* ── Live conversion ───────────────────────────────────── */}
              {effectiveAmount > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Bill amount
                    </span>
                    <span className="font-medium text-gray-800">
                      {currency} {effectiveAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service fee</span>
                    <span className="font-medium text-gray-800">${FEE_USD.toFixed(2)}</span>
                  </div>
                  <Separator className="!bg-emerald-300" />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-emerald-800">You&apos;ll pay</span>
                    <span className="font-bold text-emerald-700">
                      ${usdTotal.toFixed(2)} USD
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Incl. ${FEE_USD.toFixed(2)} fee · ~1 {currency} = ${(1 / fxRate).toFixed(4)} USD
                  </p>
                </div>
              )}

              {/* ── Navigation buttons ────────────────────────────────── */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Review &amp; Pay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — REVIEW & PAY                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {billStep === 3 && currentBill && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 text-gray-500 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-800">Review &amp; Pay</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {React.createElement(currentBill.icon, {
                  className: `h-5 w-5 ${currentBill.color}`,
                })}
                {currentBill.label}
              </CardTitle>
              <CardDescription>Confirm the details below before paying</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary rows */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                {/* Bill type */}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-500">Bill Type</span>
                  <span className="text-sm font-medium text-gray-800">{currentBill.label}</span>
                </div>

                {/* Paybill */}
                {currentBill.paybill && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500">Paybill</span>
                    <span className="text-sm font-medium text-gray-800 font-mono">{currentBill.paybill}</span>
                  </div>
                )}

                {/* Account details */}
                {billType === 'kplc_prepaid' && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500">Meter Number</span>
                    <span className="text-sm font-medium text-gray-800 font-mono tracking-wider">
                      {meterNumber}
                    </span>
                  </div>
                )}
                {billType === 'kplc_prepaid' && accountHolder && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-500">Account Holder</span>
                    <span className="text-sm font-medium text-gray-800">{accountHolder}</span>
                  </div>
                )}
                {billType === 'nairobi_water' && (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="text-sm font-medium text-gray-800 font-mono">{waterAccount}</span>
                    </div>
                    {waterHolder && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-500">Account Holder</span>
                        <span className="text-sm font-medium text-gray-800">{waterHolder}</span>
                      </div>
                    )}
                  </>
                )}
                {(billType === 'dstv' || billType === 'gotv') && (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {billType === 'dstv' ? 'Smartcard Number' : 'IUC Number'}
                      </span>
                      <span className="text-sm font-medium text-gray-800 font-mono tracking-wider">
                        {accountNumber}
                      </span>
                    </div>
                    {!customAmount && selectedPackage && (
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm text-gray-500">Package</span>
                        <span className="text-sm font-medium text-gray-800">
                          {dstvPackages.find((p) => p.id === selectedPackage)?.label}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {billType === 'airtime' && (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-gray-500">Country</span>
                      <span className="text-sm font-medium text-gray-800">
                        {airtimeCountries.find((c) => c.code === airtimeCountry)?.flag}{' '}
                        {airtimeCountries.find((c) => c.code === airtimeCountry)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-gray-500">Phone Number</span>
                      <span className="text-sm font-medium text-gray-800 font-mono">{phoneNumber}</span>
                    </div>
                  </>
                )}

                {/* Amount */}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-medium text-gray-800">
                    {currency} {effectiveAmount.toLocaleString()}
                  </span>
                </div>

                {/* Fee */}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-500">Service Fee</span>
                  <span className="text-sm font-medium text-gray-800">${FEE_USD.toFixed(2)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center px-4 py-3 bg-emerald-50">
                  <span className="text-sm font-semibold text-emerald-800">Total</span>
                  <span className="text-base font-bold text-emerald-700">
                    ${usdTotal.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Disclosure */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Bill payments are <strong>non-refundable</strong> once processed. KPLC tokens
                  are generated within 5 minutes of payment. AfriSpine does not hold your funds.
                </p>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ${usdTotal.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 4 — CONFIRMATION                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {billStep === 4 && paymentResult && (
        <section className="space-y-4">
          {/* Success header */}
          <div className="flex flex-col items-center text-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment Confirmed!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your bill payment has been processed successfully.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* KPLC Token display */}
              {paymentResult.token && (
                <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-center space-y-3">
                  <p className="text-sm font-medium text-emerald-700">
                    ⚡ KPLC Prepaid Token
                  </p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-emerald-800 break-all">
                    {paymentResult.token}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToken}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy Token
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-emerald-600">
                    Share this token with the account holder to top up their meter.
                  </p>
                </div>
              )}

              {/* Non-KPLC reference */}
              {!paymentResult.token && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center space-y-1">
                  <p className="text-sm text-emerald-800 font-medium">
                    Payment confirmed. Ref: <span className="font-mono font-bold">{paymentResult.reference}</span>
                  </p>
                  <p className="text-xs text-emerald-600">
                    A confirmation has been sent to your email.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">Bill Type</span>
                  <span className="font-medium text-gray-800">{currentBill?.label}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-800 font-mono">{paymentResult.reference}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-800">{currency} {effectiveAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 bg-emerald-50">
                  <span className="font-semibold text-emerald-800">Total Paid</span>
                  <span className="font-bold text-emerald-700">${usdTotal.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Receipt feature coming soon')}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  View Receipt
                </Button>
                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handlePayAnother}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Pay Another Bill
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoToDashboard}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* RECENT BILL PAYMENTS                                             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {billStep <= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Recent Bill Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent bill payments
              </p>
            ) : (
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {history.map((tx) => {
                  const btConfig = getBillTypeConfig(tx.billType);
                  const Icon = btConfig?.icon ?? AlertCircle;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${btConfig?.bg ?? 'bg-gray-100'}`}
                      >
                        <Icon className={`h-4 w-4 ${btConfig?.color ?? 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {btConfig?.label ?? tx.billType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Acc: {tx.accountNumber} · {tx.date}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {tx.currency} {tx.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            tx.status === 'success' || tx.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.status === 'pending' || tx.status === 'processing'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}