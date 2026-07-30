'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  CheckCircle,
  Lock,
  Smartphone,
  CreditCard,
  User,
  Search,
  Wallet,
  ArrowDownToLine,
  ChevronDown,
} from 'lucide-react';
import MarketTicker from './market-ticker';
import ProductPillars from './product-pillars';
import MoversCompact from './movers-compact';
import IntraAfricaBlock from './intra-africa-block';
import DangoteIpoBlock from './dangote-ipo-block';
import Testimonials from './testimonials';
import ChinaCorridorTeaser from './china-corridor-teaser';
import GiftingStrip from './gifting-strip';

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-muted/50 transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const detectedCountry = useAppStore((s) => s.detectedCountry);
  const setDetectedCountry = useAppStore((s) => s.setDetectedCountry);
  const viewParams = useAppStore((s) => s.viewParams);

  React.useEffect(() => {
    if (detectedCountry) return;
    fetch('https://ip-api.com/json?fields=countryCode')
      .then(r => r.json())
      .then(data => {
        if (data.countryCode) setDetectedCountry(data.countryCode);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6">
              🌍 Trusted by the African Diaspora Worldwide
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
              Africa is calling.{' '}
              <span className="text-emerald-600">Answer with money</span>{' '}
              that arrives instantly.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Send money home, invest in African stocks, pay bills
              and support your family from anywhere in the world.
              Fast, fair, and made for Africans.
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <span className="text-amber-500">★★★★★</span>
              <span className="ml-1">Trusted by 10,000+ diaspora senders</span>
              <span className="ml-2">🇬🇧 🇺🇸 🇨🇦 🇩🇪 🇫🇷 🇳🇱</span>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => navigate('signup')}
                className="bg-emerald-700 px-8 text-white hover:bg-emerald-800"
              >
                Send money now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('wealth-landing')}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Explore investments
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Ticker */}
      <MarketTicker />

      {/* Product Pillars */}
      <ProductPillars />

      {/* Compact Movers — supports the ticker */}
      <MoversCompact />

      {/* China Corridor Teaser */}
      <ChinaCorridorTeaser />

      {/* How it works */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Five simple steps to send money across borders
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: '1',
                title: 'Create your account',
                desc: 'Sign up and verify your identity to get started.',
                icon: User,
              },
              {
                step: '2',
                title: 'Enter the amount',
                desc: 'See your locked exchange rate instantly.',
                icon: Search,
              },
              {
                step: '3',
                title: 'Add recipient details',
                desc: 'Enter your recipient’s mobile money or bank details.',
                icon: Smartphone,
              },
              {
                step: '4',
                title: 'Pay securely by card',
                desc: 'Paystack processes your payment securely.',
                icon: CreditCard,
              },
              {
                step: '5',
                title: 'Money delivered',
                desc: 'Your recipient receives the money — usually within 30 min.',
                icon: ArrowDownToLine,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="mt-2 inline-block text-xs font-bold text-emerald-600">Step {item.step}</span>
                  <h3 className="mt-1 text-base font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fees & Delivery */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Fees &amp; Delivery
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Transparent pricing across all corridors
            </p>
          </div>
          <div className="mx-auto max-w-3xl overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-emerald-600 text-white">
                  <th className="px-4 py-3 font-semibold">Corridor</th>
                  <th className="px-4 py-3 font-semibold">Fee</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                </tr>
              </thead>
              <tbody className="border border-gray-200">
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">UK → Kenya</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">M-Pesa / Bank</td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">UK → Nigeria</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~1–2 hrs</td>
                  <td className="px-4 py-3 text-gray-700">Bank Transfer</td>
                </tr>
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">UK → Ghana</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">MTN MoMo</td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">US → Kenya</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">M-Pesa</td>
                </tr>
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">US → Nigeria</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~2 hrs</td>
                  <td className="px-4 py-3 text-gray-700">Bank Transfer</td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">US → Ghana</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">MTN MoMo</td>
                </tr>
                <tr className="bg-white border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">Canada → Kenya</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">M-Pesa</td>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-3 font-medium text-gray-900">Canada → Nigeria</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~2 hrs</td>
                  <td className="px-4 py-3 text-gray-700">Bank Transfer</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">Canada → Ghana</td>
                  <td className="px-4 py-3 text-gray-700">1.5%</td>
                  <td className="px-4 py-3 text-gray-700">~30 min</td>
                  <td className="px-4 py-3 text-gray-700">MTN MoMo</td>
                </tr>
                {/* Intra-Africa separator */}
                <tr>
                  <td colSpan={4} className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                    <span className="text-sm font-semibold text-amber-700">Intra-Africa Corridors (Coming Soon via Ecobank / PAPSS)</span>
                  </td>
                </tr>
                {[
                  { route: 'Kenya → Uganda', delivery: '~30 min', method: 'MTN MoMo / Bank' },
                  { route: 'Kenya → Tanzania', delivery: '~30 min', method: 'M-Pesa / Bank' },
                  { route: 'Nigeria → Ghana', delivery: '~2 hrs', method: 'Bank Transfer' },
                  { route: 'Ghana → Nigeria', delivery: '~2 hrs', method: 'Bank Transfer' },
                  { route: 'South Africa → Kenya', delivery: '~1 hr', method: 'Bank Transfer' },
                ].map((row, i) => (
                  <tr key={row.route} className={`opacity-60 border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {row.route}
                      <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Coming Soon</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">1.5%</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.delivery}</td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{row.method}</span>
                      <button className="ml-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors" onClick={(e) => { e.stopPropagation(); navigate('intra-africa'); }}>Register interest →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted-foreground">
            The fee is included in the total shown at checkout. The exchange rate is locked for 15 minutes. No additional charges from AfriSpine.
          </p>
        </div>
      </section>

      {/* Intra-Africa Block (teaser with counter) */}
      <IntraAfricaBlock />

      {/* Trust Signals */}
      <section className="bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-5 w-5 text-emerald-600" />
              <span>Secured by Paystack</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span>Identity verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span>AML screened</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <span>Licensed delivery partners</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span>No card data stored</span>
            </div>
          </div>
        </div>
      </section>

      {/* US Trust Signal */}
      {detectedCountry === 'US' && (
        <section className="bg-white py-6 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">
              🇺🇸 US senders: Your card is charged securely by Paystack, a Stripe company. AfriSpine does not store card details. Money delivered to Africa by licensed local partners.
            </p>
          </div>
        </section>
      )}

      {/* Compliance Badge */}
      <section className="border-t border-border/40 bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground leading-relaxed">
            AfriSpine Ltd is registered in Kenya. Payment processing by Paystack. Funds delivered by regulated mobile money and banking partners. AfriSpine is not a bank.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Gifting & Occasions Strip */}
      <GiftingStrip />

      {/* Dangote IPO Feature Block */}
      <DangoteIpoBlock />

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            <FaqItem q="Is AfriSpine available in the US?" a="Yes. Any US cardholder can send money to Africa using AfriSpine. Cards are charged in USD." />
            <FaqItem q="How does AfriSpine compare to Western Union?" a="AfriSpine charges 1.5% with no hidden fees. Traditional providers often charge 3–8% plus FX spread." />
            <FaqItem q="Can I pay bills for family?" a="Yes! KPLC electricity, Nairobi Water, DStv/GOtv subscriptions, and airtime top-ups." />
            <FaqItem q="Does AfriSpine offer corporate FX?" a="Yes. AfriSpine Business offers FX from $5,000 at 0.5–1% margin. Visit our Business page for details." />
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('faq')}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View all FAQs
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to send money home?
            </h2>
            <p className="mt-4 text-lg text-emerald-100">
              Join thousands of people who trust AfriSpine for fast, fair transfers.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('signup')}
              className="mt-8 bg-white text-emerald-700 hover:bg-emerald-50 px-8"
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-sm text-emerald-200">
              For businesses sending $5,000+{' '}
              <button onClick={() => navigate('business')} className="underline font-medium hover:text-white transition-colors">
                Learn about Business FX
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
