'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app';
import {
  Megaphone,
  Eye,
  PlayCircle,
  Newspaper,
  UserPlus,
  Rocket,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Mail,
} from 'lucide-react';

/* ── Slot Types / Rate Card Data ─────────────────────────── */

const RATE_CARDS = [
  {
    title: 'Backdrop Banner',
    price: 'From KES 12,000/week',
    description: 'Full-screen branded backdrop displayed behind video content for maximum visual impact.',
    icon: '🖼️',
    accent: 'from-emerald-50 to-white',
  },
  {
    title: 'Smart Chyron',
    price: 'From KES 8,000/week',
    description: 'Subtle text overlay at the bottom of videos — non-intrusive yet highly visible.',
    icon: '📝',
    accent: 'from-amber-50 to-white',
  },
  {
    title: 'Intro Splash',
    price: 'From KES 20,000/week',
    description: '3-second pre-roll ad that plays before the video starts — premium attention capture.',
    icon: '🎬',
    accent: 'from-emerald-50 to-white',
  },
  {
    title: 'Feed Native Card',
    price: 'From KES 6,400/week',
    description: 'Appears natively in the content feed between videos — blends in, converts well.',
    icon: '📱',
    accent: 'from-amber-50 to-white',
  },
];

const HOW_IT_WORKS = [
  {
    icon: UserPlus,
    step: 'Step 1',
    title: 'Create Account',
    description: 'Sign up your brand in minutes. No paperwork to start exploring.',
  },
  {
    icon: Rocket,
    step: 'Step 2',
    title: 'Launch Campaign',
    description: 'Set your budget, pick your slots, upload creative, and go live.',
  },
  {
    icon: BarChart3,
    step: 'Step 3',
    title: 'Track Results',
    description: 'Monitor impressions, clicks, and spend in real-time dashboards.',
  },
];

export function SponsorLandingPage() {
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

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('about')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate('watch')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Watch
            </button>
            <button
              onClick={() => navigate('contact')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Contact
            </button>
            <Button
              onClick={() => navigate('sponsor-dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              For Brands
            </Button>
          </nav>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => { navigate('watch'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Watch
              </button>
              <button
                onClick={() => { navigate('contact'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Contact
              </button>
              <Button
                onClick={() => { navigate('sponsor-dashboard'); setMobileMenuOpen(false); }}
                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                For Brands
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
            <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
              <Badge
                variant="outline"
                className="self-center border-emerald-200 bg-emerald-50 text-emerald-700 font-medium px-3.5 py-1 text-xs tracking-wide uppercase"
              >
                Brand Advertising 📢
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-gray-900">
                Reach Millions of African
                <span className="block text-emerald-600">Content Consumers.</span>
              </h1>

              <p className="max-w-xl text-lg text-gray-600 leading-relaxed">
                Advertise on AfriSpine&apos;s fast-growing video platform. Place your brand in front
                of millions of engaged viewers across Kenya and East Africa with transparent, self-serve
                ad placements.
              </p>

              <div className="flex flex-wrap gap-3 pt-2 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('sponsor-dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-7 py-6 shadow-lg shadow-emerald-600/20"
                >
                  Get Started
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('contact')}
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold text-base px-7 py-6"
                >
                  <Mail className="mr-1.5 h-4 w-4" />
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-emerald-50/40 via-transparent to-transparent -z-10" />
        </section>

        {/* ─── Rate Card Section ─── */}
        <section className="border-t border-gray-100 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Ad Slot Pricing
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Transparent, per-week pricing. No hidden fees, no long-term contracts.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {RATE_CARDS.map((slot) => (
                <Card
                  key={slot.title}
                  className={`bg-gradient-to-br ${slot.accent} border border-gray-100 hover:shadow-lg transition-shadow duration-200`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{slot.icon}</span>
                      <CardTitle className="text-base font-bold text-gray-900">{slot.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-extrabold text-emerald-600">{slot.price}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{slot.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="border-t border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                How It Works
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Self-serve campaign creation in three simple steps.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                      {item.step}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Trust / Safety Strip ─── */}
        <section className="border-t border-gray-100 bg-emerald-600">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-white">
              <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/20 font-semibold px-4 py-1.5 text-sm backdrop-blur-sm">
                Trusted by 50+ brands
              </Badge>
              <div className="flex items-center gap-2 text-white/90">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Transparent pricing</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <BarChart3 className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Real-time analytics</span>
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
