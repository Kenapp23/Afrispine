'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReferralBadge } from '@/components/afrispine/sender/top-supporters-strip';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';
import {
  Unlock,
  MonitorPlay,
  Users,
  Timer,
  Copy,
  Check,
  Play,
  Sparkles,
  MessageCircle,
  Tv,
  Share2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface Ticket {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  creatorName: string;
  amountPaid: number;
  purchasedAt: string;
}

interface ReferralStats {
  phone: string;
  totalEarnings: number;
  totalPaid: number;
  totalUnpaid: number;
  totalReferrals: number;
}

interface PremiereVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  releaseMode: string;
  premiereAt: string | null;
  premiereWindowEnds: string | null;
  creator: {
    stageName: string;
    handle: string;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
  };
}

// ─── Animation ────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Helpers ─────────────────────────────────────────────────

function normalizePhoneForApi(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (/^254\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return '254' + digits.slice(1);
  if (/^\+?254\d{9}$/.test(digits)) return '254' + digits.replace(/^\+?254/, '');
  return null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCountdown(premiereAt: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  isPast: boolean;
} {
  const target = new Date(premiereAt).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: diff > -3600000, isPast: diff <= -3600000 };
  }

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isLive: false,
    isPast: false,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-violet-100 text-violet-700',
  comedy: 'bg-amber-100 text-amber-700',
  drama: 'bg-rose-100 text-rose-700',
  sports: 'bg-sky-100 text-sky-700',
  news: 'bg-gray-100 text-gray-700',
  education: 'bg-emerald-100 text-emerald-700',
  lifestyle: 'bg-pink-100 text-pink-700',
  food: 'bg-orange-100 text-orange-700',
  tech: 'bg-cyan-100 text-cyan-700',
  fashion: 'bg-fuchsia-100 text-fuchsia-700',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || 'bg-gray-100 text-gray-600';
}

// ─── Component ────────────────────────────────────────────────

