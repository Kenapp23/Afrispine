'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { AchievementCard } from '@/components/afrispine/common/achievement-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Globe,
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Zap,
  Lock,
  Users,
  Building2,
  Star,
  AlertTriangle,
  Droplets,
  CalendarCheck,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { getIpoRegistrationStats } from '@/lib/wealth-data';
import { WealthDisclaimer } from '@/components/afrispine/wealth/wealth-disclaimer';
import { IpoReferralShare } from '@/components/afrispine/common/referral-share';

export function DangoteIpoPage() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [interestAmount, setInterestAmount] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/markets/dangote-ipo/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          country,
          phone,
          interestAmountUsd: interestAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSubmitted(true);
      setTimeout(() => setShowAchievement(true), 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            You&apos;re on the list.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            We&apos;ll notify you as soon as the Dangote Refinery IPO opens for subscription.
            AfriSpine will handle the FX conversion, so you can invest directly from USD, GBP, or EUR
            — no naira account needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('signup')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Create full account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('landing')}
            >
              Back to home
            </Button>
          </div>

          <AchievementCard
            type="ipo_registered"
            data={{
              name: fullName || 'AfriSpine User',
              ipo: 'Dangote Refinery',
            }}
            visible={showAchievement}
            onClose={() => setShowAchievement(false)}
          />
          <div className="mt-6">
            <IpoReferralShare referralCode={sender?.referralCode || ''} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-yellow-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-emerald-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-yellow-400/20 text-yellow-200 border-yellow-400/30 hover:bg-yellow-400/30 px-4 py-1.5 text-sm">
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Largest IPO in African History
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Access the Dangote Refinery IPO
              <span className="block text-yellow-300 mt-2">from anywhere in the world</span>
            </h1>
            <p className="mt-6 text-lg text-emerald-100 leading-relaxed max-w-2xl mx-auto">
              The Dangote Refinery is targeting a <strong className="text-white">$40–50 billion valuation</strong>,
              with plans to raise up to <strong className="text-white">$5 billion</strong> from investors — the
              largest single share sale in African history. AfriSpine lets the diaspora participate
              without needing a naira bank account.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#register" className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-yellow-300 transition-colors">
                Register your interest
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('pricing')}
              >
                How AfriSpine works
              </Button>
            </div>
            {/* Urgency bar */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                IPO expected September 2026
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                Up to $5B raise
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                $2B+ investor interest already
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why This Matters ─────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why the Dangote Refinery IPO is different
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              This is not just another IPO. It is a once-in-a-generation opportunity for the African diaspora.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: 'Record-breaking valuation',
                desc: 'Targeting $40–50B — making it the most valuable company IPO in African history. The NGX extended its rally, gaining over 60% through May 2026, and the Dangote listing will supercharge that momentum.',
              },
              {
                icon: DollarSign,
                title: 'USD dividends',
                desc: "Dangote Group has indicated shareholders may receive dividends in US dollars. If and when dividends are declared, AfriSpine will convert and credit them to your account. Official terms will be confirmed before the IPO opens.",
              },
              {
                icon: Building2,
                title: 'Transformative asset',
                desc: 'The 650,000 barrels-per-day refinery is the largest single-train refinery in the world. It is already operational and displacing $26B in annual fuel imports, fundamentally reshaping Nigeria\'s trade balance.',
              },
              {
                icon: Globe,
                title: 'Diaspora access via AfriSpine',
                desc: 'No naira bank account required. AfriSpine converts your USD, GBP, or EUR and routes it directly to the subscription. We handle FX, compliance, and settlement so you can focus on investing.',
              },
              {
                icon: Shield,
                title: 'Regulated and secure',
                desc: 'Shares held through a licensed Nigerian SEC-registered dealing member in a segregated CSCS nominee account. Individual ownership recorded digitally. You remain the legal owner of every share you buy.',
              },
              {
                icon: Zap,
                title: 'Zero friction, zero paperwork',
                desc: 'No individual CSCS application, no in-person verification, no Nigerian bank account. Register your email, fund from abroad, and we handle the rest. From London to Lagos in a few clicks.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <item.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Facts ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Key Facts
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Droplets,
                title: "World's largest single-train oil refinery",
                stat: '650,000 bpd',
                sub: 'Lekki Free Trade Zone, Lagos',
              },
              {
                icon: CalendarCheck,
                title: 'Full commercial operations since early 2024',
                stat: '76.7%',
                sub: "Supplies 76.7% of Nigeria's petrol",
              },
              {
                icon: Receipt,
                title: '$6.4B estimated annual export revenues',
                stat: '$6.4B',
                sub: 'Refinery export capacity projection',
              },
              {
                icon: UserCheck,
                title: 'Who can invest',
                stat: '3 paths',
                sub: '',
                checklist: [
                  'Nigerians with valid BVN',
                  'International investors via NGX broker',
                  'AfriSpine users (diaspora)',
                ],
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-gray-200 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <item.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h3>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{item.stat}</p>
                {item.sub && <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>}
                {'checklist' in item && item.checklist && (
                  <ul className="mt-3 space-y-1.5">
                    {item.checklist.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Performance ───────────────────────────────── */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              African markets are surging
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              2025–2026 has been the strongest period for African equities in a decade.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { exchange: 'NGX Nigeria', return: '+51%', cap: '$114B+', color: 'bg-emerald-500' },
              { exchange: 'GSE Ghana', return: '+134%', cap: '$22.6B', color: 'bg-yellow-500' },
              { exchange: 'NSE Kenya', return: '+56%', cap: '$27.4B', color: 'bg-teal-500' },
              { exchange: 'JSE South Africa', return: '+12%', cap: '$1.4T', color: 'bg-blue-500' },
            ].map((m) => (
              <div key={m.exchange} className="rounded-xl bg-white border border-gray-200 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">{m.exchange}</p>
                <p className="mt-2 text-4xl font-bold text-emerald-600">{m.return}</p>
                <p className="mt-1 text-xs text-muted-foreground">Market cap: {m.cap}</p>
                <div className="mt-3 mx-auto h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: m.return === '+134%' ? '100%' : m.return === '+56%' ? '56%' : m.return === '+51%' ? '51%' : '12%' }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">2025 YTD return</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How AfriSpine Wealth Works ───────────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How AfriSpine Wealth will work
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From registration to settlement — a seamless path for diaspora investors.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 hidden sm:block w-px bg-gradient-to-b from-emerald-300 via-yellow-300 to-emerald-300" />
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Register your interest',
                  desc: 'No account needed yet. Just your email. We\'ll notify you the moment the IPO subscription window opens and you can invest from abroad.',
                  cta: 'Register now',
                },
                {
                  step: '02',
                  title: 'Create your AfriSpine account',
                  desc: 'When the IPO goes live, complete KYC verification from your phone. AfriSpine handles compliance with CMA Kenya and SEC Nigeria requirements remotely.',
                  cta: 'Coming soon',
                },
                {
                  step: '03',
                  title: 'Fund in your currency',
                  desc: 'Deposit USD, GBP, or EUR via bank transfer, debit card, or M-PESA Global. AfriSpine converts at competitive rates — no 3–5% bank FX fees. You see the exact naira amount before confirming.',
                  cta: 'Coming soon',
                },
                {
                  step: '04',
                  title: 'AfriSpine buys on your behalf',
                  desc: "Your funds are converted to naira and routed to a licensed Nigerian dealing member via our MyStocks Africa partnership. Shares are held in a segregated CSCS nominee account with your ownership recorded digitally.",
                  cta: 'Coming soon',
                },
                {
                  step: '05',
                  title: 'Receive dividends in USD',
                  desc: "If and when dividends are declared, AfriSpine will convert and credit them to your account. Official dividend terms will be confirmed before the IPO opens.",
                  cta: 'Coming soon',
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative flex gap-6 sm:gap-8">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <div className="flex-1 pb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    {idx === 0 && (
                      <a href="#register" className="mt-3 inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
                        {item.cta}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    )}
                    {idx > 0 && (
                      <span className="mt-3 inline-flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        {item.cta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why AfriSpine ────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                The three problems AfriSpine solves
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Until now, diaspora investment into African stock markets was blocked by three interlocking barriers.
              </p>
              <div className="mt-8 space-y-6">
                {[
                  {
                    problem: 'The fragmentation problem',
                    solution: 'mystocks.africa now offers a single REST API covering JSE, NGX, NSE Kenya, GSE, BRVM, LuSE, USE and DSE with USD settlement. One integration, every major African exchange.',
                    icon: Globe,
                  },
                  {
                    problem: 'The CDS barrier',
                    solution: "AfriSpine's model via MyStocks Africa means investors no longer need individual CSCS accounts. Shares are held in a segregated CSCS nominee account with digital ownership records.",
                    icon: Lock,
                  },
                  {
                    problem: 'The FX conversion gap',
                    solution: 'AfriSpine is the FX and payment rail. Convert USD/GBP/EUR to KES/NGN at competitive rates, then route directly to the broker. No wire transfers, no bank intermediaries, no 3–5% FX costs.',
                    icon: DollarSign,
                  },
                ].map((item) => (
                  <div key={item.problem} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <item.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.problem}</h4>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-900 text-white p-8 sm:p-10">
              <h3 className="text-xl font-bold mb-6">AfriSpine Wealth — Exchange Coverage</h3>
              <div className="space-y-3">
                {[
                  { exchange: 'NGX Nigeria', status: 'API Ready', priority: 'Priority 1 — Dangote IPO', badge: 'bg-yellow-400 text-emerald-900' },
                  { exchange: 'JSE South Africa', status: 'API Ready', priority: 'Priority 2 — Largest, deepest', badge: 'bg-emerald-400 text-emerald-900' },
                  { exchange: 'NSE Kenya', status: 'API + Ziidi', priority: 'Priority 3 — Home market', badge: 'bg-teal-400 text-emerald-900' },
                  { exchange: 'GSE Ghana', status: 'API Ready', priority: 'Priority 4 — Fastest growing', badge: 'bg-emerald-400 text-emerald-900' },
                  { exchange: 'EGX Egypt', status: 'API Ready', priority: 'Priority 5 — North Africa', badge: 'bg-emerald-400 text-emerald-900' },
                  { exchange: 'BRVM (8 countries)', status: 'API Ready', priority: 'Priority 6 — Francophone', badge: 'bg-emerald-400 text-emerald-900' },
                ].map((ex) => (
                  <div key={ex.exchange} className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{ex.exchange}</p>
                      <p className="text-xs text-emerald-200">{ex.priority}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ex.badge}`}>
                      {ex.status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-emerald-300">
                Covering 33 countries through 21 tracked exchanges via mystocks.africa and Mansa Markets APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Revenue Opportunity (for strategic interest) ─────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              The AUM compounding advantage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every dollar invested stays on the platform — generating recurring, passive management fees.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-gray-900">Revenue Stream</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900">AfriSpine Fee</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900">Avg. Transaction</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900">Revenue / Txn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Stock Purchases', '0.5–1%', '$500', '$2.50–$5.00'],
                  ['AUM Management Fee', '0.5%/year', '$10,000', '$50/year'],
                  ['IPO Subscription', '$5 flat', '$500', '$5.00'],
                  ['Dividends Reinvestment', '0.25%', '$200', '$0.50'],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{row[0]}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{row[1]}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{row[2]}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 leading-relaxed">
              <strong>Key insight:</strong> 1,000 investors at $10,000 average = $500,000/year in AUM fees from a single cohort,
              growing every quarter as users invest more. This is compounding, recurring, passive revenue that
              neither transfers nor FX can match.
            </p>
          </div>
        </div>
      </section>

      {/* ── Registration Form ────────────────────────────────── */}
      <section id="register" className="bg-emerald-50 py-20 sm:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="rounded-2xl bg-white shadow-xl border border-emerald-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <BarChart3 className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Register for Dangote IPO updates
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to know when subscription opens. No commitment, no payment required.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <Input
                  type="text"
                  placeholder="Optional"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country of residence
                </label>
                <Input
                  type="text"
                  placeholder="e.g. UK, US"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <Input
                  type="tel"
                  placeholder="Optional — for IPO SMS alerts"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest amount
                </label>
                <select
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select</option>
                  <option value="100-500">$100 – $500</option>
                  <option value="500-1000">$500 – $1,000</option>
                  <option value="1000-5000">$1,000 – $5,000</option>
                  <option value="5000-10000">$5,000 – $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold"
              >
                {submitting ? 'Registering...' : 'Register my interest'}
                {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By registering, you agree to receive email updates about the Dangote IPO.
                We will never share your email with third parties.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Diaspora Demand Index ────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Diaspora Demand Index</h2>
          <p className="mt-2 text-sm text-muted-foreground">Investors registered from around the world</p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {getIpoRegistrationStats().byCountry.map((c, i) => (
              <div key={c.country} className="rounded-xl bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {i === 0 ? '🇬🇧' : i === 1 ? '🇺🇸' : i === 2 ? '🇨🇦' : i === 3 ? '🇩🇪' : i === 4 ? '🇿🇦' : '🌍'}
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{c.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{c.country}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {getIpoRegistrationStats().total.toLocaleString()} investors from {getIpoRegistrationStats().countries} countries
          </p>
        </div>
      </section>

      {/* ── Risk Section ──────────────────────────────────────── */}
      <section className="bg-red-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-red-900 sm:text-3xl">Risks to be aware of</h2>
          <ul className="mt-6 space-y-3">
            {[
              'Share price volatility after listing — IPOs often see significant price swings',
              "Nigeria's 30% capital gains tax for foreign investors",
              'Currency risk: NGN/USD fluctuation may affect returns',
              'No prospectus yet — final terms not confirmed',
              'Timeline has shifted before — September 2026 is the target, not guaranteed',
            ].map(r => (
              <li key={r} className="flex items-start gap-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-red-600 leading-relaxed">
            This is not investment advice. Capital at risk. Do not invest money you cannot afford to lose.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Do I need a Nigerian bank account to participate?',
                a: 'No. AfriSpine handles the FX conversion from USD, GBP, or EUR to naira. You fund your AfriSpine account in your home currency and we route the naira to our broker partner for subscription.',
              },
              {
                q: 'How are my shares held?',
                a: "Shares are held in a segregated CSCS nominee account, cleared through a licensed Nigerian SEC-registered dealing member. Your individual ownership is recorded digitally in AfriSpine's database. You legally own every share you purchase.",
              },
              {
                q: 'What is the minimum investment amount?',
                a: 'The minimum has not been announced yet by Dangote. We expect it to be accessible for retail investors. We will communicate the exact minimum once the prospectus is published.',
              },
              {
                q: 'When does the IPO open?',
                a: 'Dangote has confirmed the refinery IPO will be on the market by September 2026. Investor interest has already approached $2 billion. Register now to be notified the moment subscription opens.',
              },
              {
                q: 'Will I receive dividends in USD?',
                a: "This has not been confirmed by Dangote Group as of this writing. If and when dividends are declared, AfriSpine will convert and credit them to your account in your home currency. We'll update this page once official terms are published.",
              },
              {
                q: 'Is AfriSpine a registered broker?',
                a: 'AfriSpine is a payments and FX routing platform, not a broker. Trade execution and share custody are handled by licensed Nigerian SEC-registered dealing members via our MyStocks Africa partnership. AfriSpine handles the FX conversion, payment rail, and user experience layer.',
              },
              {
                q: 'Can I explore other African stocks beyond Dangote?',
                a: 'Yes — that is the broader AfriSpine Wealth vision. After the Dangote IPO launch, we plan to open access to NGX, JSE, NSE Kenya, GSE, and more. Register your interest to stay updated on all markets.',
              },
            ].map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <WealthDisclaimer variant="ipo" />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-emerald-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Don&apos;t miss the largest IPO in African history
          </h2>
          <p className="mt-4 text-lg text-emerald-200">
            Register your interest now. It takes 10 seconds and costs nothing.
          </p>
          <div className="mt-8">
            <a href="#register" className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-8 py-3 text-sm font-semibold text-emerald-900 hover:bg-yellow-300 transition-colors">
              Register now
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {q}
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-4 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}