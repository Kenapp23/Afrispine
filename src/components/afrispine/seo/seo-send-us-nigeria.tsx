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
    q: 'How fast will my naira reach Nigeria?',
    a: 'Wallet transfers to OPay, PalmPay, and Moniepoint arrive within 2–10 minutes. Bank transfers to GTBank, Access Bank, or First Bank typically settle within 1–2 business days.',
  },
  {
    q: 'What is the USD to NGN exchange rate on AfriSpine?',
    a: 'Our displayed rate updates every 60 seconds. For $100, your recipient receives approximately ₦155,000 (minus the flat 1.5% fee). The exact naira amount is always shown before you confirm.',
  },
  {
    q: 'Can I transfer money to OPay or PalmPay from the US?',
    a: 'Yes! AfriSpine supports direct transfers to OPay, PalmPay, Moniepoint, and all major Nigerian bank accounts. Your recipient gets a notification the moment the funds land.',
  },
  {
    q: 'Is AfriSpine licensed to transfer money to Nigeria?',
    a: 'AfriSpine operates under full regulatory compliance. All transactions are processed through licensed corridors and partners. We follow strict AML/KYC protocols as required by both US and Nigerian regulators.',
  },
  {
    q: 'What fees does AfriSpine charge for US to Nigeria transfers?',
    a: 'Just 1.5% flat. No hidden FX markups, no receiving fees, no weekend surcharges. Send $200, pay exactly $203. Your recipient gets the full converted amount.',
  },
  {
    q: 'Can I pay school fees or medical bills in Nigeria from the US?',
    a: 'Absolutely. Many of our Nigerian-American users transfer money directly for school fees (UNILAG, UI, ABU), hospital bills, and property payments. Bank transfers work best for these larger payments.',
  },
  {
    q: 'What is the maximum I can send to Nigeria per transfer?',
    a: 'After KYC verification, you can send up to $3,000 per transaction and $10,000 per month. Business accounts have higher limits. Verification is quick with a US passport or green card.',
  },
];

