'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app';
import {
  Search,
  Smartphone,
  PlayCircle,
  TrendingUp,
  Zap,
  ShieldCheck,
  Clock,
  ChevronRight,
  Menu,
  X,
  Megaphone,
  Eye,
} from 'lucide-react';
import { useState } from 'react';

export function CreatorLandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => navigate('landing')}
            className="text-2xl font-extrabold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            AfriSpine
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('watch')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Watch
            </button>
            <button
              onClick={() => navigate('sponsor-landing')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              For Brands
            </button>
            <button
              onClick={() => navigate('about')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate('contact')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Contact
            </button>
            <Button
              onClick={() => navigate('creator-apply')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              For Creators
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { navigate('watch'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Watch
              </button>
              <button
                onClick={() => { navigate('sponsor-landing'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                For Brands
              </button>
              <button
                onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => { navigate('contact'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Contact
              </button>
              <Button
                onClick={() => { navigate('creator-apply'); setMobileMenuOpen(false); }}
                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                For Creators
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Copy */}
              <div className="flex flex-col gap-6">
                <Badge
                  variant="outline"
                  className="self-start border-emerald-200 bg-emerald-50 text-emerald-700 font-medium px-3.5 py-1 text-xs tracking-wide uppercase"
                >
                  Now live in Kenya 🇰🇪
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-gray-900">
                  Premium African
                  Content.
                  <span className="block text-emerald-600">One Tap Away.</span>
                </h1>

                <p className="max-w-lg text-lg text-gray-600 leading-relaxed">
                  Discover exclusive videos, tutorials, and behind-the-scenes content from
                  Kenya&rsquo;s top creators — unlocked instantly with M-Pesa.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate('watch')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-7 py-6 shadow-lg shadow-emerald-600/20"
                  >
                    Start Watching
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('creator-apply')}
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold text-base px-7 py-6"
                  >
                    Become a Creator
                  </Button>
                </div>

                {/* Quick social proof line */}
                <p className="pt-1 text-sm text-gray-400">
                  Trusted by 2,400+ creators &middot; KES 50–200 per unlock
                </p>
              </div>

              {/* Hero image */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/10">
                  <Image
                    src="/hero-creator.png"
                    alt="AfriSpine creator platform — African creator sharing premium content with fans"
                    width={640}
                    height={480}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  {/* Gradient overlay at bottom for depth */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-900/20 to-transparent" />
                </div>
                {/* Decorative glow behind image */}
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-100/60 via-transparent to-amber-100/40 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="border-t border-gray-100 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                How It Works
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Three simple steps to premium content, powered by M-Pesa.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Search className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Step 1
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Browse</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  Scroll through premium content from verified African creators.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Smartphone className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Step 2
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Pay</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  Unlock with M-Pesa — KES 50 to KES 200 per piece.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <PlayCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Step 3
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Enjoy</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  Watch instantly, support creators directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── For Creators ─── */}
        <section className="border-t border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Copy side */}
              <div className="flex flex-col gap-6">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                  Creator Programme
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Monetise Your Audience
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  Turn your followers into revenue. AfriSpine gives you everything you need to
                  sell premium content and get paid instantly.
                </p>

                <ul className="space-y-3 pt-2">
                  {[
                    { icon: TrendingUp, label: '60% revenue share — you keep the majority' },
                    { icon: Zap, label: 'Instant M-Pesa payouts, no waiting' },
                    { icon: PlayCircle, label: 'Real-time analytics on your content' },
                    { icon: Search, label: 'No minimum follower count to start' },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3">
                  <Button
                    size="lg"
                    onClick={() => navigate('creator-apply')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-7 py-6 shadow-lg shadow-emerald-600/20"
                  >
                    Apply as a Creator
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Visual / stats cards side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-6 flex flex-col justify-between">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                  <div className="mt-6">
                    <p className="text-3xl font-extrabold text-gray-900">60%</p>
                    <p className="text-sm text-gray-500 mt-1">Revenue to you</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50 to-white p-6 flex flex-col justify-between">
                  <Zap className="h-8 w-8 text-amber-500" />
                  <div className="mt-6">
                    <p className="text-3xl font-extrabold text-gray-900">Instant</p>
                    <p className="text-sm text-gray-500 mt-1">M-Pesa payouts</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-6 flex flex-col justify-between">
                  <PlayCircle className="h-8 w-8 text-emerald-600" />
                  <div className="mt-6">
                    <p className="text-3xl font-extrabold text-gray-900">Live</p>
                    <p className="text-sm text-gray-500 mt-1">Real-time analytics</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50 to-white p-6 flex flex-col justify-between">
                  <ShieldCheck className="h-8 w-8 text-amber-500" />
                  <div className="mt-6">
                    <p className="text-3xl font-extrabold text-gray-900">Zero</p>
                    <p className="text-sm text-gray-500 mt-1">Minimum followers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Sponsor a Creator CTA ─── */}
        <section className="border-t border-gray-100 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Megaphone className="h-7 w-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                  Advertise on AfriSpine
                </h2>
                <p className="mt-2 text-gray-500 max-w-lg leading-relaxed">
                  Put your brand in front of millions of engaged African content consumers.
                  Self-serve ad slots from <span className="font-semibold text-amber-600">KES 8,000/week</span>.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('sponsor-landing')}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base px-6 py-5 shadow-lg shadow-amber-500/20 active:scale-[0.97] transition-transform"
              >
                <Eye className="mr-1.5 h-5 w-5" />
                For Brands
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Trust / Safety Strip ─── */}
        <section className="border-t border-gray-100 bg-emerald-600">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-white">
              <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/20 font-semibold px-4 py-1.5 text-sm backdrop-blur-sm">
                Powered by Safaricom M-Pesa
              </Badge>

              <div className="flex items-center gap-2 text-white/90">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Secure payments</span>
              </div>

              <div className="flex items-center gap-2 text-white/90">
                <Clock className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Instant access</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('terms')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => navigate('privacy')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => navigate('sponsor-landing')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                For Brands
              </button>
              <button
                onClick={() => navigate('contact')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Contact
              </button>
            </nav>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-400">
                &copy; 2025 AfriSpine. All rights reserved.
              </p>
              <p className="text-xs text-gray-400">
                AfriSpine is fully owned by Rech Fish Market, a company registered in Kenya.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
