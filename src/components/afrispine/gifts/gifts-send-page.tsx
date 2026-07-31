'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Gift,
  ShoppingCart,
  MessageSquareHeart,
  CheckCircle2,
  Copy,
  Send,
  MessageCircle,
  Search,
} from 'lucide-react';
import {
  allMerchants,
  getMerchantsByCountry,
  getMerchantById,
  MERCH_CATEGORIES,
  MERCH_COUNTRIES,
  type Merchant,
} from '@/lib/merchants';

/* ------------------------------------------------------------------ */
/*  Static data                                                       */
/* ------------------------------------------------------------------ */

const OCCASIONS = [
  { id: 'christmas', label: 'Christmas', emoji: '🎄' },
  { id: 'new-baby', label: 'New Baby', emoji: '👶' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'new-home', label: 'New Home', emoji: '🏠' },
  { id: 'get-well', label: 'Get Well', emoji: '💐' },
  { id: 'eid-xmas', label: 'Eid / Xmas', emoji: '🌙' },
] as const;

/* ── Merchant logo component with fallback ────────────────────── */

function MerchantLogo({ merchant, size = 'md' }: { merchant: Merchant; size?: 'sm' | 'md' }) {
  const containerSize = size === 'sm' ? 'h-10 w-10 rounded-lg' : 'h-12 w-12 rounded-xl';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="relative">
      <img
        src={merchant.logoUrl}
        alt={merchant.name}
        className={`h-10 w-10 object-contain rounded ${size === 'sm' ? 'h-8 w-8 rounded-lg' : ''}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className={`hidden ${containerSize} bg-emerald-600 flex items-center justify-center text-white font-bold ${textSize}`}>
        {merchant.name.charAt(0)}
      </div>
    </div>
  );
}

const PRESET_AMOUNTS = [10, 20, 50, 100] as const;

const DELIVERY_OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Email', icon: Send },
  { id: 'copy-link', label: 'Copy Link', icon: Copy },
] as const;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProgressIndicator({ step }: { step: number }) {
  const labels = ['Occasion', 'Merchant', 'Personalise', 'Done'];
  return (
    <div className="flex items-center gap-1 w-full">
      {labels.map((label, i) => {
        const num = i + 1;
        const active = num <= step;
        const current = num === step;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  num <= step ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  current
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {active ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  current
                    ? 'text-emerald-600'
                    : active
                      ? 'text-emerald-500'
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
  );
}

function VoucherPreviewCard({
  merchant,
  amount,
  recipientName,
  message,
  occasion,
}: {
  merchant?: Merchant;
  amount: number;
  recipientName: string;
  message: string;
  occasion?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-lg">
      {/* decorative circles */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {occasion ? `${OCCASIONS.find((o) => o.id === occasion)?.emoji || ''} Gift Voucher` : 'Gift Voucher'}
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            &pound;{amount}
          </span>
        </div>

        {merchant && (
          <div className="flex items-center gap-2">
            <MerchantLogo merchant={merchant} size="sm" />
            <span className="text-sm font-medium opacity-90">
              {merchant.name} &middot; {merchant.country}
            </span>
          </div>
        )}

        {recipientName && (
          <p className="text-sm opacity-80">
            To: <span className="font-semibold text-white">{recipientName}</span>
          </p>
        )}

        {message && (
          <p className="rounded-lg bg-white/10 px-3 py-2 text-xs italic leading-relaxed backdrop-blur-sm">
            &ldquo;{message}&rdquo;
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            AfriSpine Gifts
          </span>
          <div className="h-0.5 w-16 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function GiftsSendPage() {
  const { navigate, viewParams } = useAppStore();

  // Form state
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);
  const [voucherRef, setVoucherRef] = useState('');

  // Auto-advance if occasion came from viewParams
  useEffect(() => {
    if (viewParams?.occasion) {
      const found = OCCASIONS.find(
        (o) => o.id === viewParams.occasion || o.label.toLowerCase() === viewParams.occasion.toLowerCase(),
      );
      if (found) {
        setOccasion(found.id);
        setStep(2);
      }
    }
  }, [viewParams]);

  // Derived
  const effectiveAmount = customAmount ? Number(customAmount) : amount;
  const selectedMerchant = getMerchantById(merchantId);
  const selectedOccasion = OCCASIONS.find((o) => o.id === occasion);

  const filteredMerchants = useMemo(() => {
    let list = countryFilter === 'all' ? allMerchants : getMerchantsByCountry(countryFilter);
    if (categoryFilter !== 'all') {
      list = list.filter((m) => m.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    return list;
  }, [countryFilter, categoryFilter, searchQuery]);

  const goBack = useCallback(() => navigate('gifts'), [navigate]);
  const prevStep = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  /* ---- Step 1: Occasion ---- */
  const handleOccasionSelect = useCallback((id: string) => {
    setOccasion(id);
    setStep(2);
  }, []);

  /* ---- Step 2: Merchant + Amount ---- */
  const handleNextFromStep2 = useCallback(() => {
    if (!merchantId) {
      toast.error('Please select a merchant');
      return;
    }
    if (!effectiveAmount || effectiveAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setStep(3);
  }, [merchantId, effectiveAmount]);

  /* ---- Step 3: Personalise + Pay ---- */
  const handlePay = useCallback(async () => {
    if (!recipientName.trim()) {
      toast.error('Please enter the recipient\'s name');
      return;
    }
    if (!senderName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      // 1. Call purchase API
      const res = await fetch('/api/gifts/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          merchantName: selectedMerchant?.name || '',
          occasion,
          amountGbp: effectiveAmount,
          recipientName,
          recipientPhone: '',
          recipientEmail: '',
          senderMessage: message,
          deliveryMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Payment failed');
        return;
      }

      // 2. Open payment popup
      const PaystackPop = (await import('@paystack/inline-js')).default;
      const paystack = new PaystackPop();
      paystack.resumeTransaction(data.access_code, {
        onSuccess: async () => {
          // 3. Verify and get voucher details
          try {
            const verifyRes = await fetch('/api/gifts/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: data.reference }),
            });
            const voucherResult = await verifyRes.json();
            setVoucherData(voucherResult.voucher || null);
            setVoucherRef(data.voucherRef);
            setStep(4);
            toast.success('Gift voucher sent!');
          } catch {
            setVoucherRef(data.voucherRef);
            setStep(4);
            toast.success('Gift voucher sent!');
          }
        },
        onClose: () => {
          toast.error('Payment window was closed.');
        },
        onError: () => {
          toast.error('Payment failed.');
        },
      });
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [recipientName, senderName, merchantId, selectedMerchant, occasion, effectiveAmount, message, deliveryMethod]);

  /* ---- Step 4: Confirmation ---- */
  const handleShareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `Hey ${recipientName}! I sent you a ${effectiveAmount} ${selectedMerchant?.name || ''} gift voucher via AfriSpine 🎁`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [recipientName, effectiveAmount, selectedMerchant]);

  const handleSendAnother = useCallback(() => {
    setStep(1);
    setOccasion('');
    setMerchantId('');
    setAmount(20);
    setCustomAmount('');
    setRecipientName('');
    setSenderName('');
    setMessage('');
    setDeliveryMethod('whatsapp');
    setLoading(false);
    setVoucherData(null);
    setVoucherRef('');
  }, []);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-white">
      {/* Back bar */}
      {step > 1 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
          <button
            onClick={prevStep}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <ProgressIndicator step={step} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 pb-8 pt-6">
        {/* ============================================================ */}
        {/*  STEP 1 — CHOOSE OCCASION                                    */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Gift className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Send a Gift
              </h1>
              <p className="text-sm text-muted-foreground">
                What&apos;s the occasion?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => handleOccasionSelect(occ.id)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span className="text-3xl transition-transform group-hover:scale-110">
                    {occ.emoji}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {occ.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 2 — CHOOSE MERCHANT & AMOUNT                           */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-6">
            {selectedOccasion && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{selectedOccasion.emoji}</span>
                <span>
                  <span className="font-medium text-foreground">{selectedOccasion.label}</span> —
                  Choose a merchant
                </span>
              </div>
            )}

            {/* Merchant grid */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                <ShoppingCart className="mr-1.5 inline h-4 w-4" />
                Select Merchant
              </Label>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search merchants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Country filter pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCountryFilter('all')}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    countryFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  All
                </button>
                {MERCH_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountryFilter(c.code)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      countryFilter === c.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>

              {/* Category filter pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {MERCH_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Merchant count */}
              <p className="text-xs text-muted-foreground">
                Showing {filteredMerchants.length} merchant{filteredMerchants.length !== 1 ? 's' : ''}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {filteredMerchants.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMerchantId(m.id)}
                    className={`relative flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all text-left ${
                      merchantId === m.id
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-md shadow-emerald-500/10'
                        : 'border-border/60 bg-white hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    {merchantId === m.id && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <MerchantLogo merchant={m} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {MERCH_COUNTRIES.find((c) => c.code === m.countryCode)?.flag} {m.country} &middot; {m.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount selector */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Gift Amount
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount('');
                    }}
                    className={`rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all ${
                      !customAmount && amount === a
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-border/60 bg-white text-gray-700 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    &pound;{a}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  &pound;
                </span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Or enter a custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setAmount(0);
                  }}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recipient gets the equivalent in local currency at today&apos;s AfriSpine FX rate.
              </p>
            </div>

            {/* Continue */}
            <Button
              onClick={handleNextFromStep2}
              disabled={!merchantId || !effectiveAmount || effectiveAmount <= 0}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 3 — PERSONALISE & PAY                                  */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-gray-900">
                <MessageSquareHeart className="mr-1.5 inline h-5 w-5 text-emerald-500" />
                Personalise Your Gift
              </h2>
              <p className="text-sm text-muted-foreground">
                Make it special for {selectedOccasion?.label ?? 'them'}
              </p>
            </div>

            {/* Form fields */}
            <div className="space-y-4 rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <div className="grid gap-2">
                <Label htmlFor="recipient-name">Recipient&apos;s Name</Label>
                <Input
                  id="recipient-name"
                  placeholder="e.g. Amina"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sender-name">Your Name</Label>
                <Input
                  id="sender-name"
                  placeholder="e.g. David"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gift-message">Personal Message</Label>
                  <span
                    className={`text-xs font-medium ${
                      message.length > 140 ? 'text-red-500' : 'text-muted-foreground'
                    }`}
                  >
                    {message.length}/140
                  </span>
                </div>
                <Textarea
                  id="gift-message"
                  placeholder="e.g. Happy Birthday! Enjoy shopping at Naivas 🎉"
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= 140) setMessage(e.target.value);
                  }}
                  className="min-h-20 resize-none"
                />
              </div>

              {/* Delivery method */}
              <div className="grid gap-2">
                <Label>Delivery Method</Label>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={setDeliveryMethod}
                  className="grid grid-cols-3 gap-2"
                >
                  {DELIVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      htmlFor={`delivery-${opt.id}`}
                      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                        deliveryMethod === opt.id
                          ? 'border-emerald-500 bg-emerald-50/60'
                          : 'border-border/60 hover:border-emerald-300'
                      }`}
                    >
                      <RadioGroupItem value={opt.id} id={`delivery-${opt.id}`} className="sr-only" />
                      <opt.icon
                        className={`h-5 w-5 ${
                          deliveryMethod === opt.id ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          deliveryMethod === opt.id ? 'text-emerald-700' : 'text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Voucher preview */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Voucher Preview
              </Label>
              <VoucherPreviewCard
                merchant={selectedMerchant}
                amount={effectiveAmount}
                recipientName={recipientName}
                message={message}
                occasion={occasion}
              />
            </div>

            {/* Pay button */}
            <Button
              onClick={handlePay}
              disabled={!recipientName.trim() || !senderName.trim() || loading}
              size="lg"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <>Pay ${effectiveAmount + 1.5} securely</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Includes $1.50 voucher fee · Total: ${effectiveAmount + 1.5}
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 4 — CONFIRMATION                                       */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Gift className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gift sent! <span aria-hidden="true">🎁</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your {selectedOccasion?.label?.toLowerCase() || ''} gift to{' '}
                <span className="font-semibold text-foreground">{voucherData?.recipientName || recipientName}</span>{' '}
                is on its way via {voucherData?.deliveryMethod || deliveryMethod}.
              </p>
            </div>

            {/* Voucher reference card */}
            {voucherRef && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Voucher Code</p>
                <div className="flex items-center justify-between">
                  <code className="text-base font-bold text-amber-900 tracking-wide">{voucherRef}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(voucherRef);
                      toast.success('Voucher code copied!');
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Voucher preview */}
            <VoucherPreviewCard
              merchant={selectedMerchant}
              amount={effectiveAmount}
              recipientName={voucherData?.recipientName || recipientName}
              message={voucherData?.senderMessage || message}
              occasion={occasion}
            />

            {/* Summary card */}
            <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium text-gray-900">{senderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium text-gray-900">{voucherData?.recipientName || recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium text-gray-900">{selectedMerchant?.name} &middot; {selectedMerchant?.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-emerald-600">&pound;{effectiveAmount}</span>
              </div>
              {voucherData?.amountLocal && voucherData?.currencyLocal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Local Equivalent</span>
                  <span className="font-semibold text-gray-900">
                    {voucherData.amountLocal.toLocaleString()} {voucherData.currencyLocal}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voucher Fee</span>
                <span className="text-gray-600">&pound;1.50</span>
              </div>
              <div className="border-t border-border/50 pt-2 flex justify-between">
                <span className="font-medium text-gray-900">Total Charged</span>
                <span className="font-bold text-gray-900">&pound;{effectiveAmount + 1.5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-gray-900 capitalize">{(voucherData?.deliveryMethod || deliveryMethod).replace('-', ' ')}</span>
              </div>
              {voucherData?.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium text-gray-900">{new Date(voucherData.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full bg-[#25D366] text-white hover:bg-[#1ebe57]"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Share on WhatsApp
              </Button>
              <Button
                onClick={handleSendAnother}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Gift className="mr-2 h-5 w-5" />
                Send Another Gift
              </Button>
            </div>
          </div>
        )}

        {/* Step 1 back-to-gifts button at bottom */}
        {step === 1 && (
          <div className="pt-4">
            <Button variant="ghost" onClick={goBack} className="w-full text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gifts
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}