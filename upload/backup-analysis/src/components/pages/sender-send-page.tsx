'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  Timer,
  User,
  Building2,
  Zap,
  FileText,
  Home,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, Recipient } from '@/stores/app';

function formatCurrency(amount: number, currency: string): string {
  switch (currency) {
    case 'GBP':
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'USD':
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'KES':
      return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    default:
      return `${amount.toFixed(2)} ${currency}`;
  }
}

const stepLabels = ['Amount', 'Quote', 'Recipient', 'Payment', 'Done'];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function StepIndicator({ current, onStepClick }: { current: number; onStepClick: (s: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-0 sm:gap-2 mb-6 sm:mb-8">
      {stepLabels.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5;
        const isActive = i + 1 === current;
        const isCompleted = i + 1 < current;
        return (
          <div key={label} className="flex items-center">
            <button
              onClick={() => { if (isCompleted) onStepClick(stepNum); }}
              disabled={!isCompleted && !isActive}
              className="flex items-center gap-1.5 sm:gap-2 group"
            >
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${
                  isActive
                    ? 'text-emerald-700'
                    : isCompleted
                    ? 'text-emerald-600'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
            {i < stepLabels.length - 1 && (
              <div
                className={`h-0.5 w-4 sm:w-8 mx-1 sm:mx-2 rounded-full transition-colors duration-300 ${
                  i + 1 < current ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1Amount({ direction }: { direction: number }) {
  const { sendFormData, updateSendForm, setSendStep, setCurrentQuote, addToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currencySymbol = sendFormData.sendCurrency === 'GBP' ? '£' : '$';
  const minAmount = 1;
  const maxAmount = 10000;
  const numericAmount = parseFloat(sendFormData.amount) || 0;

  const handleGetQuote = async () => {
    setError('');
    if (numericAmount < minAmount) {
      setError(`Minimum amount is ${currencySymbol}${minAmount}`);
      return;
    }
    if (numericAmount > maxAmount) {
      setError(`Maximum amount is ${currencySymbol}${maxAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCountry: sendFormData.sendCountry === 'UK' ? 'GB' : 'US',
          targetCountry: 'KE',
          sourceCurrency: sendFormData.sendCurrency,
          targetCurrency: 'KES',
          sendAmount: numericAmount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setCurrentQuote(data.quote);
        setSendStep(2);
      } else {
        setError(data.error || 'Failed to get quote. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedReceive = numericAmount > 0 ? (numericAmount * 191.5).toFixed(0) : '0';

  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How much would you like to send?</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter the amount and we&apos;ll give you the best rate</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* You Send */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">You Send</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <Select
                  value={sendFormData.sendCountry}
                  onValueChange={(v) => {
                    const country = v as 'UK' | 'US';
                    const currency = country === 'UK' ? 'GBP' : 'USD';
                    updateSendForm({ sendCountry: country, sendCurrency: currency });
                  }}
                >
                  <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UK">
                      <span className="mr-1">🇬🇧</span> UK (GBP)
                    </SelectItem>
                    <SelectItem value="US">
                      <span className="mr-1">🇺🇸</span> US (USD)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl font-bold text-gray-400">
                {currencySymbol}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={sendFormData.amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateSendForm({ amount: val });
                  }
                }}
                className="h-16 sm:h-20 pl-10 sm:pl-14 pr-4 text-2xl sm:text-4xl font-bold border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-xl"
                min={minAmount}
                max={maxAmount}
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Min: {currencySymbol}{minAmount} · Max: {currencySymbol}{maxAmount.toLocaleString()}
            </p>
          </div>

          {/* Exchange Rate Visual */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* They Receive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">They Receive</Label>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                🇰🇪 Kenya · M-Pesa
              </Badge>
            </div>
            <div className="relative bg-emerald-50 rounded-xl p-4 sm:p-5 border border-emerald-100">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg sm:text-2xl font-bold text-emerald-400">
                KSh
              </span>
              <div className="pl-14 sm:pl-20 text-2xl sm:text-4xl font-bold text-emerald-700">
                {numericAmount > 0 ? Number(estimatedReceive).toLocaleString() : '—'}
              </div>
              {numericAmount > 0 && (
                <p className="text-xs text-emerald-600 mt-2">
                  Estimated · Rate: 1 {sendFormData.sendCurrency} ≈ 191.50 KES
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 text-center bg-red-50 py-2 px-4 rounded-lg"
        >
          {error}
        </motion.p>
      )}

      <Button
        onClick={handleGetQuote}
        disabled={loading || numericAmount < minAmount}
        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base"
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : null}
        {loading ? 'Getting Quote...' : 'Get Quote'}
      </Button>
    </motion.div>
  );
}

function Step2Quote({ direction }: { direction: number }) {
  const { currentQuote, setSendStep, addToast } = useAppStore();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!currentQuote?.expiresAt) return;
    const update = () => {
      const diff = new Date(currentQuote.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentQuote]);

  if (!currentQuote) return null;

  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Confirm Your Quote</h2>
        <p className="text-sm text-muted-foreground mt-1">Review the details before proceeding</p>
      </div>

      {/* Expiry */}
      <div className="flex items-center justify-center gap-2">
        <Timer className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-600">
          Quote expires in {timeLeft}
        </span>
      </div>

      {/* Quote Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4 text-white text-center">
          <p className="text-sm text-emerald-100">They Receive</p>
          <p className="text-3xl sm:text-4xl font-bold mt-1">
            {formatCurrency(currentQuote.receiveAmount, currentQuote.receiveCurrency)}
          </p>
        </div>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">You Send</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(currentQuote.sendAmount, currentQuote.sendCurrency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Exchange Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                1 {currentQuote.sendCurrency} = {currentQuote.fxRate.toFixed(2)} KES
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transfer Fee</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(currentQuote.fee, currentQuote.sendCurrency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Charge</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(currentQuote.totalCharge, currentQuote.sendCurrency)}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium text-gray-900">{currentQuote.provider}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Est. Delivery</span>
            <span className="font-medium text-emerald-600">{currentQuote.estimatedDelivery}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setSendStep(1)}
          className="flex-1 h-14 border-gray-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edit Amount
        </Button>
        <Button
          onClick={() => setSendStep(3)}
          className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Confirm Quote
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function Step3Recipient({ direction }: { direction: number }) {
  const {
    recipients,
    setRecipients,
    sendFormData,
    updateSendForm,
    setSendStep,
    setCurrentTransfer,
    currentQuote,
    user,
    addToast,
  } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(sendFormData.recipientId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipients() {
      try {
        const token = localStorage.getItem('afrispine_token');
        const res = await fetch('/api/recipients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecipients(data.recipients || data || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchRecipients();
  }, [setRecipients]);

  const handleAddRecipient = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    setAdding(true);
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch('/api/recipients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), country: 'Kenya', mobileMoney: 'M-Pesa' }),
      });
      const data = await res.json();
      if (res.ok) {
        const newRecipient = data.recipient || data;
        setRecipients([...recipients, newRecipient]);
        addToast('Recipient added successfully', 'success');
        setShowAddForm(false);
        setNewName('');
        setNewPhone('');
        handleSelectRecipient(newRecipient.id);
      } else {
        addToast(data.error || 'Failed to add recipient', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleSelectRecipient = (id: string) => {
    setSelectedId(id);
    updateSendForm({ recipientId: id });
  };

  const handleContinue = async () => {
    if (!selectedId) {
      addToast('Please select a recipient', 'error');
      return;
    }
    // Create a pending transfer
    if (currentQuote) {
      try {
        const token = localStorage.getItem('afrispine_token');
        const res = await fetch('/api/transfers', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteId: currentQuote.id,
            recipientId: selectedId,
            sendAmount: currentQuote.sendAmount,
            receiveAmount: currentQuote.receiveAmount,
          }),
        });
        const data = await res.json();
        if (res.ok && data.transfer) {
          setCurrentTransfer(data.transfer);
          setSendStep(4);
        } else {
          addToast(data.error || 'Failed to create transfer', 'error');
        }
      } catch {
        addToast('Network error', 'error');
      }
    } else {
      setSendStep(4);
    }
  };

  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Select Recipient</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose who will receive the money</p>
      </div>

      {/* KYC Notice */}
      {user?.kycStatus !== 'verified' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">KYC Verification Required</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Complete identity verification to send money. Go to Profile to verify.
            </p>
          </div>
        </div>
      )}

      {/* Recipient List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {recipients.map((r: Recipient) => (
            <button
              key={r.id}
              onClick={() => handleSelectRecipient(r.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                selectedId === r.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                    M-Pesa
                  </Badge>
                  {selectedId === r.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center"
                    >
                      <Check className="h-3.5 w-3.5 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add New Recipient */}
      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Add New Recipient</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      placeholder="e.g. John Kamau"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      placeholder="e.g. +254 712 345 678"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="mt-1 h-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowAddForm(false); setNewName(''); setNewPhone(''); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddRecipient}
                    disabled={adding || !newName.trim() || !newPhone.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-600"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Recipient
          </Button>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setSendStep(2)}
          className="flex-1 h-14 border-gray-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedId || user?.kycStatus !== 'verified'}
          className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function Step4Payment({ direction }: { direction: number }) {
  const {
    currentQuote,
    currentTransfer,
    sendFormData,
    setSendStep,
    addToast,
  } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!currentTransfer?.id) {
      addToast('No active transfer found', 'error');
      return;
    }
    setPaying(true);
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferId: currentTransfer.id,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Payment successful!', 'success');
        if (data.transfer) {
          setCurrentTransfer(data.transfer);
        }
        setSendStep(5);
      } else {
        addToast(data.error || 'Payment failed. Please try again.', 'error');
      }
    } catch {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setPaying(false);
    }
  };

  if (!currentQuote) return null;

  const currencySymbol = currentQuote.sendCurrency === 'GBP' ? '£' : '$';

  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose your payment method</p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <button
          onClick={() => setPaymentMethod('card')}
          className={`w-full rounded-xl border-2 p-4 transition-all duration-200 text-left ${
            paymentMethod === 'card'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">Card Payment</p>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px]">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Debit cards</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'card' ? 'border-emerald-600' : 'border-gray-300'
            }`}>
              {paymentMethod === 'card' && (
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() => {}}
          disabled
          className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 p-4 text-left opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-500">Bank Transfer</p>
                <Badge variant="secondary" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Direct bank-to-bank transfer</p>
            </div>
          </div>
        </button>
      </div>

      {/* Summary */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-5 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Send Amount</span>
              <span className="font-medium">{formatCurrency(currentQuote.sendAmount, currentQuote.sendCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Fee</span>
              <span className="font-medium">{formatCurrency(currentQuote.fee, currentQuote.sendCurrency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900">Total Charge</span>
              <span className="font-bold text-gray-900">{formatCurrency(currentQuote.totalCharge, currentQuote.sendCurrency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient Receives</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(currentQuote.receiveAmount, currentQuote.receiveCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium">{currentQuote.estimatedDelivery}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Shield className="h-3.5 w-3.5" />
        <span>Secured with 256-bit SSL encryption</span>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setSendStep(3)}
          disabled={paying}
          className="flex-1 h-14 border-gray-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handlePay}
          disabled={paying}
          className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base"
        >
          {paying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay {formatCurrency(currentQuote.totalCharge, currentQuote.sendCurrency)}</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function Step5Confirmation({ direction }: { direction: number }) {
  const { currentQuote, currentTransfer, resetSendFlow, navigate, addToast } = useAppStore();

  const handleDownloadReceipt = () => {
    addToast('Receipt downloaded', 'success');
  };

  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6 text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mx-auto"
      >
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.4 }}
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Money Sent!</h2>
        <p className="text-muted-foreground mt-1">Your transfer is on its way</p>
      </motion.div>

      {/* Transfer Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5 sm:p-6">
            {/* Reference */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground">Reference Number</p>
              <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">
                {currentTransfer?.reference || 'AS-' + Date.now().toString().slice(-8)}
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Sent</span>
                <span className="font-medium">
                  {currentQuote
                    ? formatCurrency(currentQuote.sendAmount, currentQuote.sendCurrency)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Received</span>
                <span className="font-semibold text-emerald-600">
                  {currentQuote
                    ? formatCurrency(currentQuote.receiveAmount, currentQuote.receiveCurrency)
                    : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{currentTransfer?.recipientName || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Delivery</span>
                <span className="font-medium">
                  {currentQuote?.estimatedDelivery || 'Instant'}
                </span>
              </div>
            </div>

            <div className="mt-4 bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">
                Processing — will be delivered instantly
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <Button
          onClick={resetSendFlow}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Send Another
        </Button>

        {currentTransfer?.id && (
          <Button
            variant="outline"
            onClick={() => navigate('sender-transfer-detail', { id: currentTransfer.id })}
            className="w-full h-12 border-gray-200"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Transfer
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate('sender-dashboard')}
          className="w-full h-12 text-emerald-600"
        >
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function SenderSendPage() {
  const { sendStep, setSendStep, resetSendFlow, goBack } = useAppStore();
  const [direction, setDirection] = useState(1);

  const handleStepClick = useCallback(
    (step: number) => {
      setDirection(step > sendStep ? 1 : -1);
      setSendStep(step as 1 | 2 | 3 | 4 | 5);
    },
    [sendStep, setSendStep]
  );

  const stepRenderer = () => {
    switch (sendStep) {
      case 1:
        return <Step1Amount direction={direction} />;
      case 2:
        return <Step2Quote direction={direction} />;
      case 3:
        return <Step3Recipient direction={direction} />;
      case 4:
        return <Step4Payment direction={direction} />;
      case 5:
        return <Step5Confirmation direction={direction} />;
      default:
        return <Step1Amount direction={direction} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        {sendStep < 5 && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* Step Indicator */}
        {sendStep < 5 && (
          <StepIndicator current={sendStep} onStepClick={handleStepClick} />
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          {stepRenderer()}
        </AnimatePresence>
      </div>
    </div>
  );
}