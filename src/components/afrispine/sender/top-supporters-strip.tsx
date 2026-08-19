'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  referralCount: number;
  totalEarningsKes: number;
  referralCode: string | null;
}

// ─── TopSupportersStrip ────────────────────────────────────────

export function TopSupportersStrip() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/growth/leaderboard?window=week');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setEntries((data.leaderboard ?? []).slice(0, 5));
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { cancelled = true; };
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-4 text-center">
        <Trophy className="mx-auto mb-1.5 h-5 w-5 text-emerald-400" />
        <p className="text-xs font-medium text-emerald-600">
          Be the first — share your referral link
        </p>
      </div>
    );
  }

  // ── Strip ──
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Top Supporters this week</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            {/* Avatar circle with initials */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {getInitials(entry.name)}
            </div>
            {/* Name */}
            <span className="max-w-[72px] truncate text-center text-[11px] font-medium text-gray-700">
              {entry.name}
            </span>
            {/* Referral count badge */}
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-[10px] font-semibold text-emerald-700"
            >
              {entry.referralCount} ref{entry.referralCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ReferralBadge ─────────────────────────────────────────────

interface ReferralBadgeProps {
  referralCount: number;
}

export function ReferralBadge({ referralCount }: ReferralBadgeProps) {
  if (referralCount >= 10) {
    return (
      <Badge className="gap-1 border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-700">
        <StarIcon className="h-3 w-3" />
        Top Ambassador
      </Badge>
    );
  }
  if (referralCount >= 5) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
        Ambassador
      </Badge>
    );
  }
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
