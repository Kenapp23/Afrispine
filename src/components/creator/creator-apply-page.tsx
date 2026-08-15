'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Video, TrendingUp, Wallet } from 'lucide-react';

const BENEFITS = [
  { icon: Wallet, title: '60% Revenue Share', desc: 'The highest creator payout in the region.' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'See views, unlocks, and earnings as they happen.' },
  { icon: Video, title: 'Instant M-Pesa Payouts', desc: 'Weekly payouts directly to your M-Pesa.' },
];

export function CreatorApplyPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [submitted, setSubmitted] = React.useState(false);
  const [mobileMenu, setMobileMenu] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <button onClick={() => navigate('landing')} className="text-xl font-bold text-emerald-600">
              AfriSpine
            </button>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <button onClick={() => navigate('about')} className="text-gray-600 hover:text-gray-900">About</button>
              <button onClick={() => navigate('watch')} className="text-gray-600 hover:text-gray-900">Watch</button>
              <button onClick={() => navigate('contact')} className="text-gray-600 hover:text-gray-900">Contact</button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
            </button>
          </div>
          {mobileMenu && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
              <button onClick={() => { navigate('about'); setMobileMenu(false); }} className="block w-full text-left px-2 py-2 text-sm text-gray-600 hover:text-gray-900 rounded">About</button>
              <button onClick={() => { navigate('watch'); setMobileMenu(false); }} className="block w-full text-left px-2 py-2 text-sm text-gray-600 hover:text-gray-900 rounded">Watch</button>
              <button onClick={() => { navigate('contact'); setMobileMenu(false); }} className="block w-full text-left px-2 py-2 text-sm text-gray-600 hover:text-gray-900 rounded">Contact</button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {!submitted ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Become an AfriSpine Creator
              </h1>
              <p className="text-lg text-gray-600 mb-10">
                Apply to monetise your content. We review every application and onboard creators within 48 hours.
              </p>

              <div className="grid gap-4 mb-10">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex gap-4 items-start p-4 rounded-xl border border-gray-100">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <b.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{b.title}</h3>
                      <p className="text-sm text-gray-500">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Creator Name</label>
                  <input
                    type="text" required placeholder="Your public name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" required placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">M-Pesa Phone Number</label>
                  <input type="tel" required placeholder="2547XXXXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">What kind of content do you create?</label>
                  <textarea rows={3} required placeholder="e.g. Fitness tutorials, comedy skits, behind-the-scenes vlogs..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Where can we see your content?</label>
                  <input type="url" placeholder="Instagram, TikTok, YouTube link..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-semibold">
                  Submit Application
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We'll review your application and get back to you within 48 hours. Check your email for a confirmation.
              </p>
              <Button onClick={() => navigate('landing')} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <span>© {new Date().getFullYear()} AfriSpine. All rights reserved.</span>
            <div className="flex gap-4">
              <button onClick={() => navigate('terms')} className="hover:text-gray-900">Terms</button>
              <button onClick={() => navigate('privacy')} className="hover:text-gray-900">Privacy</button>
              <button onClick={() => navigate('contact')} className="hover:text-gray-900">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
