'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShieldCheck, Zap, Smartphone, Building2,
  Star, ChevronDown, Clock, Globe2, Users,
} from 'lucide-react';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';

const faqs = [
  {
    q: 'How quickly will naira reach Nigeria from the UK?',
    a: 'Transfers to OPay and PalmPay wallets arrive in 2–10 minutes. Bank transfers to GTBank, Access, First Bank, UBA, and Zenith settle within 1–2 business days.',
  },
  {
    q: 'What is the GBP to NGN rate today?',
    a: 'Our live rate is shown above and updates every 60 seconds. For £100, your recipient gets approximately ₦195,000 (minus the 1.5% flat fee). The exact naira is always shown before you confirm.',
  },
  {
    q: 'Can I send directly to OPay or PalmPay from the UK?',
    a: 'Absolutely. OPay and PalmPay are two of our most popular delivery channels. Your recipient in Nigeria gets a notification right away when the money lands.',
  },
  {
    q: 'Is AfriSpine FCA-registered for UK to Nigeria transfers?',
    a: 'Yes. AfriSpine is registered with the UK Financial Conduct Authority (FCA). We maintain strict compliance with all AML/KYC requirements mandated by UK and Nigerian regulators.',
  },
  {
    q: 'How much does it cost to send pounds to Nigeria?',
    a: 'Just 1.5% flat. For £200, you pay £203 total. No hidden FX spread, no receiving fees, no weekend markups. The naira rate you see is the rate you get.',
  },
  {
    q: 'Can I pay for a Dangote IPO or Nigerian stocks from the UK?',
    a: 'Yes! AfriSpine offers an investment module where you can buy Nigerian equities including Dangote shares, GTBank, Access, and MTN Nigeria directly from the UK. Check our Markets section for details.',
  },
  {
    q: 'Which Nigerian banks can I transfer to?',
    a: 'We support all major Nigerian banks: GTBank, Access Bank, First Bank, UBA, Zenith Bank, Fidelity Bank, Stanbic IBTC, Wema Bank, and Sterling Bank. If your recipient banks elsewhere, just let us know.',
  },
];

