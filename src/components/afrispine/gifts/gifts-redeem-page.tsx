'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Loader2,
  Shield,
  Copy,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────── */

interface GiftCardData {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  qrCodeData: string;
  blockchainTxHash: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  message: string | null;
  occasion: string | null;
  purchasedAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
  expiresAt: string | null;
  brand: {
    id: string;
    brandName: string;
    logoUrl: string;
  };
}

/* ── Logo Component ────────────────────────────────────────────── */

function extractDomain(logoUrl: string): string {
  try {
    const url = new URL(logoUrl);
    if (url.hostname === 'logo.clearbit.com') return url.pathname.replace(/^\/+/, '');
    return url.hostname;
  } catch {
    return logoUrl.replace(/^https?:\/\//, '').split('/')[0];
  }
}

function buildLogoSources(logoUrl: string): string[] {
  const domain = extractDomain(logoUrl);
  return [logoUrl, `https://cdn.brandfetch.io/${domain}?w=128&h=128&format=png`, `https://www.google.com/s2/favicons?domain=${domain}&sz=128`];
}

function BrandLogo({ brandName, logoUrl }: { brandName: string; logoUrl: string }) {
  const [currentSourceIdx, setCurrentSourceIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const sources = [logoUrl, ...buildLogoSources(logoUrl).slice(1)];

  const initials = brandName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (failed) {
    return <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm">{initials}</div>;
  }

  return (
    <div className="relative">
      {loading && <div className="h-10 w-10 rounded-lg animate-pulse bg-gray-200 absolute inset-0" />}
      <img key={sources[currentSourceIdx]} src={sources[currentSourceIdx]} alt={brandName} className="h-10 w-10 rounded-lg object-contain"
        onLoad={() => setLoading(false)}
        onError={() => {
          const next = currentSourceIdx + 1;
          if (next < sources.length) setCurrentSourceIdx(next);
          else { setFailed(true); setLoading(false); }
        }}
      />
    </div>
  );
}

/* ── Visual QR Code ────────────────────────────────────────────── */

function VisualQRCode({ code, brandName, size = 140 }: { code: string; brandName: string; size?: number }) {
  const grid = React.useMemo(() => {
    const cells: boolean[][] = [];
    const gridSize = 21;
    let hash = 0;
    for (let i = 0; i < code.length; i++) { hash = ((hash << 5) - hash) + code.charCodeAt(i); hash = hash & hash; }
    const seed = Math.abs(hash);
    for (let r = 0; r < gridSize; r++) {
      cells[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const isTopLeft = r < 7 && c < 7;
        const isTopRight = r < 7 && c >= gridSize - 7;
        const isBottomLeft = r >= gridSize - 7 && c < 7;
        if (isTopLeft || isTopRight || isBottomLeft) {
          const lr = isTopLeft ? r : isTopRight ? r : r - (gridSize - 7);
          const lc = isTopLeft ? c : isTopRight ? c - (gridSize - 7) : c;
          cells[r][c] = (lr === 0 || lr === 6 || lc === 0 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        } else {
          const val = ((seed * (r * 31 + c * 17 + 7)) + r * c) % 100;
          cells[r][c] = val < 45;
        }
      }
    }
    return cells;
  }, [code]);

  return (
    <div className="relative inline-block bg-white rounded-xl p-2 shadow-md border border-gray-200" style={{ width: size + 16, height: size + 16 }}>
      <svg width={size} height={size} viewBox="0 0 21 21" className="block">
        {grid.map((row, r) => row.map((cell, c) => (
          <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={cell ? '#111827' : 'transparent'} />
        )))}
        <rect x={8} y={8} width={5} height={5} fill="white" />
        <rect x={8.5} y={8.5} width={4} height={4} rx={0.5} fill="#10B981" />
        <text x={10.5} y={11} textAnchor="middle" fontSize={2.5} fill="white" fontWeight="bold" fontFamily="sans-serif">
          {brandName[0]?.toUpperCase() || 'G'}
        </text>
      </svg>
    </div>
  );
}

/* ── Status Badge ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800' },
    redeemed: { label: 'Redeemed', color: 'bg-gray-100 text-gray-600' },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
  };
  const c = config[status] || config.active;
  return <Badge className={`${c.color} border-0`}>{c.label}</Badge>;
}

/* ── Main Component ────────────────────────────────────────────── */

export default function GiftsRedeemPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [code, setCode] = useState('');
  const [redeemerName, setRedeemerName] = useState('');
  const [redeemerPhone, setRedeemerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [card, setCard] = useState<GiftCardData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLookup = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error('Please enter a gift card code'); return; }
    setLoading(true);
    setError('');
    setCard(null);
    try {
      const res = await fetch(`/api/gift-cards/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gift card not found'); return; }
      setCard(data.giftCard);
    } catch {
      setError('Failed to look up gift card');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleRedeem = async () => {
    if (!card || card.status !== 'active') return;
    if (!redeemerName.trim()) { toast.error('Please enter your name'); return; }
    setRedeeming(true);
    try {
      const res = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: card.code, redeemerName: redeemerName.trim(), redeemerPhone: redeemerPhone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Redemption failed'); return; }
      toast.success('Gift card redeemed successfully!');
      setCard({ ...card, status: 'redeemed', redeemedAt: new Date().toISOString(), redeemedBy: redeemerName });
    } catch {
      toast.error('Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = () => {
    if (card) {
      navigator.clipboard.writeText(card.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate('gifts')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Redeem Gift Card</h1>
        </div>
        <QrCode className="h-5 w-5 text-emerald-500" />
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Enter Gift Card Code</h2>
          <p className="text-sm text-muted-foreground">Scan the QR code or type the code to look up your gift card.</p>
        </div>

        {/* Search input */}
        <div className="space-y-3">
          <Label htmlFor="gift-code" className="text-sm font-semibold">
            <Tag className="mr-1.5 inline h-4 w-4" /> Gift Card Code
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input id="gift-code" type="text" placeholder="AFG-XXXXXXXXXXXX" value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                className="pr-10 font-mono tracking-wide" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={handleLookup} disabled={loading || !code.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look Up'}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Not Found</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Card details */}
        {card && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={card.status} />
              {card.expiresAt && <span className="text-xs text-muted-foreground">Expires {new Date(card.expiresAt).toLocaleDateString()}</span>}
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
              {/* Card header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                <div className="flex items-center gap-3">
                  <BrandLogo brandName={card.brand.brandName} logoUrl={card.brand.logoUrl} />
                  <div>
                    <p className="font-bold">{card.brand.brandName}</p>
                    <p className="text-emerald-200 text-xs">{card.occasion || 'Gift Card'}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-gray-900">
                    {card.amount.toLocaleString()} <span className="text-lg font-semibold text-muted-foreground">{card.currency}</span>
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <VisualQRCode code={card.code} brandName={card.brand.brandName} />
                </div>

                {/* Code */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Card Code</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border">
                    <code className="text-sm font-mono font-bold text-gray-900 tracking-wider">{card.code}</code>
                    <button onClick={copyCode} className="text-emerald-600 hover:text-emerald-700">
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {card.recipientName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span className="text-muted-foreground">Recipient:</span>
                      <span className="font-semibold">{card.recipientName}</span>
                    </div>
                  )}
                  {card.blockchainTxHash && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Shield className="h-3 w-3" />
                      <span>Blockchain Verified</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Purchased</span>
                    <span>{new Date(card.purchasedAt).toLocaleDateString()}</span>
                  </div>
                  {card.redeemedAt && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Redeemed</span>
                      <span>{new Date(card.redeemedAt).toLocaleDateString()} by {card.redeemedBy}</span>
                    </div>
                  )}
                </div>

                {card.message && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-xs text-amber-700 font-medium mb-1">Message</p>
                    <p className="text-sm text-amber-900 italic">&ldquo;{card.message}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expired warning */}
            {card.expiresAt && new Date() > new Date(card.expiresAt) && card.status === 'active' && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Card Expired</p>
                  <p className="text-xs text-amber-600 mt-0.5">This card expired on {new Date(card.expiresAt).toLocaleDateString()}.</p>
                </div>
              </div>
            )}

            {/* Redeem form */}
            {card.status === 'active' && (
              <div className="space-y-3">
                <div className="rounded-xl border bg-white p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Redeem this card</p>
                  <Input placeholder="Your name" value={redeemerName} onChange={e => setRedeemerName(e.target.value)} />
                  <Input placeholder="Your phone (optional)" value={redeemerPhone} onChange={e => setRedeemerPhone(e.target.value)} />
                  <Button onClick={handleRedeem} disabled={redeeming || !redeemerName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold">
                    {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Redeem Gift Card</>
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">For merchants: tap to mark this gift card as redeemed.</p>
              </div>
            )}

            {card.status === 'redeemed' && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">This card has been redeemed</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Button variant="ghost" onClick={() => navigate('gifts')} className="w-full text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gifts Hub
          </Button>
        </div>
      </div>
    </main>
  );
}