export function SeoSendUsNigeria() {
  const navigate = useAppStore((s) => s.navigate);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Transfer Money from USA to Nigeria | AfriSpine';
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
    const desc = "The Nigerian diaspora's favourite way to send naira home. Direct to OPay, PalmPay, Moniepoint, GTBank, Access, or First Bank. 1.5% flat fee.";
    setMeta('description', desc);
    setOg('title', 'Transfer Money from USA to Nigeria | AfriSpine');
    setOg('description', desc);
    setOg('url', 'https://www.afri-spine.com/send/us-nigeria');
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
            name: 'Transfer Money from USA to Nigeria | AfriSpine',
            description: "The Nigerian diaspora's favourite way to send naira home. Direct to OPay, PalmPay, Moniepoint, GTBank, Access, or First Bank. 1.5% flat fee.",
            provider: {
              '@type': 'Organization',
              name: 'AfriSpine',
              url: 'https://www.afri-spine.com',
            },
            areaServed: [
              { '@type': 'Country', name: 'United States' },
              { '@type': 'Country', name: 'Nigeria' },
            ],
            feesAndChargesSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'USD',
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
            🇺🇸 → 🇳🇬 US to Nigeria Corridor
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Transfer Money from the USA to Nigeria
            <br className="hidden sm:block" />
            <span className="text-amber-300"> Fast, Affordable, Reliable</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            The Nigerian diaspora&apos;s favourite way to send naira home. Direct to OPay,
            PalmPay, Moniepoint, GTBank, Access, or First Bank. 1.5% flat fee.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-6 py-3">
            <span className="text-sm text-emerald-200">Live rate</span>
            <span className="text-2xl sm:text-3xl font-bold">$1 = ₦1,550</span>
            <span className="text-xs text-emerald-300">Updated just now</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-lg px-8 h-12"
              onClick={() => navigate('signup')}
            >
              Transfer Money to Nigeria Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 h-12"
              onClick={() => navigate('pricing')}
            >
              Compare Our Rates
            </Button>
          </div>
          <PartnerDisclosure variant="inline" className="mt-3 text-center text-white/60" />
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">
          Send Dollars, Receive Naira in Minutes
        </h2>
        <p className="mt-2 text-center text-stone-500 max-w-xl mx-auto">
          No more queuing at Western Union. Send from your phone.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            { step: '1', icon: <Globe2 className="h-8 w-8 text-emerald-600" />, title: 'Enter amount in USD', desc: 'Enter how many dollars you want to send. We show the exact naira your recipient gets upfront.' },
            { step: '2', icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: 'Pay via secure processor', desc: 'Pay with your US debit card, ACH transfer, or Apple Pay. All payments are encrypted and secure.' },
            { step: '3', icon: <Zap className="h-8 w-8 text-emerald-600" />, title: 'Naira delivered fast', desc: 'OPay and PalmPay: 2–10 minutes. Bank transfers to GTBank, Access, First Bank: 1–2 business days.' },
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Smartphone className="h-6 w-6 text-green-600" />, title: 'OPay', desc: 'Fast transfer to any OPay wallet. Fast and free for the recipient.', tag: 'Most Popular' },
              { icon: <Smartphone className="h-6 w-6 text-purple-600" />, title: 'PalmPay', desc: 'Direct to PalmPay wallet. Your recipient can use it immediately for payments.' },
              { icon: <Smartphone className="h-6 w-6 text-blue-600" />, title: 'Moniepoint', desc: 'Send to Moniepoint accounts for fast access to cash at any agent.' },
              { icon: <Building2 className="h-6 w-6 text-emerald-600" />, title: 'Bank Transfer', desc: 'GTBank, Access Bank, First Bank, UBA, Zenith, and all other Nigerian banks.' },
            ].map((m) => (
              <div key={m.title} className="rounded-2xl border border-stone-200 p-5 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3">
                  {m.icon}
                  <h3 className="font-semibold text-stone-900 text-sm">{m.title}</h3>
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
          <h2 className="text-2xl sm:text-3xl font-bold">1.5% Flat Fee. Transparent. Honest.</h2>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto">
            No hidden FX spreads. No weekend surcharges. No receiving-end deductions.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto text-left">
            {[
              { label: 'You send', value: '$200.00' },
              { label: 'Our fee (1.5%)', value: '$3.00' },
              { label: 'Recipient gets', value: '₦305,445' },
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">Why Nigerians in America Trust AfriSpine</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'Fully Regulated', desc: 'Compliant with US and Nigerian financial regulations' },
              { icon: <Clock className="h-6 w-6" />, title: 'Fast Delivery', desc: 'Wallet transfers in under 10 minutes' },
              { icon: <Users className="h-6 w-6" />, title: 'Trusted Community', desc: 'Thousands of Nigerian-Americans use AfriSpine monthly' },
              { icon: <Globe2 className="h-6 w-6" />, title: 'Multi-Channel', desc: 'OPay, PalmPay, Moniepoint, and all banks' },
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
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-900">What Nigerians in the US Say</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Chukwuma Eze', location: 'Houston, TX', text: 'I transfer money to my wife\'s OPay account every two weeks. It arrives before I finish my coffee. Western Union used to take 2 days and charge me $15. AfriSpine is a lifesaver.', rating: 5 },
            { name: 'Funke Adeyemi', location: 'New York, NY', text: 'Paying my parents\' medical bills at LUTH used to be so stressful. Now I just send to their Access Bank account and they pay the hospital directly. So convenient.', rating: 5 },
            { name: 'Emeka Nwosu', location: 'Atlanta, GA', text: 'The rates are genuinely better than what I was getting with my bank. And I love that my brother gets the full naira amount — nothing deducted on his end.', rating: 5 },
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
          <p className="mt-2 text-center text-stone-500">Sending USD to Nigeria — everything you need to know.</p>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
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
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Start Sending Naira Home Today</h2>
        <p className="mt-3 text-stone-500 max-w-lg mx-auto">
          Join the growing community of Nigerians in America who trust AfriSpine
          for fast, affordable, and reliable money transfers.
        </p>
        <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 h-12" onClick={() => navigate('send')}>
          Transfer Money to Nigeria Now <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <PartnerDisclosure variant="inline" className="mt-4 text-center" />
      </section>
    </div>
  );
}