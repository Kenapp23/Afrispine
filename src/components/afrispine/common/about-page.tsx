'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, ShieldCheck, Zap, Building2, ArrowRight } from 'lucide-react';

export function AboutPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('landing')}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About AfriSpine</h1>
      <p className="mt-2 text-xs text-muted-foreground">Who we are and how we work</p>

      <div className="mt-8 space-y-10 text-sm text-muted-foreground leading-relaxed">
        {/* About Us */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About Us</h2>
          <p>
            AfriSpine Ltd is a non-custodial payment routing and matching platform registered in Kenya. We connect diaspora Africans in the UK, USA, Canada, and EU to family in Africa via the fastest, most cost-effective route.
          </p>
          <p className="mt-3">
            We are not a bank or money transmitter. Your payment is collected securely by Fincra and your money is delivered by our licensed provider partners including regulated mobile money operators and banks. AfriSpine earns a transparent service fee of 1–3% per transfer. Your principal is never in our hands.
          </p>
        </section>

        {/* Our Mission */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
          </div>
          <p>
            We believe the diaspora deserves better. Sending money home should be fast, affordable, and transparent. Our mission is to eliminate the hidden fees and slow delivery times that have plagued cross-border payments to Africa for decades.
          </p>
          <p className="mt-3">
            By building a smart routing engine that automatically selects the best delivery rail for each transfer, we ensure your family receives the maximum amount, as quickly as possible.
          </p>
        </section>

        {/* How We Work */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">How We Work</h2>
          </div>
          <p>
            AfriSpine operates as a non-custodial routing layer. Here&apos;s what that means for you:
          </p>
          <ul className="mt-3 space-y-3">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">1</span>
              <span>You initiate a transfer on our platform and enter your payment card details securely.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">2</span>
              <span>Fincra (PCI-DSS certified) processes your card payment. We never see or store your full card details.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">3</span>
              <span>Our routing engine selects the optimal licensed provider for delivery based on speed, cost, and availability.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">4</span>
              <span>The licensed provider delivers funds to your recipient via mobile money (M-Pesa, MTN MoMo) or bank transfer.</span>
            </li>
          </ul>
          <p className="mt-4">
            At no point does AfriSpine hold, custody, or intermediate your funds. Your money goes directly from our payment processor to the delivery provider.
          </p>
        </section>

        {/* Countries We Serve */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Globe className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Countries We Serve</h2>
          </div>
          <p className="mb-4">
            We support transfers from the UK, USA, Canada, and EU to the following African countries:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { country: 'Kenya', method: 'M-Pesa, Bank Transfer' },
              { country: 'Nigeria', method: 'Bank Transfer' },
              { country: 'Ghana', method: 'MTN MoMo, Bank Transfer' },
              { country: 'Uganda', method: 'Mobile Money, Bank' },
              { country: 'Tanzania', method: 'Mobile Money, Bank' },
              { country: 'South Africa', method: 'Bank Transfer' },
            ].map((item) => (
              <div
                key={item.country}
                className="rounded-lg border border-border/60 p-4"
              >
                <p className="font-medium text-gray-900">{item.country}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.method}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Business FX */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Business FX</h2>
          </div>
          <p>
            For corporate and business foreign exchange needs, AfriSpine Business offers dedicated FX services with margins as low as 0.5%, same-day settlement, and volumes from $5,000 and above. Whether you need to repatriate profits, pay international suppliers, or fund import operations, AfriSpine Business is built for African enterprises that move money internationally.
          </p>
          <Button
            onClick={() => navigate('business')}
            className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Explore AfriSpine Business
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    </div>
  );
}