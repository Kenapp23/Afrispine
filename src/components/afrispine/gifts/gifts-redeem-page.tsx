'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Gift,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Tag,
  Store,
  User,
  AlertTriangle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Brand logo map — maps keyword → local logo file in /public        */
/* ------------------------------------------------------------------ */
const BRAND_LOGO_MAP: Record<string, string> = {
  dstv:        '/gift-dstv.png',
  gotv:        '/gift-gotv.png',
  netflix:     '/gift-netflix.png',
  spotify:     '/gift-spotify.png',
  amazon:      '/gift-amazon.png',
  'app store': '/gift-apple.png',
  apple:       '/gift-apple.png',
  'apple music': '/gift-apple.png',
  'google play': '/gift-google-play.png',
  uber:        '/gift-uber.png',
  airbnb:      '/gift-airbnb.png',
  showmax:     '/gift-showmax.png',
  jumia:       '/gift-jumia.png',
  takealot:    '/gift-takealot.png',
  'pick n pay': '/gift-picknpay.png',
  picknpay:    '/gift-picknpay.png',
  multichoice: '/gift-dstv.png',
};

/**
 * Resolve a merchant name (e.g. "DStv Kenya") to a local logo path.
 * Returns `null` when no match is found so the caller can fall back.
 */
function resolveBrandLogo(merchantName: string): string | null {
  const lower = merchantName.toLowerCase().trim();

  // 1. Exact keyword match
  if (BRAND_LOGO_MAP[lower]) return BRAND_LOGO_MAP[lower];

  // 2. Check if any keyword is contained in the name (longer keys first)
  const sortedKeys = Object.keys(BRAND_LOGO_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (lower.includes(key)) return BRAND_LOGO_MAP[key];
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  MerchantLogo — shows brand img with Store-icon fallback            */
/* ------------------------------------------------------------------ */
function MerchantLogo({ merchantName }: { merchantName: string }) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = resolveBrandLogo(merchantName);

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  // No logo matched at all → show Store icon immediately
  if (!logoSrc || imgError) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
        <Store className="h-4 w-4 text-amber-700" />
      </div>
    );
  }

  // We have a logo — show it, fall back on error
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-white border border-border/40">
      <img
        src={logoSrc}
        alt={merchantName}
        className="h-6 w-6 object-contain"
        onError={handleError}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                      */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    sent: { label: 'Active', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
    redeemed: { label: 'Redeemed', color: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function GiftsRedeemPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [voucher, setVoucher] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a voucher code');
      return;
    }
    setLoading(true);
    setError('');
    setVoucher(null);
    try {
      const res = await fetch(`/api/gifts/redeem?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Voucher not found');
        return;
      }
      setVoucher(data);
    } catch {
      setError('Failed to look up voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!voucher || voucher.status === 'redeemed') return;
    setRedeeming(true);
    try {
      const res = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Redemption failed');
        return;
      }
      if (data.error === 'Already redeemed') {
        toast.error('This voucher has already been redeemed');
        return;
      }
      toast.success('Voucher redeemed successfully!');
      // Refresh voucher data
      setVoucher({
        ...voucher,
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
      });
    } catch {
      toast.error('Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
        <button
          onClick={() => navigate('gifts')}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Redeem a Voucher</h1>
        </div>
        <QrCode className="h-5 w-5 text-amber-500" />
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Enter Voucher Code
          </h2>
          <p className="text-sm text-muted-foreground">
            Scan the QR code or type the voucher code to check its status.
          </p>
        </div>

        {/* Search input */}
        <div className="space-y-3">
          <Label htmlFor="voucher-code" className="text-sm font-semibold text-foreground">
            <Tag className="mr-1.5 inline h-4 w-4" />
            Voucher Code
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="voucher-code"
                type="text"
                placeholder="AFSP-GIFT-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                className="pr-10 font-mono tracking-wide"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              onClick={handleCheck}
              disabled={loading || !code.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Check'
              )}
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Voucher Not Found</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Voucher details */}
        {voucher && !error && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={voucher.status} />
              {voucher.expiresAt && (
                <span className="text-xs text-muted-foreground">
                  Expires {new Date(voucher.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Voucher card */}
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm space-y-4">
              {/* Amount header */}
              <div className="text-center space-y-1">
                <p className="text-3xl font-extrabold text-gray-900">
                  {voucher.amountLocal?.toLocaleString() || '—'}{' '}
                  <span className="text-lg font-semibold text-muted-foreground">{voucher.currencyLocal || ''}</span>
                </p>
                {voucher.amountGbp && (
                  <p className="text-xs text-muted-foreground">
                    Equivalent to &pound;{voucher.amountGbp}
                  </p>
                )}
              </div>

              <div className="h-px bg-border/50" />

              {/* Details grid */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MerchantLogo merchantName={voucher.merchantName || ''} />
                  <div>
                    <p className="text-xs text-muted-foreground">Merchant</p>
                    <p className="font-semibold text-gray-900">{voucher.merchantName || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p className="font-semibold text-gray-900">{voucher.recipientName || 'Not specified'}</p>
                  </div>
                </div>

                {voucher.senderMessage && (
                  <div className="rounded-xl bg-amber-50/80 border border-amber-100 px-4 py-3">
                    <p className="text-xs text-amber-700 font-medium mb-1">Message</p>
                    <p className="text-sm text-amber-900 italic">&ldquo;{voucher.senderMessage}&rdquo;</p>
                  </div>
                )}

                {voucher.issuedAt && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Issued</span>
                    <span>{new Date(voucher.issuedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {voucher.redeemedAt && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Redeemed</span>
                    <span>{new Date(voucher.redeemedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expired warning */}
            {voucher.expiresAt && new Date() > new Date(voucher.expiresAt) && voucher.status !== 'redeemed' && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Voucher Expired</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    This voucher expired on {new Date(voucher.expiresAt).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}

            {/* Redeem button (for merchants) */}
            {voucher.status === 'sent' && (
              <div className="space-y-2">
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  size="lg"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                >
                  {redeeming ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Redeeming...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Mark as Redeemed
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  For merchants: tap to mark this voucher as redeemed at your store.
                </p>
              </div>
            )}

            {voucher.status === 'redeemed' && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">This voucher has been redeemed</p>
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div className="pt-2">
          <Button variant="ghost" onClick={() => navigate('gifts')} className="w-full text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gifts Hub
          </Button>
        </div>
      </div>
    </main>
  );
}