export function MyZoneTab() {
  const sender = useAppStore((s) => s.sender);
  const navigate = useAppStore((s) => s.navigate);
  const phone = sender?.phone || '';

  // Data state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [premieres, setPremieres] = useState<PremiereVideo[]>([]);
  const [premieresLoading, setPremieresLoading] = useState(true);

  // Copy referral link state
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Fetch: My Tickets ──
  const fetchTickets = useCallback(async () => {
    const apiPhone = normalizePhoneForApi(phone);
    if (!apiPhone) {
      setTicketsLoading(false);
      return;
    }
    try {
      setTicketsLoading(true);
      const res = await fetch(`/api/content/my-tickets?phone=${apiPhone}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
      }
    } catch {
      // silent
    } finally {
      setTicketsLoading(false);
    }
  }, [phone]);

  // ── Fetch: Referral Stats ──
  const fetchReferralStats = useCallback(async () => {
    const apiPhone = normalizePhoneForApi(phone);
    if (!apiPhone) {
      setReferralLoading(false);
      return;
    }
    try {
      setReferralLoading(true);
      const res = await fetch(`/api/content/referral/stats?phone=${apiPhone}`);
      if (res.ok) {
        const data = await res.json();
        setReferralStats(data);
      }
    } catch {
      // silent
    } finally {
      setReferralLoading(false);
    }
  }, [phone]);

  // ── Fetch: Upcoming Premieres ──
  const fetchPremieres = useCallback(async () => {
    try {
      setPremieresLoading(true);
      const res = await fetch('/api/content/foryou');
      if (res.ok) {
        const data: PremiereVideo[] = await res.json();
        // Filter to premiere-mode videos that haven't ended yet
        const now = new Date();
        const upcoming = data.filter(
          (v) =>
            v.releaseMode === 'premiere' &&
            v.premiereAt &&
            new Date(v.premiereAt) > now,
        );
        // Sort by premiere time ascending (soonest first)
        upcoming.sort(
          (a, b) => new Date(a.premiereAt!).getTime() - new Date(b.premiereAt!).getTime(),
        );
        setPremieres(upcoming.slice(0, 10));
      }
    } catch {
      // silent
    } finally {
      setPremieresLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchReferralStats();
    fetchPremieres();
  }, [fetchTickets, fetchReferralStats, fetchPremieres]);

  // ── Countdown ticker ──
  const [, setTick] = useState(0);
  useEffect(() => {
    if (premieres.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [premieres.length]);

  // ── Handler: Copy referral link ──
  const handleCopyReferralLink = async () => {
    if (!sender?.referralCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/signup?ref=${sender.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // ── Handler: Navigate to watch party ──
  const handleJoinWatchParty = () => {
    navigate('party');
  };

  // ── Derived ──
  const referralCount = referralStats?.totalReferrals ?? 0;
  const referralEarnings = referralStats?.totalEarnings ?? 0;
  const referralCode = sender?.referralCode || '';

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════════════════════
          Section 1: Unlocked Shows
          ════════════════════════════════════════════════════════ */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <Unlock className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Unlocked Shows</h2>
              {!ticketsLoading && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 text-[11px]"
                >
                  {tickets.length}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Content you&apos;ve unlocked with your tickets
            </p>
          </div>
          <div className="p-5 pt-3">
            {ticketsLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                    <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
                  <Unlock className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  You haven&apos;t unlocked any shows yet
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[260px]">
                  Browse content to find something you love!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="group flex gap-3 rounded-xl border border-gray-100 p-3 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() =>
                      navigate('watch', { videoId: t.videoId })
                    }
                  >
                    {/* Thumbnail */}
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {t.thumbnailUrl ? (
                        <img
                          src={t.thumbnailUrl}
                          alt={t.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                          <Play className="h-6 w-6 text-emerald-600" />
                        </div>
                      )}
                      {/* Unlocked badge overlay */}
                      <div className="absolute top-1 left-1">
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          <Check className="h-2.5 w-2.5" />
                          Unlocked
                        </span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                        {t.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {t.creatorName}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2">
                        {formatDate(t.purchasedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          Section 2: Watch Parties
          ════════════════════════════════════════════════════════ */}
      <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="rounded-xl bg-white border border-gray-100 p-5 hover:shadow-sm transition-all">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
              <MonitorPlay className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Watch Parties
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Watch content together with friends in real time
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center">
                <Users className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No active watch parties</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Join or create one to watch with friends
                </p>
              </div>
              <Button
                size="sm"
                className="mt-3 w-full bg-violet-600 text-white hover:bg-violet-700"
                onClick={handleJoinWatchParty}
              >
                <MonitorPlay className="mr-1.5 h-3.5 w-3.5" />
                Join a Watch Party
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          Section 3: Ambassador Status
          ════════════════════════════════════════════════════════ */}
      <motion.div custom={2} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Ambassador Status
              </h2>
              <ReferralBadge referralCount={referralCount} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Your referral impact on the AfriSpine community
            </p>
          </div>
          <div className="p-5 pt-3">
            {referralLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Total Referrals */}
                  <div className="rounded-xl bg-white border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] font-medium text-gray-500">
                        Total Referrals
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {referralCount}
                    </p>
                  </div>
                  {/* Total Earnings */}
                  <div className="rounded-xl bg-white border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Share2 className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[11px] font-medium text-gray-500">
                        Total Earnings
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      KES {referralEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Referral Code Display + Share CTA */}
                {referralCode && (
                  <div className="rounded-lg bg-white border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        Your Referral Code
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-md bg-gray-50 border border-gray-200 px-3 py-2 font-mono text-sm font-semibold text-gray-900 tracking-wider">
                        {referralCode}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={handleCopyReferralLink}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="mt-2.5 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={handleCopyReferralLink}
                    >
                      <Share2 className="mr-1.5 h-3.5 w-3.5" />
                      Share Your Referral Link
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          Section 4: Upcoming Premieres
          ════════════════════════════════════════════════════════ */}
      <motion.div custom={3} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
                <Tv className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Upcoming Premieres
              </h2>
              {!premieresLoading && (
                <Badge
                  variant="secondary"
                  className="bg-rose-50 text-rose-700 text-[11px]"
                >
                  {premieres.length}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Exclusive first-screenings you won&apos;t want to miss
            </p>
          </div>
          <div className="p-5 pt-3">
            {premieresLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                    <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : premieres.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
                  <Tv className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  No upcoming premieres right now
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Check back soon for new exclusive content
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {premieres.map((v) => {
                  const cd = getCountdown(v.premiereAt!);
                  return (
                    <div
                      key={v.id}
                      className="group flex gap-3 rounded-xl border border-gray-100 p-3 hover:border-rose-200 hover:shadow-sm transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-rose-200">
                            <Tv className="h-6 w-6 text-rose-600" />
                          </div>
                        )}
                        {/* Premiere badge */}
                        <div className="absolute top-1 left-1">
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            <Sparkles className="h-2.5 w-2.5" />
                            Premiere
                          </span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {v.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {v.creator.stageName}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`mt-1.5 text-[10px] ${getCategoryColor(v.category)}`}
                        >
                          {v.category}
                        </Badge>
                        {/* Countdown */}
                        {cd.isPast ? (
                          <p className="text-[11px] text-gray-400 mt-2">
                            Premiere has ended
                          </p>
                        ) : cd.isLive ? (
                          <p className="text-[11px] font-semibold text-rose-600 mt-2">
                            ● Live now
                          </p>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Timer className="h-3 w-3 text-gray-400" />
                            <span className="text-[11px] font-mono text-gray-600">
                              {cd.days > 0 && `${cd.days}d `}
                              {String(cd.hours).padStart(2, '0')}:
                              {String(cd.minutes).padStart(2, '0')}:
                              {String(cd.seconds).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
