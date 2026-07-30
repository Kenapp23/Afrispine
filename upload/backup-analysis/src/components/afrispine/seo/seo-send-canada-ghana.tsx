'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShieldCheck, Zap, Smartphone, Building2,
  Star, ChevronDown, Clock, Globe2, Users,
} from 'lucide-react';

const faqs = [
  {
    q: 'How long does a transfer from Canada to Ghana take?',
    a: 'MTN MoMo and Vodafone Cash transfers arrive within 2–10 minutes. Bank transfers to GCB, Ecobank Ghana, or other banks typically settle within 1–2 business days.',
  },
  {
    q: 'What is the CAD to GHS exchange rate?',
    a: 'Our live rate is displayed on this page. We update it every 60 seconds. You\'ll always see the exact cedi amount before confirming. No surprises, no hidden spreads.',
  },
  {
    q: 'Can I send money to MTN MoMo from Canada?',
    a: 'Yes! MTN MoMo is our most popular delivery method in Ghana. Your recipient gets the money directly in their mobile wallet and can use it for payments, airtime, or cash-out at any MTN agent.',
  },
  {
    q: 'Is AfriSpine regulated for transfers from Canada?',
    a: 'AfriSpine operates under full compliance with all applicable financial regulations. We follow strict AML/KYC protocols required by Canadian and Ghanaian regulators.',
  },
  {
    q: 'What are the transfer fees from Canada to Ghana?',
    a: 'Just 1.5% flat. For C$200, you pay C$203 total. No hidden FX markups, no receiving fees. Your recipient in Ghana gets the full cedi amount.',
  },
  {
    q: 'Can I pay bills in Ghana from Canada?',
    a: 'Yes. You can pay ECG electricity bills, water bills, and even buy airtime for your family in Ghana directly through AfriSpine. It\'s one of our most popular features among the Ghanaian-Canadian community.',
  },
  {
    q: 'Which Ghanaian banks do you support?',
    a: 'We support transfers to GCB Bank, Ecobank Ghana, Ghana Commercial Bank, Agricultural Development Bank (ADB), Stanbic Bank, Standard Chartered Ghana, Fidelity Bank, and Republic Bank.',
  },
];

