'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock, Eye, Film, Heart, Share2, Copy, Check, Users, Play, Ticket, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryGradient, formatCount, getInitials } from '@/lib/poster-utils';

// ─── Types ───────────────────────────────────────────────────────

interface CreatorData {
  id: string;
  stageName: string;
  handle: string;
  avatarUrl?: string;
  verified: boolean;
  followerCount: number;
  bio?: string;
}

interface VideoData {
  id: string;
  title: string;
  category: string;
  ticketPriceKes: number;
  thumbnailUrl?: string;
  releaseMode?: string;
  premiereAt?: string;
  premiereWindowEnds?: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  durationSeconds?: number;
  creator?: CreatorData;
}

type CardMode = 'profile' | 'show';

interface AfriSpineCardProps {
  mode: CardMode;
  data: CreatorData | VideoData;
  onFollow?: (creatorId: string) => void;
  isFollowing?: boolean;
  onShare?: () => void;
  compact?: boolean;
}

// ─── Countdown Timer ─────────────────────────────────────────────
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      if (diff === 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) return <span className="text-emerald-400 text-sm font-semibold">Live Now</span>;

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 text-emerald-400" />
      <span className="text-sm font-mono font-bold text-white tabular-nums">
        {timeLeft.days > 0 && <>{pad(timeLeft.days)}d </>}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

// ─── Duration Formatter ──────────────────────────────────────────
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Avatar Component ────────────────────────────────────────────
function CreatorAvatar({ creator, size = 'md' }: { creator: CreatorData; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-xl' };
  const iconMap = { sm: 14, md: 18, lg: 28 };

  if (creator.avatarUrl) {
    return (
      <div className={`${sizeMap[size]} relative rounded-full overflow-hidden flex-shrink-0`}>
        <Image src={creator.avatarUrl} alt={creator.stageName} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizeMap[size]} rounded-full bg-emerald-900/60 flex items-center justify-center flex-shrink-0 border border-emerald-500/30`}>
      <span className="font-bold text-white">{getInitials(creator.stageName)}</span>
    </div>
  );
}

// ─── Film-strip decorative background ────────────────────────────
function FilmStripDecoration() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
      <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between py-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex justify-center gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="w-2.5 h-3 rounded-sm bg-white" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function AfriSpineCard({ mode, data, onFollow, isFollowing, onShare, compact }: AfriSpineCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (mode === 'show') {
      const vd = data as VideoData;
      navigator.clipboard.writeText(`https://www.afri-spine.com/w/${vd.id}`);
    } else {
      const cd = data as CreatorData;
      navigator.clipboard.writeText(`https://www.afri-spine.com/c/${cd.handle}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mode, data]);

  const handleWebShare = useCallback(() => {
    if (mode === 'show') {
      const vd = data as VideoData;
      const url = `https://www.afri-spine.com/w/${vd.id}`;
      if (navigator.share) {
        navigator.share({ title: vd.title, url });
      } else {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      const cd = data as CreatorData;
      const url = `https://www.afri-spine.com/c/${cd.handle}`;
      if (navigator.share) {
        navigator.share({ title: `${cd.stageName} on AfriSpine`, url });
      } else {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [mode, data]);

  // ─── PROFILE MODE ─────────────────────────────────────────────
  if (mode === 'profile') {
    const creator = data as CreatorData;
    const gradient = 'linear-gradient(135deg, #065f46, #064e3b, #022c22)';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: gradient }}
      >
        <FilmStripDecoration />

        {/* Radial highlight */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />

        <div className="relative z-10 p-6 flex flex-col items-center text-center gap-4">
          {/* Avatar + Verified */}
          <div className="relative">
            <CreatorAvatar creator={creator} size="lg" />
            {creator.verified && (
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-gray-950">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Name + Handle */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{creator.stageName}</h2>
            <p className="text-sm text-white/50 mt-0.5">@{creator.handle}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-white/70">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="text-sm font-semibold">{formatCount(creator.followerCount)}</span>
              <span className="text-xs text-white/40">followers</span>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">{creator.bio}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1">
            {onFollow && (
              <Button
                onClick={() => onFollow(creator.id)}
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                className={isFollowing
                  ? 'border-white/20 text-white/70 hover:bg-white/10'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                }
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWebShare}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Share2 className="h-4 w-4 mr-1.5" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
          </div>

          {/* AfriSpine branding */}
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
            <Film className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">On AfriSpine</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── SHOW MODE ───────────────────────────────────────────────
  const video = data as VideoData;
  const creator = video.creator;
  const gradient = getCategoryGradient(video.category);

  const isPremiere = video.releaseMode === 'premiere' && video.premiereWindowEnds && new Date(video.premiereWindowEnds) > new Date();
  const isUpcomingPremiere = video.releaseMode === 'premiere' && video.premiereAt && new Date(video.premiereAt) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      style={{ background: gradient }}
    >
      <FilmStripDecoration />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

      {/* Thumbnail area */}
      <div className="relative h-48 w-full overflow-hidden">
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="h-12 w-12 text-white/10" />
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/80 uppercase">
            {video.category}
          </span>
        </div>

        {/* Duration */}
        {video.durationSeconds && video.durationSeconds > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[11px] font-mono text-white/80">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>
        )}

        {/* Premiere countdown overlay */}
        {isUpcomingPremiere && video.premiereAt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Premiere</span>
              </div>
              <CountdownTimer targetDate={video.premiereAt} />
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="relative z-10 p-5 flex flex-col gap-3">
        {/* Title */}
        <h3 className="text-lg font-black text-white leading-tight tracking-tight line-clamp-2">
          {video.title}
        </h3>

        {/* Creator row */}
        {creator && (
          <div className="flex items-center gap-2.5">
            <CreatorAvatar creator={creator} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-white/90 truncate">{creator.stageName}</span>
                {creator.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-white/50 text-xs">
          <div className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(video.viewCount)}</div>
          <div className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(video.likeCount)}</div>
          <div className="flex items-center gap-1"><Share2 className="h-3 w-3" />{formatCount(video.shareCount)}</div>
        </div>

        {/* Bottom: Price / CTA + Share */}
        <div className="flex items-center justify-between mt-1">
          {isPremiere ? (
            <div className="flex items-center gap-2">
              <CountdownTimer targetDate={video.premiereWindowEnds} />
              <span className="text-xs text-white/40">·</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <Ticket className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">KES {video.ticketPriceKes.toLocaleString()}</span>
              </div>
            </div>
          ) : video.ticketPriceKes > 0 ? (
            <div className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-white/80">KES {video.ticketPriceKes.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Watch Now</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleWebShare}
            className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* AfriSpine branding */}
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/5 px-3 py-1 mt-1">
          <Film className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">Exclusively on AfriSpine</span>
        </div>
      </div>
    </motion.div>
  );
}

export default AfriSpineCard;
