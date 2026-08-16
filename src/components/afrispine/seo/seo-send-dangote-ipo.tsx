'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShieldCheck, Zap, Star, ChevronDown,
  Clock, Globe2, Users, TrendingUp, BarChart3, Building2,
} from 'lucide-react';

const faqs = [
  {
    q: 'What is the Dangote Refinery IPO?',
    a: 'The Dangote Refinery, located in Lagos, Nigeria, is the world\'s largest single-train refinery with a capacity of 650,000 barrels per day. The IPO (Initial Public Offering) is the public sale of shares in Dangote Petroleum Refinery, giving investors a stake in Africa\'s most ambitious industrial project.',
  },
  {
    q: 'How can I access the Dangote IPO from abroad?',
    a: 'AfriSpine facilitates access to the Dangote IPO for the African diaspora. You register your interest, complete KYC verification, and when the IPO opens, you can place orders through our platform using GBP, USD, or CAD. We handle the compliance, FX conversion, and order allocation.',
  },
  {
    q: 'What is the estimated valuation of Dangote Refinery?',
    a: 'Industry analysts estimate the Dangote Refinery valuation at between $15 billion and $20 billion. The refinery is expected to transform Nigeria from a fuel-importing nation to a net exporter, creating massive value for shareholders.',
  },
  {
    q: 'When will the Dangote IPO open?',
    a: 'The exact date has not been publicly announced yet. Registering your interest with AfriSpine ensures you\'ll be among the first to know when the IPO opens. We\'ll send you updates, estimated pricing, and a direct link to invest.',
  },
  {
    q: 'What is the minimum investment amount?',
    a: 'While the exact minimum has not been set, we expect the minimum lot size to be accessible for retail investors. AfriSpine aims to make the IPO available from as low as $100 or equivalent, so diaspora investors at every level can participate.',
  },
  {
    q: 'Is investing through AfriSpine safe and regulated?',
    a: 'Yes. AfriSpine is FCA-registered and works with licensed capital market operators in Nigeria. All investments are held through proper custodial arrangements. We follow the same regulatory framework as Nigerian stockbrokers.',
  },
  {
    q: 'Can I access other Nigerian stocks through AfriSpine?',
    a: 'Absolutely! AfriSpine\'s investment module gives you access to Nigerian equities on the Nigerian Exchange (NGX), including GTBank, Access, MTN Nigeria, Dangote Cement, Zenith Bank, and many more. The Dangote IPO is just the beginning.',
  },
];

