'use client';

import { motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Shield,
  Smartphone,
  CheckCircle2,
  Zap,
  Globe,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/app';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

function AnimatedSection({
  children,
  className = '',
  delayIndex = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayIndex?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={delayIndex}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              A
            </div>
            <span className="text-xl font-bold text-gray-900">
              Afri<span className="text-emerald-600">Spine</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
              How It Works
            </a>
            <a href="#corridors" className="hover:text-emerald-600 transition-colors">
              Corridors
            </a>
            <a href="#trust" className="hover:text-emerald-600 transition-colors">
              Trust
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('login')}
              className="text-gray-600 hover:text-emerald-600"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-emerald-50 px-4 py-20 sm:py-28 md:py-36">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <AnimatedSection delayIndex={0}>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
              <Zap className="h-3.5 w-3.5" />
              Trusted by 50,000+ users worldwide
            </span>
          </AnimatedSection>

          <AnimatedSection delayIndex={1}>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Send Money to Africa.{' '}
              <span className="text-emerald-600">Fast, Fair, Reliable.</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delayIndex={2}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 sm:text-xl">
              From the UK or US straight to M-Pesa in Kenya. Low fees, real-time
              exchange rates, and delivery in seconds — not days.
            </p>
          </AnimatedSection>

          <AnimatedSection delayIndex={3}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => navigate('signup')}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto text-base px-8 py-6 rounded-xl shadow-lg shadow-emerald-600/20"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('login')}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 sm:w-auto text-base px-8 py-6 rounded-xl"
              >
                Sign In
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delayIndex={4}>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> FCA Regulated
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Bank-grade encryption
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> No hidden fees
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-gray-500">
                Three simple steps to send money home.
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: ArrowRightLeft,
                step: '01',
                title: 'Enter Amount',
                desc: 'Tell us how much you want to send. We show you the real exchange rate and total upfront.',
              },
              {
                icon: Shield,
                step: '02',
                title: 'Verify Identity',
                desc: 'Quick KYC check for your first transfer. We keep your data safe and secure.',
              },
              {
                icon: Smartphone,
                step: '03',
                title: 'Delivered to M-Pesa',
                desc: 'Your recipient gets the money directly on their phone. Usually in under 30 seconds.',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delayIndex={i + 1}>
                <Card className="relative border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="flex flex-col items-center p-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <span className="mb-2 text-xs font-semibold tracking-widest text-emerald-600 uppercase">
                      Step {item.step}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Corridors ────────────────────────────────────────── */}
      <section id="corridors" className="bg-gray-50 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Supported Corridors
              </h2>
              <p className="mt-3 text-gray-500">
                More corridors coming soon. Start sending today.
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {[
              {
                from: '🇬🇧',
                fromLabel: 'United Kingdom',
                to: '🇰🇪',
                toLabel: 'Kenya',
                delivery: 'Instant',
                fee: 'From 1.5%',
                badge: 'Most Popular',
              },
              {
                from: '🇺🇸',
                fromLabel: 'United States',
                to: '🇰🇪',
                toLabel: 'Kenya',
                delivery: 'Instant',
                fee: 'From 1.8%',
                badge: null,
              },
            ].map((corridor, i) => (
              <AnimatedSection key={corridor.fromLabel} delayIndex={i + 1}>
                <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  {corridor.badge && (
                    <div className="absolute top-4 right-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {corridor.badge}
                    </div>
                  )}
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{corridor.from}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {corridor.fromLabel}
                          </p>
                          <p className="text-xs text-gray-400">GBP</p>
                        </div>
                      </div>

                      <div className="flex items-center text-emerald-500">
                        <div className="h-px w-6 bg-emerald-300" />
                        <ArrowRightLeft className="mx-1 h-4 w-4" />
                        <div className="h-px w-6 bg-emerald-300" />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {corridor.toLabel}
                          </p>
                          <p className="text-xs text-gray-400">KES via M-Pesa</p>
                        </div>
                        <span className="text-4xl">{corridor.to}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-6 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-400">Delivery Time</p>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-emerald-500" />
                          {corridor.delivery}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Transfer Fee</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {corridor.fee}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Stats ────────────────────────────────────── */}
      <section id="trust" className="bg-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Trusted by Thousands
              </h2>
              <p className="mt-3 text-gray-500">
                Join a growing community that trusts AfriSpine for their
                cross-border payments.
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: ArrowRightLeft,
                value: '50,000+',
                label: 'Transfers Completed',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: TrendingUp,
                value: '£10M+',
                label: 'Money Sent to Africa',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Users,
                value: '99.5%',
                label: 'Successful Delivery Rate',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delayIndex={i + 1}>
                <Card className="border-0 shadow-sm text-center">
                  <CardContent className="p-8">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}
                    >
                      <stat.icon className="h-7 w-7" />
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <AnimatedSection className="bg-emerald-600 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Ready to send money home?
          </h2>
          <p className="mt-4 text-emerald-100">
            Create your free account in under 2 minutes and make your first
            transfer today.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => navigate('signup')}
              className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-semibold sm:w-auto text-base px-8 py-6 rounded-xl"
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                A
              </div>
              <span className="text-lg font-bold text-gray-900">
                Afri<span className="text-emerald-600">Spine</span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
                How It Works
              </a>
              <a href="#corridors" className="hover:text-emerald-600 transition-colors">
                Corridors
              </a>
              <a href="#trust" className="hover:text-emerald-600 transition-colors">
                Trust
              </a>
              <button
                onClick={() => navigate('login')}
                className="hover:text-emerald-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('signup')}
                className="hover:text-emerald-600 transition-colors"
              >
                Sign Up
              </button>
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} AfriSpine Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}