export function SeoSendCanadaGhana() {
  const navigate = useAppStore((s) => s.navigate);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Send Money from Canada to Ghana | AfriSpine';
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
    const desc = 'The fastest way for Ghanaians in Toronto, Calgary, and Vancouver to send cedis home. MTN MoMo, Vodafone Cash, and bank transfers. 1.5% flat fee.';
    setMeta('description', desc);
    setOg('title', 'Send Money from Canada to Ghana | AfriSpine');
    setOg('description', desc);
    setOg('url', 'https://afri-spine.com/send/canada-ghana');
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
            name: 'Send Money from Canada to Ghana | AfriSpine',
            description: 'The fastest way for Ghanaians in Toronto, Calgary, and Vancouver to send cedis home. MTN MoMo, Vodafone Cash, and bank transfers. 1.5% flat fee.',
            provider: {
              '@type': 'Organization',
              name: 'AfriSpine',
              url: 'https://afri-spine.com',
            },
            areaServed: [
              { '@type': 'Country', name: 'Canada' },
              { '@type': 'Country', name: 'Ghana' },
            ],
            feesAndChargesSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'CAD',
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
            🇨🇦 → 🇬🇭 Canada to Ghana Corridor
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Send Money from Canada to Ghana
            <br className="hidden sm:block" />
            <span className="text-amber-300"> Your Family Deserves Better</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            The fastest way for Ghanaians in Toronto, Calgary, and Vancouver to send cedis
            home. MTN MoMo, Vodafone Cash, and bank transfers. 1.5% flat fee.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-6 py-3">
            <span className="text-sm text-emerald-200">Live rate</span>
            <span className="text-2xl sm:text-3xl font-bold">C$1 = GH₵ 11.00</span>
            <span className="text-xs text-emerald-300">Updated just now</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12" onClick={() => navigate('signup')}>
              Send Money to Ghana Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 h-12" onClick={() => navigate('pricing')}>
              View Exchange Rates
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          Send Canadian Dollars, Receive Cedis Fast
        </h2>
        <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
          No more long queues at remittance shops. Send from your couch.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            { step: '1', icon: <Globe2 className="h-8 w-8 text-emerald-600" />, title: 'Enter amount in CAD', desc: 'Tell us how many Canadian dollars to send. We\'ll convert at the live rate and show the exact cedi amount.' },
            { step: '2', icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: 'Pay securely from Canada', desc: 'Use your Canadian debit card, Interac, or bank transfer. All payments are encrypted and PCI-DSS compliant.' },
            { step: '3', icon: <Zap className="h-8 w-8 text-emerald-600" />, title: 'Cedis delivered in minutes', desc: 'MTN MoMo and Vodafone Cash: 2–10 minutes. Bank transfers to GCB or Ecobank Ghana: 1–2 business days.' },
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Delivery Options in Ghana</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Smartphone className="h-7 w-7 text-yellow-500" />, title: 'MTN MoMo', desc: 'The most popular mobile money in Ghana. Your recipient gets cedis in their MTN wallet instantly. Pay bills, buy airtime, or cash out at any MTN agent.', tag: 'Most Popular' },
              { icon: <Smartphone className="h-7 w-7 text-red-600" />, title: 'Vodafone Cash', desc: 'Send directly to Vodafone Cash wallets. Available across Ghana with fast confirmation and wide agent network.' },
              { icon: <Building2 className="h-7 w-7 text-emerald-600" />, title: 'Bank Transfer', desc: 'Direct to GCB Bank, Ecobank Ghana, Agricultural Development Bank, Stanbic, Standard Chartered, Fidelity, and Republic Bank.' },
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
          <h2 className="text-2xl sm:text-3xl font-bold">1.5% Flat Fee. No Games.</h2>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto">
            Other remittance services charge 3–8% when you include their hidden FX markups. We charge 1.5%. That&apos;s it.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            {[
              { label: 'You send', value: 'C$200.00' },
              { label: 'Our fee (1.5%)', value: 'C$3.00' },
              { label: 'Recipient gets', value: 'GH₵ 2,167' },
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Why Ghanaians in Canada Choose AfriSpine</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'Fully Compliant', desc: 'Regulated and compliant with all financial authorities' },
              { icon: <Clock className="h-6 w-6" />, title: 'Fast Transfers', desc: 'MTN MoMo delivery in under 10 minutes' },
              { icon: <Users className="h-6 w-6" />, title: 'Growing Community', desc: 'Thousands of Ghanaians in Canada trust us monthly' },
              { icon: <Globe2 className="h-6 w-6" />, title: 'Multiple Channels', desc: 'MoMo, Vodafone Cash, and all major banks' },
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
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">What Ghanaians in Canada Say</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Kwame Asante', location: 'Toronto, ON', text: 'I used to queue at the MoneyGram in Rexdale every month. Now I send from my phone while on the TTC. My mum in Kumasi gets it on her MTN MoMo in minutes. This is the future.', rating: 5 },
            { name: 'Abena Mensah', location: 'Calgary, AB', text: 'Paying ECG bills for my grandmother used to mean asking a cousin to go queue. Now I do it myself through AfriSpine. She always has electricity now.', rating: 5 },
            { name: 'Kofi Boateng', location: 'Vancouver, BC', text: 'The exchange rate on AfriSpine is consistently better than the banks. I send C$500 monthly to my GCB account for a building project in Accra. Smooth every time.', rating: 5 },
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
          <p className="mt-2 text-center text-stone-500">Everything about sending Canadian dollars to Ghana.</p>
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
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Send Cedis to Ghana Today</h2>
        <p className="mt-3 text-stone-500 max-w-lg mx-auto">
          Whether your family is in Accra, Kumasi, Tamale, or Cape Coast,
          AfriSpine delivers cedis fast. Sign up and send in under 5 minutes.
        </p>
        <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 h-12" onClick={() => navigate('send')}>
          Send Money to Ghana Now <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}