export function SeoSendDangoteIpo() {
  const navigate = useAppStore((s) => s.navigate);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Dangote IPO Registration | AfriSpine';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const setOg = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="og:${prop}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', `og:${prop}`);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const desc = "Register for Africa's largest-ever IPO — Dangote Group on the Nigerian Stock Exchange. Invest from anywhere in the world through AfriSpine.";
    setMeta('description', desc);
    setOg('title', 'Dangote IPO Registration | AfriSpine');
    setOg('description', desc);
    setOg('url', 'https://www.afri-spine.com/dangote-ipo');
    setOg('type', 'website');
  }, []);

  const handleRegister = () => {
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'InvestmentOrDeposit',
            name: 'Dangote IPO Registration | AfriSpine',
            description: "Register for Africa's largest-ever IPO — Dangote Group on the Nigerian Stock Exchange",
            provider: {
              '@type': 'Organization',
              name: 'AfriSpine',
            },
          }),
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur px-4 py-1.5 text-sm font-medium mb-6 text-amber-300">
            <TrendingUp className="h-4 w-4" /> Investment Opportunity
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Access the Dangote Refinery IPO
            <br className="hidden sm:block" />
            <span className="text-amber-300"> From Anywhere in the World</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            The world&apos;s largest single-train refinery is going public. AfriSpine gives
            the African diaspora a front-row seat to Africa’s most transformative
            industrial project — no Nigerian bank account needed.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            {[
              { label: 'Estimated Valuation', value: '$15–20 Billion' },
              { label: 'Refinery Capacity', value: '650,000 bpd' },
              { label: 'Location', value: 'Lekki, Lagos, Nigeria' },
            ].map((r) => (
              <div key={r.label} className="rounded-xl bg-white/10 backdrop-blur p-4">
                <div className="text-xs text-emerald-200 uppercase tracking-wider">{r.label}</div>
                <div className="mt-1 text-lg font-bold">{r.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12" onClick={() => navigate('signup')}>
              Register Your Interest <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 h-12" onClick={() => navigate('markets')}>
              Explore African Markets
            </Button>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          Why the Dangote Refinery IPO Is a Once-in-a-Generation Opportunity
        </h2>
        <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
          This isn&apos;t just an IPO — it&apos;s Africa&apos;s industrial coming of age.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Globe2 className="h-7 w-7 text-emerald-600" />, title: 'Africa\'s Largest Refinery', desc: '650,000 barrels per day capacity — enough to meet all of Nigeria\'s domestic fuel needs and export the surplus to West Africa and Europe.' },
            { icon: <BarChart3 className="h-7 w-7 text-emerald-600" />, title: '$15–20B Valuation', desc: 'Analysts project the refinery could be worth up to $20 billion. Early investors in Dangote Cement saw 10x returns — history could repeat.' },
            { icon: <Zap className="h-7 w-7 text-emerald-600" />, title: 'Fuel Import Reversal', desc: 'Nigeria spends $20B+ annually on imported fuel. The Dangote Refinery flips this — turning Nigeria into a net fuel exporter and generating massive revenue.' },
            { icon: <Building2 className="h-7 w-7 text-emerald-600" />, title: 'Diversified Revenue', desc: 'Beyond petrol and diesel, the refinery produces jet fuel, polypropylene, and fertiliser — multiple revenue streams for long-term shareholder value.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white border border-stone-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">{item.icon}</div>
              <h3 className="font-semibold text-stone-900">{item.title}</h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How AfriSpine Facilitates */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
            How AfriSpine Helps You Invest
          </h2>
          <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
            You don&apos;t need a Nigerian bank account or a stockbroker in Lagos. We handle everything.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', icon: <Users className="h-8 w-8 text-emerald-600" />, title: 'Register interest', desc: 'Sign up on AfriSpine and register for the Dangote IPO waitlist. We\'ll keep you updated on pricing, dates, and allocation details.' },
              { step: '2', icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: 'Complete KYC', desc: 'Verify your identity with a passport or ID. This is required by Nigerian capital market regulations — it takes under 5 minutes.' },
              { step: '3', icon: <Zap className="h-8 w-8 text-emerald-600" />, title: 'Invest when it opens', desc: 'When the IPO opens, choose your investment amount in your local currency (GBP, USD, CAD). We handle the FX conversion and share allocation.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-stone-200 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">{item.icon}</div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 text-white text-xs font-bold w-7 h-7 flex items-center justify-center">{item.step}</div>
                <h3 className="font-semibold text-stone-900 text-lg">{item.title}</h3>
                <p className="mt-2 text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="rounded-2xl bg-emerald-700 text-white p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Dangote Refinery — Key Milestones</h2>
          <div className="mt-8 space-y-6 max-w-2xl mx-auto">
            {[
              { date: '2021', event: 'Construction begins on the 650,000 bpd refinery in Lekki Free Zone, Lagos.' },
              { date: '2024', event: 'Mechanical completion and initial test runs begin. First crude oil processed.' },
              { date: '2025', event: 'Full commercial operations expected. IPO filing and roadshow anticipated.' },
              { date: '2025–2026', event: 'Expected IPO window. AfriSpine will facilitate diaspora participation.' },
            ].map((m) => (
              <div key={m.date} className="flex gap-4 items-start">
                <div className="shrink-0 w-16 text-right">
                  <span className="text-amber-300 font-bold text-sm">{m.date}</span>
                </div>
                <div className="w-px bg-emerald-500 self-stretch" />
                <p className="text-emerald-100 text-sm leading-relaxed">{m.event}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-emerald-200 text-sm">
            Timelines are based on public reporting and are subject to change. Register for updates.
          </p>
        </div>
      </section>

      {/* Other Investment Opportunities */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
            Not Just Dangote — Invest Across Africa
          </h2>
          <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
            AfriSpine gives you access to the best of African equities.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { ticker: 'SCOM', name: 'Safaricom', market: 'NSE', highlight: '+56% YTD', desc: 'Kenya\'s telecom giant. M-Pesa continues to dominate East African mobile money.' },
              { ticker: 'GTCO', name: 'Guaranty Trust', market: 'NGX', highlight: '+32% YTD', desc: 'Nigeria\'s most profitable bank. Strong digital banking growth across Africa.' },
              { ticker: 'MTN', name: 'MTN Nigeria', market: 'NGX', highlight: '+24% YTD', desc: 'Largest mobile operator in Nigeria. Fintech and data revenue accelerating.' },
            ].map((s) => (
              <div key={s.ticker} className="rounded-2xl border border-stone-200 p-5 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s.ticker}</span>
                  <span className="text-xs font-bold text-emerald-700">{s.highlight}</span>
                </div>
                <h3 className="mt-2 font-semibold text-stone-900">{s.name}</h3>
                <p className="text-xs text-stone-400">{s.market}</p>
                <p className="mt-2 text-sm text-stone-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Invest With Confidence</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { icon: <ShieldCheck className="h-6 w-6" />, title: 'FCA Registered', desc: 'AfriSpine is regulated by the UK Financial Conduct Authority. Your investments are protected.' },
            { icon: <Clock className="h-6 w-6" />, title: 'Licensed Partners', desc: 'We work with licensed capital market operators and custodians in Nigeria for all share allocations.' },
            { icon: <Globe2 className="h-6 w-6" />, title: 'Diaspora-First', desc: 'Built specifically for Africans abroad. No Nigerian bank account or broker needed.' },
          ].map((t) => (
            <div key={t.title} className="text-center rounded-2xl border border-stone-200 bg-white p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{t.icon}</div>
              <h3 className="mt-3 font-semibold text-stone-900 text-sm">{t.title}</h3>
              <p className="mt-1 text-xs text-stone-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Dangote IPO — FAQ</h2>
          <p className="mt-2 text-center text-stone-500">Your questions about investing in Africa&apos;s biggest IPO.</p>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                <button className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100 transition-colors" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span className="font-medium text-stone-900 text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-stone-400 shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && <div className="px-4 pb-4 text-sm text-stone-600 leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
          Don&apos;t Miss the Dangote IPO
        </h2>
        <p className="mt-3 text-stone-500 max-w-lg mx-auto">
          When the IPO opens, allocations may be limited. Register your interest now
          to be among the first to invest through AfriSpine.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 h-12" onClick={() => navigate('signup')}>
            Register Interest Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}