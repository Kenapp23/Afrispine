'use client';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import {
  Globe,
  Smartphone,
  Wallet,
  Users,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  MapPin,
  Banknote,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export function CreatorAboutPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('landing')}
            className="text-2xl font-extrabold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            AfriSpine
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('contact')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => navigate('terms')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('privacy')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Privacy
            </button>
            <Button
              onClick={() => navigate('creator-apply')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Apply as Creator
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-2">
            <button
              onClick={() => { navigate('contact'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => { navigate('terms'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => { navigate('privacy'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Privacy
            </button>
            <Button
              onClick={() => { navigate('creator-apply'); setMobileMenuOpen(false); }}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Apply as Creator
            </Button>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
                About{' '}
                <span className="text-emerald-600">AfriSpine</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                Connecting African creators with the audiences that support them.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate('creator-apply')}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Apply as Creator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate('contact')}
                  variant="outline"
                  size="lg"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Get in Touch
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Our Business ─── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">What We Do</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                Our Business
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                AfriSpine operates a digital content marketplace that connects African creators
                directly with paying fans. We provide the platform, payment infrastructure, and
                audience tools — creators provide the content.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Digital Content Marketplace
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  We trade in access to premium digital content. Creators upload exclusive videos,
                  tutorials, behind-the-scenes footage, and more. Fans browse, discover, and
                  unlock the content they love.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Platform Model
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  AfriSpine is a hosted marketplace — not an aggregator or reseller. Content
                  lives on our platform. We handle hosting, delivery, discovery, and payments.
                  Creators retain full ownership of their work.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  M-Pesa Payments
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Every content unlock is paid for via Safaricom M-Pesa. Fans use Lipa na M-Pesa
                  on their phones — no cards, no bank accounts needed. Payments are split
                  automatically between AfriSpine and the creator.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Business Model ─── */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">How We Make Money</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                Business Model
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                A straightforward revenue-share model that aligns our success with our creators&rsquo; success.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 items-start">
              {/* Revenue split visual */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Split</h3>
                <p className="mt-2 text-sm text-gray-500">
                  For every content purchase, revenue is divided as follows:
                </p>
                <div className="mt-6 space-y-4">
                  {/* Creator bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">Creator</span>
                      <span className="font-bold text-emerald-600">60%</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: '60%' }} />
                    </div>
                  </div>
                  {/* AfriSpine bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">AfriSpine</span>
                      <span className="font-bold text-gray-600">40%</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gray-400" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-xs text-gray-500 leading-relaxed">
                  AfriSpine&rsquo;s 40% covers platform hosting, payment processing fees (M-Pesa
                  STK &amp; C2B charges), bandwidth, customer support, creator tools, and
                  continued product development.
                </p>
              </div>

              {/* Pricing & payouts */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Content Pricing</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Each piece of premium content is priced between{' '}
                    <span className="font-semibold text-gray-900">KES 50 and KES 200</span>.
                    Creators set their own price within this range at the time of upload.
                    This affordable window is designed for the Kenyan mass market.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Instant Creator Payouts</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Creator earnings are settled in real time via M-Pesa Split Payments.
                    When a fan pays, the creator&rsquo;s 60% share is routed directly to
                    their registered M-Pesa mobile number — no manual withdrawal requests,
                    no waiting periods.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Target Market ─── */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">Where We Operate</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                Target Market
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                AfriSpine follows a deliberate phased expansion strategy, starting where mobile
                money penetration is highest.
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {/* Phase 1 */}
              <div className="relative rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 sm:p-8">
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Phase 1 — Live
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Kenya</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Our launch market. Kenya has over 30 million M-Pesa users, a vibrant creator
                  economy, and regulatory clarity from the Central Bank of Kenya. Nairobi is
                  our headquarters and primary market.
                </p>
                <div className="mt-4 flex items-center gap-2 text-emerald-700">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Currently Active</span>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                  Phase 2 — Planned
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">East Africa</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Tanzania, Uganda, and Rwanda are the next markets. Each country has growing
                  mobile money adoption and an emerging class of digital creators. We will
                  integrate local payment rails (e.g., Airtel Money, MTN MoMo) as we expand.
                </p>
                <div className="mt-4 flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                  Phase 3 — Vision
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Pan-African</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Our long-term vision is a continent-wide creator economy platform. Nigeria,
                  Ghana, South Africa, and beyond. Africa&rsquo;s creative industries are
                  booming — we intend to be the payment and distribution backbone.
                </p>
                <div className="mt-4 flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Future Roadmap</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Payment Infrastructure ─── */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">Payment Infrastructure</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                  Built on M-Pesa
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  AfriSpine&rsquo;s payment system is designed from the ground up around
                  Safaricom&rsquo;s M-Pesa ecosystem — the most trusted and widely used mobile
                  money platform in Africa.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Safaricom M-Pesa</h4>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      Fans pay using the M-Pesa STK Push (Lipa na M-Pesa) flow directly from
                      their phones. No app download required — works on any M-Pesa-registered
                      number.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Lipa na M-Pesa (Buy Goods)</h4>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      AfriSpine operates as a registered Lipa na M-Pesa Paybill/Buy Goods
                      merchant. Every transaction is fully traceable and compliant with
                      Central Bank of Kenya regulations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">M-Pesa Split Payments API</h4>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      We use the Daraja Split Payments API to divide each payment in real time
                      between AfriSpine (40%) and the content creator (60%). Creators receive
                      their share instantly to their M-Pesa wallet upon successful transaction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Full Transaction Records</h4>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      Every payment generates an M-Pesa confirmation SMS to the fan and a
                      corresponding settlement record for the creator. AfriSpine maintains
                      complete transaction logs for audit and compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Company Details Strip ─── */}
        <section className="py-12 sm:py-16 border-t border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Registered In</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">Kenya</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">www.afri-spine.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Rails</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">M-Pesa Split Payments</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Content Access</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">KES 50 – 200</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-600">AfriSpine</span>
              <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('contact')}
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => navigate('terms')}
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => navigate('privacy')}
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                Privacy
              </button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
