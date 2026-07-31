'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  CheckCircle2,
  Shield,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { WealthDisclaimer } from './wealth-disclaimer';

/* ── Static data ──────────────────────────────────────────────── */

const benefits = [
  '8 African exchanges in one place',
  'Stocks, bonds, funds, and pre-IPO deals',
  'USD settlement — no local currency account needed',
  'Dividends paid directly to your wallet',
  'From as little as $10',
];

const riskDisclaimerText =
  'I understand that investing in stocks and other securities carries risk, including possible loss of some or all of my investment. AfriSpine Ltd is not a licensed investment adviser and nothing on this platform constitutes investment advice. I am making my own investment decisions.';

const marketInsights = [
  {
    label: 'Fastest-growing bourses',
    value: 'GSE +134% YTD',
    desc: 'Ghana Stock Exchange leads African markets in 2025 returns.',
  },
  {
    label: 'Accessible minimums',
    value: 'From $10',
    desc: 'Start investing with as little as $10 — no minimum balance required.',
  },
  {
    label: 'USD dividends',
    value: 'Direct to wallet',
    desc: 'Dividends are settled in USD and paid directly into your AfriSpine wallet.',
  },
];

/* ── Component ────────────────────────────────────────────────── */

export function WealthActivationPage() {
  const navigate = useAppStore((s) => s.navigate);

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycRequired, setKycRequired] = useState(false);

  const handleActivate = async () => {
    if (!accepted) return;

    setLoading(true);
    setError(null);
    setKycRequired(false);

    try {
      const res = await fetch('/api/wealth/account/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if KYC is the blocker
        if (
          data.code === 'KYC_REQUIRED' ||
          data.error?.toLowerCase().includes('kyc') ||
          data.error?.toLowerCase().includes('verification')
        ) {
          setKycRequired(true);
          setError('Complete identity verification first');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      toast.success('Investment account activated!');
      navigate('wealth-landing');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Main content */}
      <div className="flex-1 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
          {/* Icon + Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>

            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 px-3 py-1 text-xs font-medium">
              <Shield className="mr-1.5 h-3 w-3" />
              Investment Account
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Open your AfriSpine Investment Account
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg">
              Invest in African stocks, bonds, and IPOs from $10. Your account
              activates in seconds.
            </p>
          </div>

          {/* Benefits card */}
          <Card className="mt-10 border-emerald-100 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 mb-5">
                What you get
              </h2>

              <ul className="space-y-3.5">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Market insight cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {marketInsights.map((insight) => (
              <div
                key={insight.label}
                className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {insight.label}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {insight.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {insight.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Error alert */}
          {error && (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                {kycRequired && (
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0 text-sm text-red-700 underline underline-offset-2 hover:text-red-900"
                    onClick={() => navigate('verify')}
                  >
                    Complete identity verification →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Risk checkbox */}
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
            <Checkbox
              id="risk-acknowledgment"
              checked={accepted}
              onCheckedChange={(checked) => {
                setAccepted(checked === true);
                // Clear error when user interacts
                if (error) setError(null);
              }}
              className="mt-0.5 shrink-0 border-amber-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <label
              htmlFor="risk-acknowledgment"
              className="cursor-pointer text-xs sm:text-sm text-amber-900 leading-relaxed select-none"
            >
              {riskDisclaimerText}
            </label>
          </div>

          {/* Activate button */}
          <Button
            size="lg"
            disabled={!accepted || loading}
            onClick={handleActivate}
            className="mt-8 w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-6 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating…
              </>
            ) : (
              <>
                Activate investment account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Why invest in African markets? */}
      <section className="bg-gray-50 border-t border-gray-200 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Why invest in African markets?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Africa is home to some of the world&apos;s fastest-growing
              economies and youngest populations, creating a powerful
              combination for long-term growth. With 8 major exchanges and
              increasing digital access, the opportunity has never been more
              accessible to diaspora and global investors.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: TrendingUp,
                title: 'Outperforming returns',
                desc: 'GSE returned +134% in 2025. NGX and NSE both surpassed +50% — outpacing many developed market indices.',
              },
              {
                icon: Shield,
                title: 'Diversification',
                desc: 'Low correlation with Western markets provides portfolio resilience. African equities offer exposure to commodity, fintech, and consumer growth.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <WealthDisclaimer variant="general" className="mt-10" />
        </div>
      </section>
    </div>
  );
}