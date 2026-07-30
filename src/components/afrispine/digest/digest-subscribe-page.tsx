'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Check,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Mail,
  Headphones,
  BookOpen,
  TrendingUp,
  BarChart3,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────── */
const COUNTRIES = [
  { value: '', label: 'Select country' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'OTHER', label: 'Other' },
];

const MARKET_OPTIONS = [
  { value: 'KE', label: 'KE — Kenya' },
  { value: 'NG', label: 'NG — Nigeria' },
  { value: 'GH', label: 'GH — Ghana' },
  { value: 'ZA', label: 'ZA — South Africa' },
];

const BENEFITS = [
  { icon: BookOpen, key: 'weeklyDeepDive', fallback: 'Weekly deep-dive on African markets' },
  { icon: TrendingUp, key: 'companySpotlights', fallback: 'Company spotlights diaspora investors need' },
  { icon: BarChart3, key: 'investmentOpportunities', fallback: 'Investment opportunities curated for you' },
  { icon: Headphones, key: 'podcastBriefing', fallback: 'Podcast briefing every week' },
  { icon: Sparkles, key: 'completelyFree', fallback: 'Completely free' },
];

/* ─── Confetti animation (CSS-based) ────────────────────── */
function ConfettiBurst() {
  const colors = ['#C9981A', '#0A4D2E', '#FAF8F3', '#1A1008', '#5A8F4E', '#E8C468'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animation: `confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: 0.9,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Fade-in wrapper ────────────────────────────────────── */
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {children}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TASK 2 — DigestSubscribePage
   ═════════════════════════════════════════════════════════════ */
export function DigestSubscribePage() {
  const { t } = useTranslation();
  const navigate = useAppStore((s) => s.navigate);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [allMarkets, setAllMarkets] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleMarketToggle = useCallback((value: string) => {
    if (value === 'all') {
      setAllMarkets(true);
      setSelectedMarkets([]);
      return;
    }
    setAllMarkets(false);
    setSelectedMarkets((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!firstName.trim() || !email.trim()) {
      toast.error(t('digest.subscribe.fillRequired') || 'Please fill in your name and email.');
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/digest/subscribe/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          country,
          markets: allMarkets ? ['ALL'] : selectedMarkets,
          whatsappOptIn,
        }),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      setSubscribed(true);
      toast.success(t('digest.subscribe.success') || 'Welcome to the Digest!');
    } catch {
      toast.error(t('digest.subscribe.error') || 'Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  }, [firstName, email, country, allMarkets, selectedMarkets, whatsappOptIn, t]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F3' }}>
      {subscribed && <ConfettiBurst />}

      <div className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0A4D2E 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-20 text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 mb-6">
                <Mail className="h-5 w-5" style={{ color: '#C9981A' }} />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: '#C9981A' }}>
                  The AfriSpine Digest
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-tight" style={{ color: '#C9981A' }}>
                {t('digest.subscribe.hero') || 'Never Miss an Issue'}
              </h1>
              <p className="mt-4 text-lg sm:text-xl max-w-xl mx-auto" style={{ color: '#5A4F3C' }}>
                {t('digest.subscribe.subtitle') || 'The AfriSpine Digest — Africa\'s pulse. Your portfolio. Every week.'}
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
          <FadeIn delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.key}
                    className="flex items-start gap-3 p-4 rounded-xl transition-all duration-200"
                    style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(26,16,8,0.04)' }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(10,77,46,0.1)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#0A4D2E' }} />
                    </div>
                    <span className="text-sm font-medium pt-1" style={{ color: '#1A1008' }}>
                      {t(`digest.subscribe.${benefit.key}`) || benefit.fallback}
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </section>

        {/* ── Subscribe Form ── */}
        <section className="mx-auto max-w-lg px-4 sm:px-6 pb-20">
          <FadeIn delay={200}>
            <Card className="border-0 shadow-lg overflow-hidden" style={{ backgroundColor: 'white' }}>
              <CardContent className="p-6 sm:p-8">
                {subscribed ? (
                  /* ── Success State ── */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(10,77,46,0.1)' }}>
                      <CheckCircle2 className="h-8 w-8" style={{ color: '#0A4D2E' }} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold mb-2" style={{ color: '#1A1008' }}>
                      {t('digest.subscribe.welcomeTitle') || "You're in!"}
                    </h2>
                    <p className="text-sm mb-6" style={{ color: '#5A4F3C' }}>
                      {t('digest.subscribe.welcomeDesc') || 'Your first Digest arrives this Friday. Watch your inbox.'}
                    </p>
                    <Button
                      className="font-semibold"
                      style={{ backgroundColor: '#0A4D2E', color: '#FAF8F3' }}
                      onClick={() => navigate('landing')}
                    >
                      {t('digest.subscribe.exploreMore') || 'Explore AfriSpine'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  /* ── Form ── */
                  <div className="space-y-5">
                    <h2 className="text-xl font-serif font-bold text-center mb-1" style={{ color: '#1A1008' }}>
                      {t('digest.subscribe.formTitle') || 'Subscribe Free'}
                    </h2>
                    <p className="text-xs text-center mb-4" style={{ color: '#8B7E6A' }}>
                      {t('digest.subscribe.formDesc') || 'Join thousands of diaspora investors.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block" style={{ color: '#1A1008' }}>
                          {t('digest.subscribe.firstName') || 'First name'} *
                        </Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Amina"
                          className="border-0 shadow-sm focus-visible:ring-1"
                          style={{ backgroundColor: '#FAF8F3' }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block" style={{ color: '#1A1008' }}>
                          {t('digest.subscribe.email') || 'Email'} *
                        </Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="amina@example.com"
                          className="border-0 shadow-sm focus-visible:ring-1"
                          style={{ backgroundColor: '#FAF8F3' }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-1.5 block" style={{ color: '#1A1008' }}>
                        {t('digest.subscribe.country') || 'Country'}
                      </Label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-md border-0 shadow-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-1"
                        style={{ backgroundColor: '#FAF8F3' }}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ── Market Focus ── */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block" style={{ color: '#1A1008' }}>
                        {t('digest.subscribe.marketFocus') || 'Market focus'}
                      </Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg transition-colors" style={{ backgroundColor: allMarkets ? 'rgba(10,77,46,0.08)' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={allMarkets}
                            onChange={() => handleMarketToggle('all')}
                            className="sr-only"
                          />
                          <div
                            className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                            style={{
                              borderColor: allMarkets ? '#0A4D2E' : '#D0DFC8',
                              backgroundColor: allMarkets ? '#0A4D2E' : 'white',
                            }}
                          >
                            {allMarkets && <Check className="h-2.5 w-2.5" style={{ color: '#FAF8F3' }} />}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#1A1008' }}>
                            {t('digest.subscribe.allMarkets') || 'All Markets'}
                          </span>
                        </label>
                        {!allMarkets && (
                          <div className="grid grid-cols-2 gap-2 pl-1">
                            {MARKET_OPTIONS.map((market) => (
                              <label
                                key={market.value}
                                className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg transition-colors"
                                style={{ backgroundColor: selectedMarkets.includes(market.value) ? 'rgba(10,77,46,0.08)' : 'transparent' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMarkets.includes(market.value)}
                                  onChange={() => handleMarketToggle(market.value)}
                                  className="sr-only"
                                />
                                <div
                                  className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                                  style={{
                                    borderColor: selectedMarkets.includes(market.value) ? '#0A4D2E' : '#D0DFC8',
                                    backgroundColor: selectedMarkets.includes(market.value) ? '#0A4D2E' : 'white',
                                  }}
                                >
                                  {selectedMarkets.includes(market.value) && <Check className="h-2.5 w-2.5" style={{ color: '#FAF8F3' }} />}
                                </div>
                                <span className="text-xs font-medium" style={{ color: '#1A1008' }}>{market.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── WhatsApp opt-in ── */}
                    <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg transition-colors" style={{ backgroundColor: whatsappOptIn ? 'rgba(201,152,26,0.08)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0"
                        style={{
                          borderColor: whatsappOptIn ? '#C9981A' : '#E8E2D8',
                          backgroundColor: whatsappOptIn ? '#C9981A' : 'white',
                        }}
                      >
                        {whatsappOptIn && <Check className="h-2.5 w-2.5" style={{ color: '#1A1008' }} />}
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#25D366' }} />
                        <span className="text-xs leading-relaxed" style={{ color: '#5A4F3C' }}>
                          {t('digest.subscribe.whatsappOptIn') || 'Also send me a WhatsApp notification when new issues publish'}
                        </span>
                      </div>
                    </label>

                    <Button
                      className="w-full font-bold py-5 text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
                      style={{ backgroundColor: '#0A4D2E', color: '#FAF8F3' }}
                      disabled={subscribing || !firstName.trim() || !email.trim()}
                      onClick={handleSubscribe}
                    >
                      {subscribing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('digest.subscribe.subscribing') || 'Subscribing...'}
                        </>
                      ) : (
                        <>
                          {t('digest.subscribe.subscribeFree') || 'Subscribe Free'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {/* ── Already subscribed ── */}
                    <p className="text-center text-xs pt-2">
                      <button
                        onClick={() => navigate('digest-current')}
                        className="font-medium transition-colors hover:underline"
                        style={{ color: '#C9981A' }}
                      >
                        {t('digest.subscribe.alreadySubscribed') || 'Manage your subscription'}
                      </button>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="mx-auto max-w-3xl sm:px-6 text-center">
          <p className="text-sm font-medium mb-2" style={{ color: '#1A1008' }}>
            {t('digest.subscribe.unsubscribe') || 'Unsubscribe anytime. One click.'}
          </p>
          <p className="text-xs" style={{ color: '#8B7E6A' }}>
            {t('digest.subscribe.privacyNote') || 'By subscribing, you agree to receive our weekly Digest. We never share your email.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
