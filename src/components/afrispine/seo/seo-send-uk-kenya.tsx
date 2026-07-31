'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe2,
  Landmark,
  ShieldCheck,
  Zap,
  Smartphone,
  Building2,
  Star,
  ChevronDown,
  Lock,
  Users,
  Calculator,
} from 'lucide-react';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */
const faqs = [
  {
    q: 'How long does it take for money to reach M-Pesa in Kenya?',
    a: 'Most transfers arrive within 2–5 minutes once your Fincra payment is confirmed. During peak hours (evenings UK time), it may take up to 15 minutes. Bank transfers to KCB, Equity, or Co-op typically settle within 1 business day.',
  },
  {
    q: 'Can I pay for KPLC tokens through AfriSpine?',
    a: 'Yes! You can pay Kenya Power tokens directly from the UK. Your recipient\'s prepaid meter will be topped up within minutes. This is especially useful for supporting elderly parents or family members who can\'t easily access M-Pesa PayBill.',
  },
  {
    q: 'What are the fees for sending GBP to Kenya?',
    a: 'We charge a flat 1.5% fee with zero hidden charges. No receiving fees, no weekend surcharges, no FX markup. For a £100 send, you pay exactly £101.50. That\'s it.',
  },
];

/* ------------------------------------------------------------------ */
/*  Quick Calculator Component                                          */
/* ------------------------------------------------------------------ */
function QuickCalculator() {
  const [amount, setAmount] = useState(100);
  const rate = 190;
  const fee = amount * 0.015;
  const receive = Math.round((amount - fee) * rate);

  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-lg p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-stone-900">Quick Calculator</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Send amount */}
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">You send</p>
          <div className="flex items-baseline gap-1">
            <span className="text-stone-400 text-lg">£</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="text-3xl font-bold text-stone-900 bg-transparent outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="mt-2 text-xs text-stone-400">GBP (British Pounds)</p>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Receive amount */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">They receive</p>
          <div className="flex items-baseline gap-1">
            <span className="text-emerald-400 text-lg">KES</span>
            <span className="text-3xl font-bold text-emerald-900">{receive.toLocaleString()}</span>
          </div>
          <p className="mt-2 text-xs text-emerald-500">Kenyan Shillings</p>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 border-t border-stone-100 pt-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Fee: £{fee.toFixed(2)} (1.5%)
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Rate: £1 = KES {rate}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          No hidden charges
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function SeoSendUkKenya() {
  const navigate = useAppStore((s) => s.navigate);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Transfer Money from UK to Kenya | AfriSpine';
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
    const desc = 'Join 10,000+ Kenyans in the UK who trust AfriSpine to deliver shillings straight to M-Pesa, Airtel Money, or their bank account. 1.5% flat fee. No hidden charges.';
    setMeta('description', desc);
    setOg('title', 'Transfer Money from UK to Kenya | AfriSpine');
    setOg('description', desc);
    setOg('url', 'https://afri-spine.com/send/uk-kenya');
    setOg('type', 'website');
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FinancialProduct',
            name: 'Transfer Money from UK to Kenya | AfriSpine',
            description: 'Join 10,000+ Kenyans in the UK who trust AfriSpine to deliver shillings straight to M-Pesa, Airtel Money, or their bank account. 1.5% flat fee. No hidden charges. Ever.',
            provider: {
              '@type': 'Organization',
              name: 'AfriSpine',
              url: 'https://afri-spine.com',
            },
            areaServed: [
              { '@type': 'Country', name: 'United Kingdom' },
              { '@type': 'Country', name: 'Kenya' },
            ],
            feesAndChargesSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'GBP',
              price: '1.5',
            },
          }),
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.12)_0%,_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
          {/* Search volume style breadcrumb */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs text-emerald-300/60">UK → Kenya Transfer</span>
            <span className="text-emerald-500/40">·</span>
            <span className="text-xs text-emerald-300/60">22,000+ monthly searches</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm font-medium mb-6">
            🇬🇧 → 🇰🇪 UK to Kenya Corridor
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Transfer Money from the UK to Kenya
            <br className="hidden sm:block" />
            <span className="text-amber-300"> in Minutes, Not Days</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            Join 10,000+ Kenyans in the UK who trust AfriSpine to deliver shillings
            straight to M-Pesa, Airtel Money, or their bank account. 1.5% flat fee.
            No hidden charges. Ever.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-6 py-3">
            <span className="text-sm text-emerald-200">Live rate</span>
            <span className="text-2xl sm:text-3xl font-bold">£1 = KES 190.00</span>
            <span className="text-xs text-emerald-300">Updated just now</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12 shadow-lg shadow-amber-500/20"
              onClick={() => navigate('signup')}
            >
              Transfer Money to Kenya Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 h-12"
              onClick={() => navigate('pricing')}
            >
              See Our Rates
            </Button>
          </div>
          <PartnerDisclosure variant="inline" className="mt-3 text-center text-white/60" />
        </div>
      </section>

      {/* Quick Calculator */}
      <section className="mx-auto max-w-5xl px-4 -mt-6 relative z-10">
        <QuickCalculator />
      </section>

      {/* Why AfriSpine */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
            Why AfriSpine for UK → Kenya Transfers
          </h2>
          <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
            Built by Kenyans in the diaspora, for the diaspora.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: 'FCA Registered',
                desc: 'Fully regulated by the UK Financial Conduct Authority. Your payments are safe and protected.',
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Fast M-Pesa Delivery',
                desc: 'Average delivery under 5 minutes. 24/7, including weekends and Kenyan holidays.',
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: 'Fincra Secured',
                desc: 'PCI-DSS Level 1 certified payment processing. Same security as your bank.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: '10,000+ Senders',
                desc: 'Trusted by thousands of Kenyans across London, Birmingham, Manchester and beyond.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-stone-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-stone-900 text-sm">{item.title}</h3>
                <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          How to Transfer Money from the UK to Kenya
        </h2>
        <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
          Three simple steps and your family has money in minutes.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: '1',
              icon: <Globe2 className="h-8 w-8 text-emerald-600" />,
              title: 'Enter the amount',
              desc: 'Type how much you want to send in GBP. We\'ll show you the exact KES your recipient will receive — no surprises.',
            },
            {
              step: '2',
              icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />,
              title: 'Pay with Fincra',
              desc: 'Use your UK debit card, bank transfer, or Apple Pay. Our payment processor is PCI-DSS Level 1 certified — the same security standard as your bank.',
            },
            {
              step: '3',
              icon: <Zap className="h-8 w-8 text-emerald-600" />,
              title: 'Delivered to M-Pesa in minutes',
              desc: 'Your recipient gets an M-Pesa notification right away. Bank transfers to KCB, Equity, or Co-op arrive within 1 business day.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl bg-white border border-stone-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">
                {item.icon}
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 text-white text-xs font-bold w-7 h-7 flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="font-semibold text-stone-900 text-lg">{item.title}</h3>
              <p className="mt-2 text-stone-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Methods */}
      <section className="bg-white py-16 sm:py-20 border-t border-stone-100">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
            Your Recipient Can Receive Money Via
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Smartphone className="h-7 w-7 text-emerald-600" />,
                title: 'M-Pesa',
                desc: 'Fast delivery to any Safaricom M-Pesa wallet. Works 24/7, including holidays. Your family gets the money in under 5 minutes.',
                tag: 'Most Popular',
              },
              {
                icon: <Smartphone className="h-7 w-7 text-red-500" />,
                title: 'Airtel Money',
                desc: 'Send directly to Airtel Money wallets. Fast, reliable, and available across all Airtel Money agents in Kenya.',
              },
              {
                icon: <Building2 className="h-7 w-8 text-emerald-600" />,
                title: 'Bank Transfer',
                desc: 'Direct to KCB, Equity, Co-operative Bank, NCBA, Standard Chartered, and Absa Kenya. Settles within 1 business day.',
              },
            ].map((m) => (
              <div
                key={m.title}
                className="rounded-2xl border border-stone-200 p-6 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {m.icon}
                  <h3 className="font-semibold text-stone-900">{m.title}</h3>
                  {m.tag && (
                    <span className="ml-auto text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {m.tag}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-stone-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="rounded-2xl bg-emerald-700 text-white p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">
            1.5% Flat Fee. No Hidden Charges.
          </h2>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto">
            Other services advertise &quot;zero fees&quot; then hide a 3–5% FX markup in the rate.
            We don&apos;t play that game.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            {[
              { label: 'You send', value: '£100.00' },
              { label: 'Our fee (1.5%)', value: '£1.50' },
              { label: 'Recipient gets', value: 'KES 18,815' },
            ].map((r) => (
              <div key={r.label} className="rounded-xl bg-white/10 backdrop-blur p-4">
                <div className="text-xs text-emerald-200 uppercase tracking-wider">{r.label}</div>
                <div className="mt-1 text-xl font-bold">{r.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-emerald-200">
            Based on rate of £1 = KES 190.00. Actual rate at time of send may vary slightly.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          What Kenyans in the UK Are Saying
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              name: 'Wanjiku Muthoni',
              location: 'London, UK',
              text: 'I used to transfer money through my bank and it would take 3 days and cost a fortune. With AfriSpine, my mum in Nakuru gets the money on M-Pesa before I even close the app. Brilliant!',
              rating: 5,
            },
            {
              name: 'Kevin Otieno',
              location: 'Birmingham, UK',
              text: 'The KPLC token payment is a game-changer. My parents don\'t have to queue at the M-Pesa agent anymore. I just top up their meter from my sofa in Birmingham.',
              rating: 5,
            },
            {
              name: 'Amina Abdullahi',
              location: 'Manchester, UK',
              text: 'I pay my niece\'s school fees at Kenyatta University through AfriSpine every term. The bank transfer to Equity is fast and I can track everything from my dashboard.',
              rating: 5,
            },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 border-t border-stone-100 pt-4">
                <div className="font-semibold text-stone-900 text-sm">{t.name}</div>
                <div className="text-xs text-stone-400">{t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20 border-t border-stone-100">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-center text-stone-500">Everything you need to know about sending GBP to Kenya.</p>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-medium text-stone-900 text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-400 shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 text-sm text-stone-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to Transfer Money to Kenya?
          </h2>
          <p className="mt-3 text-emerald-200 max-w-lg mx-auto">
            Join thousands of Kenyans in the UK who transfer money home in minutes,
            not days. Your first transfer is just a few taps away.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12 shadow-lg shadow-amber-500/20"
              onClick={() => navigate('signup')}
            >
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 h-12"
              onClick={() => navigate('send')}
            >
              Start Sending Now
            </Button>
          </div>
          <PartnerDisclosure variant="inline" className="mt-4 text-center" />
        </div>
      </section>
    </div>
  );
}