export function SeoSendUkNigeria() {
  const navigate = useAppStore((s) => s.navigate);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Transfer Money from UK to Nigeria | AfriSpine';
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
    const desc = "The UK's largest Nigerian community trusts AfriSpine for naira transfers. Direct to OPay, PalmPay, GTBank, Access, and all Nigerian banks. 1.5% flat.";
    setMeta('description', desc);
    setOg('title', 'Transfer Money from UK to Nigeria | AfriSpine');
    setOg('description', desc);
    setOg('url', 'https://www.afri-spine.com/send/uk-nigeria');
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
            name: 'Transfer Money from UK to Nigeria | AfriSpine',
            description: "The UK's largest Nigerian community trusts AfriSpine for naira transfers. Direct to OPay, PalmPay, GTBank, Access, and all Nigerian banks. 1.5% flat.",
            provider: {
              '@type': 'Organization',
              name: 'AfriSpine',
              url: 'https://www.afri-spine.com',
            },
            areaServed: [
              { '@type': 'Country', name: 'United Kingdom' },
              { '@type': 'Country', name: 'Nigeria' },
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
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm font-medium mb-6">
            🇬🇧 → 🇳🇬 UK to Nigeria Corridor
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Transfer Money from the UK to Nigeria
            <br className="hidden sm:block" />
            <span className="text-amber-300"> Better Rates, Faster Delivery</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            The UK&apos;s largest Nigerian community trusts AfriSpine for naira transfers.
            Direct to OPay, PalmPay, GTBank, Access, and all Nigerian banks. 1.5% flat.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-6 py-3">
            <span className="text-sm text-emerald-200">Live rate</span>
            <span className="text-2xl sm:text-3xl font-bold">£1 = ₦1,950</span>
            <span className="text-xs text-emerald-300">Updated just now</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12" onClick={() => navigate('signup')}>
              Transfer Money to Nigeria Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 h-12" onClick={() => navigate('pricing')}>
              Compare GBP to NGN Rates
            </Button>
          </div>
          <PartnerDisclosure variant="inline" className="mt-3 text-center text-white/60" />
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          Send Pounds, Receive Naira — It&apos;s That Simple
        </h2>
        <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
          Forget high-street bureaux de change. Send from your phone in under 2 minutes.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            { step: '1', icon: <Globe2 className="h-8 w-8 text-emerald-600" />, title: 'Enter amount in GBP', desc: 'Type how many pounds you want to send. We convert at the live market rate and show the exact naira your recipient will receive.' },
            { step: '2', icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: 'Pay via Eversend (secure processor)', desc: 'Use your UK debit card, bank transfer, or Apple Pay. Our payment processor is PCI-DSS Level 1 certified — bank-grade security.' },
            { step: '3', icon: <Zap className="h-8 w-8 text-emerald-600" />, title: 'Naira delivered fast', desc: 'OPay/PalmPay: 2–10 minutes. GTBank, Access, First Bank: 1–2 business days. Your recipient is notified right away.' },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl bg-white border border-stone-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">{item.icon}</div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 text-white text-xs font-bold w-7 h-7 flex items-center justify-center">{item.step}</div>
              <h3 className="font-semibold text-stone-900 text-lg">{item.title}</h3>
              <p className="mt-2 text-stone-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Methods */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Delivery Options in Nigeria</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Smartphone className="h-7 w-7 text-green-600" />, title: 'OPay', desc: 'Fast transfer to any OPay wallet. Most popular among Nigerians for daily transactions — food, transport, and bills.', tag: 'Most Popular' },
              { icon: <Smartphone className="h-7 w-7 text-purple-600" />, title: 'PalmPay', desc: 'Direct to PalmPay wallet. Your recipient can use it immediately for payments at any PalmPay merchant across Nigeria.' },
              { icon: <Building2 className="h-7 w-7 text-emerald-600" />, title: 'Bank Transfer', desc: 'GTBank, Access Bank, First Bank, UBA, Zenith, Fidelity, Stanbic IBTC, Wema, and Sterling. Full Nigerian banking coverage.' },
            ].map((m) => (
              <div key={m.title} className="rounded-2xl border border-stone-200 p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3">
                  {m.icon}
                  <h3 className="font-semibold text-stone-900">{m.title}</h3>
                  {m.tag && <span className="ml-auto text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{m.tag}</span>}
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
          <h2 className="text-2xl sm:text-3xl font-bold">1.5% Flat. No Nonsense.</h2>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto">
            High-street bureaux de change in Peckham and Dalston charge 3–5% plus bad rates.
            AfriSpine charges 1.5% at the real market rate.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            {[
              { label: 'You send', value: '£200.00' },
              { label: 'Our fee (1.5%)', value: '£3.00' },
              { label: 'Recipient gets', value: '₦384,075' },
            ].map((r) => (
              <div key={r.label} className="rounded-xl bg-white/10 backdrop-blur p-4">
                <div className="text-xs text-emerald-200 uppercase tracking-wider">{r.label}</div>
                <div className="mt-1 text-xl font-bold">{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Why Nigerians in the UK Trust AfriSpine</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'FCA Registered', desc: 'Registered with the UK Financial Conduct Authority' },
              { icon: <Clock className="h-6 w-6" />, title: 'Fast Delivery', desc: 'Wallet transfers in under 10 minutes' },
              { icon: <Users className="h-6 w-6" />, title: 'UK Community', desc: 'Trusted by Nigerians across London, Manchester, and Leeds' },
              { icon: <Globe2 className="h-6 w-6" />, title: 'Full Coverage', desc: 'OPay, PalmPay, and all Nigerian banks' },
            ].map((t) => (
              <div key={t.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{t.icon}</div>
                <h3 className="mt-3 font-semibold text-stone-900 text-sm">{t.title}</h3>
                <p className="mt-1 text-xs text-stone-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">What Nigerians in the UK Say</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Chidi Okonkwo', location: 'London, UK', text: 'I used to go to the bureau de change on Peckham High Street every month. Now I send from my sofa in Lewisham. The rate is better, it\'s faster, and I don\'t have to carry cash. AfriSpine changed the game.', rating: 5 },
            { name: 'Blessing Ibrahim', location: 'Manchester, UK', text: 'My husband sends money to my OPay account from his office in Salford. By the time I finish work at the hospital in Manchester, the naira is already there. So reliable.', rating: 5 },
            { name: 'Tunde Bakare', location: 'Leeds, UK', text: 'I invested in GTBank shares through AfriSpine and I also use it for transfers. The fact that I can do both in one app is brilliant. My portfolio is up 15% this year.', rating: 5 },
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
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Frequently Asked Questions</h2>
          <p className="mt-2 text-center text-stone-500">Sending GBP to Nigeria — your questions answered.</p>
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
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Start Sending Naira from the UK</h2>
        <p className="mt-3 text-stone-500 max-w-lg mx-auto">
          Over 200,000 Nigerians call the UK home. Join the thousands who
          use AfriSpine to transfer money home with better rates and faster delivery.
        </p>
        <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 h-12" onClick={() => navigate('send')}>
          Transfer Money to Nigeria Now <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <PartnerDisclosure variant="inline" className="mt-4 text-center" />
      </section>
    </div>
  );
}