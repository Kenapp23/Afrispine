'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { Smartphone, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const countries = [
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
];

interface Network {
  id: string;
  name: string;
  logo?: string;
}

interface AirtimeTransaction {
  id: string;
  phone: string;
  network: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

const quickAmounts: Record<string, number[]> = {
  KE: [100, 200, 500, 1000, 2000, 5000],
  NG: [100, 200, 500, 1000, 2000, 5000],
  GH: [5, 10, 20, 50, 100, 200],
  UG: [1000, 2000, 5000, 10000, 20000, 50000],
  TZ: [1000, 2000, 5000, 10000, 20000, 50000],
};

export function AirtimePage() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recentTx, setRecentTx] = useState<AirtimeTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const fetchNetworks = useCallback(async (countryCode: string) => {
    setLoadingNetworks(true);
    setSelectedNetwork('');
    try {
      const res = await fetch(`/api/airtime/send?country=${countryCode}`);
      if (res.ok) {
        const data = await res.json();
        setNetworks(Array.isArray(data) ? data : []);
      } else {
        setNetworks([]);
      }
    } catch {
      setNetworks([]);
    } finally {
      setLoadingNetworks(false);
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoadingTx(true);
    try {
      const res = await fetch('/api/transfers?rail=airtime');
      if (res.ok) {
        const data = await res.json();
        setRecentTx(
          Array.isArray(data?.items)
            ? data.items.slice(0, 5)
            : Array.isArray(data)
              ? data.slice(0, 5)
              : []
        );
      }
    } catch {
      // silent
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setPhoneNumber('');
    setAmount('');
    fetchNetworks(code);
  };

  const handleTopUp = async () => {
    if (!selectedCountry || !selectedNetwork || !phoneNumber || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all fields');
      return;
    }
    setToppingUp(true);
    try {
      const res = await fetch(`/api/airtime/send?country=${selectedCountry}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: selectedNetwork,
          phone: phoneNumber,
          amount: Number(amount),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // If access_code returned, open payment popup
        if (data.access_code) {
          const win = (window as unknown as { PaystackPop: { setup: (c: Record<string, unknown>) => { openIframe: () => void } } }).PaystackPop;
          if (win) {
            win.setup({
              key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || '',
              access_code: data.access_code,
              onClose: () => {
                toast.info('Payment window closed');
                setToppingUp(false);
              },
              callback: () => {
                setShowConfirmation(true);
                setToppingUp(false);
                setAmount('');
                fetchRecent();
                toast.success('Airtime top-up successful!');
              },
            }).openIframe();
            return;
          }
        }
        // Fallback: direct success
        setShowConfirmation(true);
        setToppingUp(false);
        setAmount('');
        fetchRecent();
        toast.success('Airtime top-up successful!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Top-up failed');
        setToppingUp(false);
      }
    } catch {
      toast.error('Network error, please try again');
      setToppingUp(false);
    }
  };

  const countryData = countries.find((c) => c.code === selectedCountry);
  const amounts = countryData ? quickAmounts[countryData.code] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Airtime Top-Up</h1>
        <p className="text-muted-foreground">
          Top up mobile airtime across Africa right away
        </p>
      </div>

      {/* Non-refundable disclosure */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Airtime top-ups are <strong>non-refundable</strong> once sent. Please
          double-check the phone number before proceeding.
        </p>
      </div>

      {/* Confirmation banner */}
      {showConfirmation && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">
              Top-up successful!
            </p>
            <p className="text-xs text-emerald-700">
              The airtime has been sent to the recipient&apos;s phone.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmation(false)}
            className="border-emerald-300 text-emerald-700"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            Top Up Airtime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Country selector */}
          <div className="grid gap-2">
            <Label>Country</Label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
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

          {/* Network */}
          {selectedCountry && (
            <div className="grid gap-2">
              <Label>Network</Label>
              {loadingNetworks ? (
                <Skeleton className="h-10 w-full" />
              ) : networks.length > 0 ? (
                <Select
                  value={selectedNetwork}
                  onValueChange={setSelectedNetwork}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No networks available for this country
                </p>
              )}
            </div>
          )}

          {/* Phone number */}
          {selectedCountry && (
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
          )}

          {/* Amount */}
          {selectedCountry && (
            <div className="grid gap-2">
              <Label htmlFor="airtime-amount">
                Amount ({countryData?.currency})
              </Label>
              <Input
                id="airtime-amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {/* Quick amounts */}
              {amounts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {amounts.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        amount === String(a)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600'
                      }`}
                    >
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top up button */}
          {selectedCountry && (
            <Button
              onClick={handleTopUp}
              disabled={toppingUp || !selectedNetwork || !phoneNumber || !amount}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {toppingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Top Up{' '}
                  {amount
                    ? `${Number(amount).toLocaleString()} ${countryData?.currency}`
                    : 'Airtime'}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Recent Airtime Top-Ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent airtime top-ups
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.network} · {tx.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        tx.status === 'delivered' || tx.status === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}