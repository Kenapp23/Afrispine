'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AchievementCard } from '@/components/afrispine/common/achievement-card';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
];

const rails = [
  {
    id: 'mobile_money',
    label: 'Mobile money',
    icon: Smartphone,
    speed: 'Instant',
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
    desc: 'Via MFS Africa — instant settlement across 35 African countries',
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

  return (
    <div className={`flex items-center gap-1.5 text-sm ${urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
      <Clock className="h-3.5 w-3.5" />
      <span>
        Rate locked for {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Step 1: Amount & Corridor ──────────────────────────────────
function StepAmount() {
  const store = useAppStore();
  const [amount, setAmount] = useState(store.sendAmount || '');
  const [corridorKey, setCorridorKey] = useState(`${store.sendCorridor.from}-${store.sendCorridor.to}`);
  const [fetching, setFetching] = useState(false);

  const activeCorridor = corridors.find((c) => `${c.from}-${c.to}` === corridorKey) || corridors[0];

  const fetchQuote = useCallback(async (sendAmt: number) => {
    if (!sendAmt || sendAmt <= 0) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/fx?from=${activeCorridor.from}&to=${activeCorridor.to}&amount=${sendAmt}`);
      let rate = 193.42;
      let fee = 2.99;
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
        totalCharged: sendAmt + fee,
        quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        quoteId: `QT-${Date.now()}`,
      });
    } catch {
      const rate = 193.42;
      const fee = 2.99;
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
        totalCharged: sendAmt + fee,
        quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        quoteId: `QT-${Date.now()}`,
      });
    } finally {
      setFetching(false);
    }
  }, [activeCorridor, store]);

  const handleAmountChange = (val: string) => {
    const num = parseFloat(val);
    setAmount(val);
    if (num > 0) {
      fetchQuote(num);
    }
  };

  const handleCorridorChange = (key: string) => {
    setCorridorKey(key);
  };

  const currentCorridor = corridors.find((c) => `${c.from}-${c.to}` === corridorKey) || corridors[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>How much would you like to send?</CardTitle>
        <CardDescription>Select the corridor and enter the amount</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Corridor selector */}
        <div className="space-y-2">
          <Label>Send from → Receive in</Label>
          <Select value={corridorKey} onValueChange={handleCorridorChange}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {corridors.map((c) => (
                <SelectItem key={`${c.from}-${c.to}`} value={`${c.from}-${c.to}`}>
                  {c.label} ({c.sendLabel} → {c.receiveLabel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sendAmount">You send</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {currentCorridor.sendLabel}
              </span>
              <Input
                id="sendAmount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-16 text-lg font-semibold"
                min="1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>They receive</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {currentCorridor.receiveLabel}
              </span>
              <Input
                readOnly
                value={store.sendAmount > 0 ? store.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}
                className="pl-16 text-lg font-semibold bg-muted/50"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Quote details */}
        {store.sendAmount > 0 && (
          <div className="rounded-lg border border-border p-4 space-y-2">
            {fetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting quote...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exchange rate</span>
                  <span className="font-medium">
                    1 {store.sendCurrency} = {store.fxRate.toFixed(2)} {store.receiveCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transfer fee</span>
                  <span className="font-medium">{store.feeAmount.toFixed(2)} {store.sendCurrency}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total you pay</span>
                  <span className="text-emerald-600">
                    {store.totalCharged.toFixed(2)} {store.sendCurrency}
                  </span>
                </div>
                {store.quoteExpiresAt && <CountdownTimer expiresAt={store.quoteExpiresAt} />}
              </>
            )}
          </div>
        )}

        <Button
          onClick={() => store.setSendStep(2)}
          disabled={store.sendAmount <= 0}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Step 2: Choose Rail ────────────────────────────────────────
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
                className={`relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                  disabled
                    ? 'opacity-50 pointer-events-none'
                    : selected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                {selected && !disabled && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    selected && !disabled ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {'badge' in rail && rail.badge && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] font-bold px-1.5 py-0">
                      {rail.badge as string}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{rail.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rail.desc}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="secondary" className="text-xs">
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
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
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 3: Recipient ─────────────────────────────────────────
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

  const handleContinue = () => {
    if (!name) {
      toast.error('Please enter recipient name');
      return;
    }
    if (store.selectedRail === 'mobile_money' && !phone) {
      toast.error('Please enter recipient phone number');
      return;
    }
    if (store.selectedRail === 'bank' && (!bankName || !accountNumber)) {
      toast.error('Please enter bank details');
      return;
    }
    if (store.selectedRail === 'ripple' && !rippleAddress) {
      toast.error('Please enter Ripple address');
      return;
    }
    if (store.selectedRail === 'papss' && !papssIban) {
      toast.error('Please enter PAPSS IBAN');
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
    KE: 'Kenya', NG: 'Nigeria', GH: 'Ghana', TZ: 'Tanzania', UG: 'Uganda',
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
              {dbRecipients
                .filter((r) => r.country === recipientCountry || true)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectSaved(r.id)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      selectedSaved === r.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                      {r.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.fullName}</p>
                      <p className="text-xs text-muted-foreground">{r.phone || r.country}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {dbRecipients.length > 0 && <Separator />}

        {/* Manual entry */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient name</Label>
            <Input
              id="recipientName"
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearSaved();
              }}
            />
          </div>

          {/* Phone — for mobile money and always shown */}
          {store.selectedRail === 'mobile_money' && (
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Phone number</Label>
              <Input
                id="recipientPhone"
                placeholder={store.selectedNetwork === 'm-pesa' ? '+254 7XX XXX XXX' : '+254 7XX XXX XXX'}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearSaved();
                }}
              />
              {store.selectedNetwork && (
                <p className="text-xs text-muted-foreground">
                  Delivering via {networks.find((n) => n.id === store.selectedNetwork)?.label || 'Mobile money'}
                </p>
              )}
            </div>
          )}

          {/* Bank fields */}
          {store.selectedRail === 'bank' && (
            <>
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input
                  placeholder="e.g. Equity Bank"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    clearSaved();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    clearSaved();
                  }}
                />
              </div>
            </>
          )}

          {/* Ripple address */}
          {store.selectedRail === 'ripple' && (
            <div className="space-y-2">
              <Label htmlFor="rippleAddress">Ripple address</Label>
              <Input
                id="rippleAddress"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={rippleAddress}
                onChange={(e) => {
                  setRippleAddress(e.target.value);
                  clearSaved();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the recipient&apos;s Ripple wallet address for instant settlement.
              </p>
            </div>
          )}

          {/* PAPSS IBAN */}
          {store.selectedRail === 'papss' && (
            <div className="space-y-2">
              <Label htmlFor="papssIban">PAPSS IBAN</Label>
              <Input
                id="papssIban"
                placeholder="e.g. NG92 0000 0000 0000 0000 0000 000"
                value={papssIban}
                onChange={(e) => {
                  setPapssIban(e.target.value);
                  clearSaved();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the recipient&apos;s IBAN reachable via the Pan-African Payment &amp; Settlement System.
              </p>
            </div>
          )}

          <div className="space-y-2">
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
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 4: Review & Pay (Paystack inline popup) ───────────────
function StepReviewPay() {
  const store = useAppStore();
  const [paying, setPaying] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const handlePay = async () => {
    setPaying(true);

    try {
      // 1. Create a real transaction via the quote API
      const quoteRes = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${store.sessionToken}` },
        body: JSON.stringify({
          amountSend: store.sendAmount,
          currencySend: store.sendCurrency,
          currencyReceive: store.receiveCurrency,
          rail: store.selectedRail,
          senderId: store.senderId,
        }),
      });

      if (!quoteRes.ok) {
        const err = await quoteRes.json();
        throw new Error(err.error || 'Failed to create transaction');
      }

      const quoteData = await quoteRes.json();
      const transactionId = quoteData.transaction?.id;

      if (!transactionId) {
        throw new Error('No transaction ID returned from quote');
      }

      // 2. Initialize Paystack payment
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${store.sessionToken}` },
        body: JSON.stringify({
          transactionId,
          recipientName: store.recipientName,
          recipientPhone: store.recipientPhone,
          recipientCountry: store.sendCorridor.to,
          bankName: store.recipientBankName || undefined,
          accountNumber: store.recipientAccountNumber || undefined,
          rippleAddress: store.recipientRippleAddress || undefined,
          papssIban: store.recipientPapssIban || undefined,
          network: store.selectedNetwork || undefined,
          saveCard,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error || 'Payment initialization failed');
      }

      const initData = await initRes.json();

      if (!initData.access_code) {
        throw new Error('No access_code returned from Paystack');
      }

      // 3. Open Paystack inline popup
      const PaystackPop = (await import('@paystack/inline-js')).default;
      const paystack = new PaystackPop();

      paystack.resumeTransaction(initData.access_code, {
        onSuccess: () => {
          store.updateQuote({
            currentTransaction: {
              id: transactionId,
              amount: store.sendAmount,
              receiveAmount: store.receiveAmount,
              sendCurrency: store.sendCurrency,
              receiveCurrency: store.receiveCurrency,
              status: 'processing',
              recipient: store.recipientName,
              rail: store.selectedRail,
            },
          });
          store.setSendStep(5);
          toast.success('Payment successful! Your transfer is being processed.');
          setPaying(false);
        },
        onClose: () => {
          toast.error('Payment window was closed. Your transfer was not completed.');
          setPaying(false);
        },
        onError: () => {
          toast.error('Payment failed. Please try again.');
          setPaying(false);
        },
      });
    } catch (err: any) {
      console.error('[StepReviewPay] Payment error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
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
        {/* Summary card (locked) */}
        <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You send</span>
            <span className="text-xl font-bold text-gray-900">
              {store.sendAmount.toFixed(2)} {store.sendCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exchange rate</span>
            <span>1 {store.sendCurrency} = {store.fxRate.toFixed(2)} {store.receiveCurrency}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Transfer fee</span>
            <span>{store.feeAmount.toFixed(2)} {store.sendCurrency}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">They receive</span>
            <span className="text-xl font-bold text-emerald-600">
              {store.receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {store.receiveCurrency}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Recipient</p>
            <p className="font-medium">{store.recipientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{store.recipientPhone || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Delivery method</p>
            <p className="font-medium">{railLabel}{networkLabel ? ` (${networkLabel})` : ''}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quote reference</p>
            <p className="font-mono text-xs">{store.quoteId}</p>
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

        {/* Paystack badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Secured by Paystack — Card &amp; Bank Transfer accepted</span>
        </div>

        {/* Compliance disclosure */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <p>AfriSpine is a payment routing platform. Your card is charged by Paystack (a Stripe company). Funds are delivered to your recipient by the selected licensed provider. AfriSpine does not hold your funds at any time. By clicking Pay you agree to our <button onClick={() => store.navigate('terms')} className="underline font-medium">Terms of Service</button> and <button onClick={() => store.navigate('privacy')} className="underline font-medium">Privacy Policy</button>.</p>
        </div>

        {store.sendCurrency === 'USD' && store.sendAmount > 3000 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p><strong>US Regulatory Notice:</strong> Transactions above $3,000 may be reported to US financial regulators as required by law (Bank Secrecy Act). This is routine and does not affect your transfer.</p>
          </div>
        )}

        {store.sendCurrency === 'CAD' && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <p><strong>Canadian cards are charged in USD.</strong> Your card network will convert CAD to USD at their rate. The USD amount shown is what Paystack charges.</p>
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
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
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
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 5: Confirmation ──────────────────────────────────────
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
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
        <CircleCheckBig className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Transfer submitted</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        Your payment has been received and the transfer is being processed. Your recipient
        will be notified once the funds are delivered.
      </p>

      {txn && (
        <div className="mt-8 rounded-lg border border-border bg-muted/30 px-6 py-4 text-left">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Reference</p>
              <p className="font-mono font-medium">{txn.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-medium">{txn.amount.toFixed(2)} {txn.sendCurrency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recipient</p>
              <p className="font-medium">{txn.recipient}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Processing
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {txn && (
          <Button
            variant="outline"
            onClick={() => navigate('transfer-detail', { id: txn.id })}
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
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Send another
        </Button>
      </div>

      <AchievementCard
        type="first_send"
        data={{
          amount: txn?.amount?.toString() || '0',
          currency: txn?.sendCurrency || 'GBP',
          country: store.recvCountry || 'KE',
          name: 'AfriSpine User',
        }}
        visible={showAchievement}
        onClose={() => setShowAchievement(false)}
      />
    </div>
  );
}

// ─── Main Send Flow ────────────────────────────────────────────
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

  // Step indicator
  const stepLabels = ['Amount', 'Delivery', 'Recipient', 'Review', 'Done'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send money</h1>
        {step < 5 && (
          <p className="text-muted-foreground">Step {step} of 4</p>
        )}
      </div>

      {/* Progress bar */}
      {step < 5 && (
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const done = step > stepNum;
            return (
              <React.Fragment key={label}>
                {i > 0 && (
                  <div className={`h-0.5 flex-1 ${i < step ? 'bg-emerald-600' : 'bg-muted-foreground/20'}`} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${
                    isActive ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Step content */}
      {step === 1 && <StepAmount />}
      {step === 2 && <StepRail />}
      {step === 3 && <StepRecipient />}
      {step === 4 && <StepReviewPay />}
      {step === 5 && <StepConfirmation />}
    </div>
  );
}