'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app';
import { DigestMagazineLayout, DigestIssueData } from './digest-magazine-layout';

const CREAM = '#FAF8F3';
const NEAR_BLACK = '#1A1008';
const AFRISPINE_GREEN = '#0A4D2E';
const GOLD = '#C9981A';

export function DigestCurrentIssuePage() {
  const { t } = useTranslation();
  const { navigate } = useAppStore();
  const [issue, setIssue] = useState<DigestIssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/digest/issues/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.id) {
          setIssue(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('digest.loadError', 'Failed to load the latest issue.'));
        setLoading(false);
      });
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: AFRISPINE_GREEN, borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
            {t('digest.loading', 'Loading the latest issue...')}
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-center px-4">
          <p className="text-sm mb-4" style={{ color: 'rgba(26, 16, 8, 0.6)', fontFamily: 'sans-serif' }}>{error}</p>
          <button
            onClick={() => navigate('landing')}
            className="text-sm underline" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
          >
            {t('digest.backHome', 'Go home')}
          </button>
        </div>
      </div>
    );
  }

  // ── Coming Soon State ──
  if (!issue) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: CREAM, color: NEAR_BLACK }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-8">
          {/* ── Magazine-Style Header ── */}
          <header className="pt-12 pb-8 text-center" style={{ borderBottom: '2px solid rgba(201, 152, 26, 0.3)' }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div
                className="h-px w-12"
                style={{ backgroundColor: GOLD }}
              />
              <h1
                className="text-sm md:text-base font-bold tracking-[0.3em] uppercase"
                style={{ color: GOLD, fontFamily: 'sans-serif' }}
              >
                AFRI SPINE DIGEST
              </h1>
              <div
                className="h-px w-12"
                style={{ backgroundColor: GOLD }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'rgba(26, 16, 8, 0.45)', fontFamily: 'sans-serif' }}>
              <span>Issue #1</span>
              <span style={{ color: GOLD }}>·</span>
              <span>July 2025</span>
              <span style={{ color: GOLD }}>·</span>
              <span className="italic">Africa&apos;s pulse. Your portfolio. Every week.</span>
            </div>
          </header>

          {/* ── Featured Story + Sidebar Teasers ── */}
          <div className="py-10 md:py-14">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Featured story (large) */}
              <div className="md:col-span-3">
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{ backgroundColor: 'rgba(10, 77, 46, 0.04)', border: '1px solid rgba(10, 77, 46, 0.08)' }}
                >
                  <div className="relative h-48 md:h-64 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${AFRISPINE_GREEN}, #0d6b3f, #14734a)` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        <path d="M8 7h8" />
                        <path d="M8 11h6" />
                      </svg>
                    </div>
                    {/* Decorative grid lines */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="grid grid-cols-6 h-full">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="border-r border-white/30" />
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: GOLD, color: '#fff' }}
                      >
                        Cover Story
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: GOLD, fontFamily: 'sans-serif' }}>
                      Feature · Issue #1
                    </p>
                    <h2
                      className="text-2xl md:text-3xl font-serif font-bold leading-tight mb-3"
                      style={{ color: NEAR_BLACK }}
                    >
                      How the NGX became Africa&apos;s best-performing stock market in 2025
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 16, 8, 0.55)', fontFamily: 'sans-serif' }}>
                      A deep dive into Nigeria&apos;s remarkable 51% rally — from FX liberalisation to Dangote Refinery — and what it means for diaspora investors.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: AFRISPINE_GREEN }}>
                        AS
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: NEAR_BLACK, fontFamily: 'sans-serif' }}>AfriSpine Research</p>
                        <p className="text-[10px]" style={{ color: 'rgba(26, 16, 8, 0.4)', fontFamily: 'sans-serif' }}>8 min read</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar story teasers */}
              <div className="md:col-span-2 flex flex-col gap-4">
                {[
                  {
                    tag: 'Markets',
                    title: 'GSE Ghana surges 134% — the comeback story nobody predicted',
                    time: '5 min read',
                  },
                  {
                    tag: 'Opinion',
                    title: 'Why fractional shares are the future of African investing',
                    time: '4 min read',
                  },
                  {
                    tag: 'Bonds',
                    title: 'Kenya\'s infrastructure bonds: 18% yields attract diaspora capital',
                    time: '6 min read',
                  },
                ].map((story) => (
                  <div
                    key={story.title}
                    className="rounded-xl p-4 transition-all hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(10, 77, 46, 0.08)' }}
                  >
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: GOLD, fontFamily: 'sans-serif' }}
                    >
                      {story.tag}
                    </span>
                    <h3 className="font-serif text-sm font-bold leading-snug" style={{ color: NEAR_BLACK }}>
                      {story.title}
                    </h3>
                    <p className="mt-2 text-[10px]" style={{ color: 'rgba(26, 16, 8, 0.4)', fontFamily: 'sans-serif' }}>
                      {story.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Subscribe CTA Strip ── */}
          <div
            className="rounded-2xl p-6 md:p-8 mb-10"
            style={{ backgroundColor: AFRISPINE_GREEN, border: '2px solid rgba(201, 152, 26, 0.15)' }}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-serif font-bold text-white mb-1">
                {t('digest.comingSoon', 'Issue #1 is on its way')}
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'sans-serif' }}>
                Subscribe free and be the first to read it when it drops.
              </p>
            </div>
            <ComingSoonSubscribe />
            <div className="flex items-center justify-center gap-1 mt-4">
              {['📨', '🔒', '✓'].map((emoji, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-white/20 mx-1">·</span>}
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif' }}>
                    {emoji} {['Weekly delivery', 'No spam', 'Unsubscribe anytime'][i]}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Browse archive link */}
          <div className="text-center mb-10">
            <button
              onClick={() => navigate('digest-archive' as any)}
              className="text-sm underline underline-offset-4 transition-colors duration-200 hover:opacity-60"
              style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
            >
              {t('digest.browseArchive', 'Browse the archive →')}
            </button>
          </div>

          {/* What to expect */}
          <div className="py-16 md:py-24" style={{ borderTop: '1px solid rgba(201, 152, 26, 0.15)' }}>
            <h3
              className="text-center text-xs font-bold tracking-[0.25em] uppercase mb-12"
              style={{ color: GOLD, fontFamily: 'sans-serif' }}
            >
              {t('digest.whatToExpect', 'What to expect')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AFRISPINE_GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  ),
                  title: t('digest.feature1', 'Market Pulse'),
                  desc: t('digest.feature1Desc', 'Weekly performance across NGX, NSE, JSE, GSE and BRVM — with AI-powered commentary.'),
                },
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AFRISPINE_GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  ),
                  title: t('digest.feature2', 'Investment Opportunities'),
                  desc: t('digest.feature2Desc', 'Curated bonds, IPOs, and fixed-income products accessible to diaspora investors.'),
                },
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AFRISPINE_GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  ),
                  title: t('digest.feature3', 'Diaspora Stories'),
                  desc: t('digest.feature3Desc', 'Human stories about African diaspora building wealth through home-market investments.'),
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl mx-auto mb-4" style={{ backgroundColor: 'rgba(10, 77, 46, 0.06)' }}>
                    {feature.icon}
                  </div>
                  <h4 className="font-serif text-base mb-2" style={{ color: NEAR_BLACK }}>{feature.title}</h4>
                  <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.55)', fontFamily: 'sans-serif', lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="py-8 text-center" style={{ borderTop: '1px solid rgba(201, 152, 26, 0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(26, 16, 8, 0.35)', fontFamily: 'sans-serif' }}>
              © {new Date().getFullYear()} {t('digest.publishedBy', 'Published by AfriSpine Ltd')}
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // ── Issue Loaded ──
  return <DigestMagazineLayout issue={issue} />;
}

// ─── Coming Soon Subscribe Form ───────────────────────────────

function ComingSoonSubscribe() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr(t('digest.invalidEmail', 'Please enter a valid email address'));
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/digest/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency: 'weekly', marketFocus: 'all' }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setErr(data.error || t('digest.subscribeError', 'Subscription failed.'));
      }
    } catch {
      setErr(t('digest.subscribeError', 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {t('digest.subscribed', 'You\'re subscribed!')}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col sm:flex-row w-full gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('digest.emailPlaceholder', 'your@email.com')}
          className="flex-1 px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
          style={{
            backgroundColor: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(26, 16, 8, 0.12)',
            color: NEAR_BLACK,
            fontFamily: 'sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-60"
          style={{ backgroundColor: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
        >
          {loading ? '...' : t('digest.subscribeFree', 'Subscribe Free')}
        </button>
      </form>
      {err && <p className="mt-2 text-xs" style={{ color: '#dc2626', fontFamily: 'sans-serif' }}>{err}</p>}
    </div>
  );
}