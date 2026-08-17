'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Unlock, Heart, ArrowLeft, Loader2, MessageCircle,
  Share2, Search, BadgeCheck, X, Send, Copy, Check, VolumeX, Volume2,
  Users, Eye, Film, Ticket, Clock, Calendar,
} from 'lucide-react';
import { YoureInScreen } from './youre-in-screen';

// ─── Category system (§5.3 seed taxonomy) ───────────────────────
const CATEGORIES = ['All', 'Music', 'Comedy', 'Film', 'Fashion', 'Sports', 'Education', 'Spirituality', 'Food', 'Beauty'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_GRADIENTS: Record<string, string> = {
  music: 'from-purple-900/50',
  comedy: 'from-amber-900/50',
  film: 'from-rose-900/50',
  fashion: 'from-pink-900/50',
  sports: 'from-emerald-900/50',
  education: 'from-sky-900/50',
  spirituality: 'from-indigo-900/50',
  news_culture: 'from-slate-800/50',
  food: 'from-orange-900/50',
  beauty_lifestyle: 'from-fuchsia-900/50',
};

// Solid gradient backgrounds for PosterCard
const CATEGORY_SOLID_GRADIENTS: Record<string, string> = {
  music: 'linear-gradient(135deg, #581c87, #3b0764, #1e1b4b)',
  comedy: 'linear-gradient(135deg, #92400e, #78350f, #451a03)',
  film: 'linear-gradient(135deg, #9f1239, #881337, #4c0519)',
  fashion: 'linear-gradient(135deg, #9d174d, #831843, #500724)',
  sports: 'linear-gradient(135deg, #065f46, #064e3b, #022c22)',
  education: 'linear-gradient(135deg, #075985, #0c4a6e, #082f49)',
  spirituality: 'linear-gradient(135deg, #3730a3, #312e81, #1e1b4b)',
  news_culture: 'linear-gradient(135deg, #1e293b, #0f172a, #020617)',
  food: 'linear-gradient(135deg, #9a3412, #7c2d12, #431407)',
  beauty_lifestyle: 'linear-gradient(135deg, #86198f, #701a75, #4a044e)',
};

// ─── Types ───────────────────────────────────────────────────────
interface VideoCreator {
  stageName: string; handle: string; avatarUrl?: string;
  verified: boolean; followerCount: number; id?: string;
}

interface VideoItem {
  id: string; title: string; description?: string; category: string;
  ticketPriceKes: number; thumbnailUrl?: string; durationSeconds?: number;
  cfPreviewStreamId?: string; cfPremiumStreamId?: string;
  demoVideoUrl?: string;
  isHouseContent?: boolean;
  viewCount: number; likeCount: number; shareCount: number;
  status: string; createdAt: string; creatorId?: string;
  creator: VideoCreator;
  isPreview?: boolean;
  // §1 Premiere → VOD fields
  releaseMode?: string;
  premiereAt?: string;
  premiereWindowEnds?: string;
  vodRevSharePct?: number;
  backstageVideoId?: string;
}

type UnlockStatus = 'locked' | 'processing' | 'unlocked';

// ─── Preview cards (replace DEMO_CONTENT — honestly labeled, no fake stream IDs) ───
const PREVIEW_CARDS: VideoItem[] = [
  {
    id: 'preview-1', title: 'Nairobi Nights — A Short Film', description: 'A cinematic journey through the vibrant streets of Nairobi after dark.',
    category: 'film', ticketPriceKes: 150, viewCount: 4200, likeCount: 1800, shareCount: 240,
    thumbnailUrl: '/demo-poster-nairobi.png',
    demoVideoUrl: '/demo-video-nairobi.mp4',
    durationSeconds: 10,
    status: 'live', createdAt: new Date().toISOString(), isPreview: true, isHouseContent: true,
    creator: { stageName: 'AfriSpine Studios', handle: '@afrispine_studios', verified: true, followerCount: 120000, id: 'as-studios' },
  },
  {
    id: 'preview-2', title: 'Sounds of the Savanna', description: 'An immersive audio-visual experience blending traditional Kenyan music with modern beats.',
    category: 'music', ticketPriceKes: 100, viewCount: 8900, likeCount: 4300, shareCount: 670,
    thumbnailUrl: '/demo-poster-savanna.png',
    demoVideoUrl: '/demo-video-savanna.mp4',
    durationSeconds: 52,
    status: 'live', createdAt: new Date().toISOString(), isPreview: true, isHouseContent: true,
    creator: { stageName: 'AfriSpine Studios', handle: '@afrispine_studios', verified: true, followerCount: 120000, id: 'as-studios' },
  },
  {
    id: 'preview-3', title: 'Ankara Dreams — Fashion Forward', description: 'A celebration of Kenyan fashion design and the artisans behind it.',
    category: 'fashion', ticketPriceKes: 0, viewCount: 15000, likeCount: 7200, shareCount: 1200,
    thumbnailUrl: '/demo-poster-fashion.png',
    demoVideoUrl: '/demo-video-fashion.mp4',
    durationSeconds: 10,
    status: 'live', createdAt: new Date().toISOString(), isPreview: true, isHouseContent: true,
    creator: { stageName: 'AfriSpine Studios', handle: '@afrispine_studios', verified: true, followerCount: 120000, id: 'as-studios' },
  },
];

// ─── Sponsor overlay slot types ─────────────────────────────────
type SponsorSlotType = 'backdrop_banner' | 'smart_chyron' | 'intro_splash' | 'feed_native_card';
const SPONSOR_SLOT_SEQUENCE: SponsorSlotType[] = ['backdrop_banner', 'smart_chyron', 'intro_splash', 'feed_native_card'];
const SPONSOR_SLOT_DURATION: Record<SponsorSlotType, number> = {
  backdrop_banner: 5000,
  smart_chyron: 5000,
  intro_splash: 3000,
  feed_native_card: 5000,
};

// ─── Helpers ─────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// ─── Inline: Film Leader Countdown (replaces Loader2 spinner) ───
function FilmLeaderCountdown() {
  const [num, setNum] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setNum(p => p <= 1 ? 3 : p - 1), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-dvh w-full snap-start snap-always flex-shrink-0 bg-gray-950 flex items-center justify-center">
      <div className="relative flex flex-col items-center gap-6">
        {/* Sprocket holes decoration */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-3 opacity-20">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 w-2 rounded-sm bg-white" />
          ))}
        </div>
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-3 opacity-20">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 w-2 rounded-sm bg-white" />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={num}
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-7xl font-black text-white tabular-nums"
          >
            {num}
          </motion.span>
        </AnimatePresence>
        <div className="h-px w-32 bg-white/20" />
        <p className="text-xs font-medium tracking-widest text-white/40 uppercase">AfriSpine</p>
      </div>
    </div>
  );
}

// ─── Inline: PosterCard (shown when no thumbnail AND no streamId, or stream error) ───
function PosterCard({
  title, creatorName, category, isContentComingSoon,
}: {
  title?: string; creatorName?: string; category?: string; isContentComingSoon?: boolean;
}) {
  const gradient = category
    ? (CATEGORY_SOLID_GRADIENTS[category.toLowerCase().replace(' ', '_')] ?? CATEGORY_SOLID_GRADIENTS[category.toLowerCase()] ?? 'linear-gradient(135deg, #065f46, #022c22)')
    : 'linear-gradient(135deg, #065f46, #022c22)';

  if (isContentComingSoon) {
    return (
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center" style={{ background: gradient }}>
        {/* Film strip decorative element */}
        <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between py-8 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex justify-center gap-6">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="w-3 h-4 rounded-sm bg-white/5" />
              ))}
            </div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Film className="h-10 w-10 text-white/60" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AfriSpine</h1>
          <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5">
            <Film className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm font-semibold text-white/80">Content Coming Soon</span>
          </div>
          <p className="mt-2 text-sm text-white/40 text-center max-w-xs">Premiere content is being curated for you. Stay tuned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: gradient }}>
      {/* Subtle radial highlight */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
      {/* Film strip decorative rows at top and bottom */}
      <div className="absolute inset-x-0 top-3 pointer-events-none opacity-20">
        <div className="flex justify-center gap-3">
          {Array.from({ length: 10 }).map((_, j) => (
            <div key={j} className="w-2.5 h-3.5 rounded-[2px] bg-white/40" />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-3 pointer-events-none opacity-20">
        <div className="flex justify-center gap-3">
          {Array.from({ length: 10 }).map((_, j) => (
            <div key={j} className="w-2.5 h-3.5 rounded-[2px] bg-white/40" />
          ))}
        </div>
      </div>
      {/* Creator avatar with animated ring */}
      {creatorName && (
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-full border border-white/10" style={{ animation: 'slowPulse 3s ease-in-out infinite' }} />
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/25">
            <span className="text-2xl font-bold text-white tracking-tight">{getInitials(creatorName)}</span>
          </div>
        </div>
      )}
      {/* Title */}
      {title && <h2 className="mt-5 px-8 text-center text-xl font-bold leading-snug text-white drop-shadow-lg">{title}</h2>}
      {/* Premiering Soon tag */}
      <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5">
        <Film className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-white/80">Premiering Soon</span>
      </div>
    </div>
  );
}

// ─── Inline: FilmSpineRail (replaces scroll progress dots) ───
function FilmSpineRail({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null;
  const notchGap = Math.min(32, Math.max(16, 400 / count));
  const totalHeight = count * notchGap;

  return (
    <div className="pointer-events-none absolute right-1 top-1/2 z-30 -translate-y-1/2">
      {/* Vertical film-strip border lines */}
      <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />
      <div className="absolute right-0 top-2 bottom-2 w-px bg-white/10" />
      <div
        className="relative flex flex-col items-center rounded-l-lg bg-black/30 backdrop-blur-sm py-3 px-2"
        style={{ height: totalHeight + 24 }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center" style={{ gap: notchGap - 14 }}>
            {/* Sprocket notch */}
            <motion.div
              className="rounded-[2px]"
              style={{ width: 10, height: 14 }}
              animate={{
                backgroundColor: idx === activeIndex ? '#10b981' : 'rgba(255,255,255,0.12)',
                boxShadow: idx === activeIndex ? '0 0 10px 3px rgba(16,185,129,0.45)' : '0 0 0px 0px transparent',
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
            {/* Separator line between notches */}
            {idx < count - 1 && <div className="w-5 h-px bg-white/8" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inline: Premiere Countdown Badge (§1) ───
function PremiereCountdownBadge({ premiereAt, premiereWindowEnds }: { premiereAt: string; premiereWindowEnds: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const isUpcoming = new Date(premiereAt) > new Date();
  const target = isUpcoming ? premiereAt : premiereWindowEnds;
  const label = isUpcoming ? 'Premiere in' : 'Window closes in';

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
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
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) return null;

  return (
    <div className="mt-2.5 flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold text-amber-200 tabular-nums">
        {timeLeft.days > 0 && <>{pad(timeLeft.days)}d </>}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

// ─── Inline: TicketStubUnlock (replaces shimmer unlock bar) ───
function TicketStubUnlock({ price, onClick, isProcessing }: { price: number; onClick: () => void; isProcessing: boolean }) {
  return (
    <button
      onClick={onClick}
      className="mt-2.5 flex items-center gap-3 rounded-none text-left transition-all duration-200 active:scale-[0.97] relative overflow-hidden"
      style={{
        background: 'rgba(17,24,39,0.8)',
        borderLeft: '3px solid #10b981',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 6px) 100%, 0 100%, 0 calc(100% - 8px))',
        padding: '10px 16px',
      }}
    >
      <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">KES {price}</span>
      <span className="text-xs font-medium text-white/80 flex-1">Unlock full video</span>
      <Ticket className="h-4 w-4 text-emerald-400/60" />
    </button>
  );
}

// ─── Inline: SponsorOverlayDemo ─────────────────────────────────
function SponsorOverlayDemo() {
  const [slotIndex, setSlotIndex] = useState(0);

  useEffect(() => {
    const currentSlot = SPONSOR_SLOT_SEQUENCE[slotIndex];
    const duration = SPONSOR_SLOT_DURATION[currentSlot];
    const timer = setInterval(() => {
      setSlotIndex(prev => (prev + 1) % SPONSOR_SLOT_SEQUENCE.length);
    }, duration);
    return () => clearInterval(timer);
  }, [slotIndex]);

  const currentSlot = SPONSOR_SLOT_SEQUENCE[slotIndex];

  const slotVariants = {
    initial: (slot: SponsorSlotType) => {
      if (slot === 'smart_chyron') return { x: '-100%', opacity: 0 };
      return { opacity: 0 };
    },
    animate: (slot: SponsorSlotType) => {
      if (slot === 'smart_chyron') return { x: 0, opacity: 1 };
      return { opacity: 1 };
    },
    exit: (slot: SponsorSlotType) => {
      if (slot === 'smart_chyron') return { x: '-100%', opacity: 0 };
      return { opacity: 0 };
    },
  };

  const slotTransition: Record<SponsorSlotType, object> = {
    backdrop_banner: { duration: 0.5, ease: 'easeOut' },
    smart_chyron: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    intro_splash: { duration: 0.4 },
    feed_native_card: { duration: 0.3 },
  };

  return (
    <AnimatePresence mode="wait" custom={currentSlot}>
      <motion.div
        key={currentSlot}
        custom={currentSlot}
        variants={slotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={slotTransition[currentSlot]}
      >
        {currentSlot === 'backdrop_banner' && (
          <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-35">
            <motion.div
              className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm px-4 py-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Image
                src="/demo-brand-afircorp.png"
                alt="AfriCorp"
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-xs font-medium text-white">Powered by AfriCorp</span>
            </motion.div>
          </div>
        )}

        {currentSlot === 'smart_chyron' && (
          <div className="absolute bottom-72 left-0 inset-x-0 z-35 pointer-events-none">
            <div className="relative h-10 w-full bg-black/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400" />
              <div className="flex items-center h-full px-4 pl-5">
                <span className="text-sm font-semibold text-white tracking-wide">
                  AfriCorp <span className="text-white/40 mx-2">—</span> Built for Africa&rsquo;s Future
                </span>
              </div>
            </div>
          </div>
        )}

        {currentSlot === 'intro_splash' && (
          <div className="absolute inset-0 z-35 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <Image
                src="/demo-brand-afircorp.png"
                alt="AfriCorp"
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl object-cover"
              />
              <span className="text-2xl font-black text-white tracking-tight">AfriCorp</span>
              <span className="text-sm font-medium text-white/60">Premium Partner</span>
            </div>
          </div>
        )}

        {currentSlot === 'feed_native_card' && (
          <div className="absolute top-0 left-0 inset-x-0 z-35">
            <div className="flex items-center justify-between h-9 bg-emerald-600/90 backdrop-blur-sm px-4">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Sponsored</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/demo-brand-afircorp.png"
                  alt="AfriCorp"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="text-[11px] font-semibold text-white/80">Ad</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export function CreatorWatchPage() {
  const navigate = useAppStore((s) => s.navigate);

  // ─── Data state ───
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);

  // ─── Per-video state ───
  const [unlockMap, setUnlockMap] = useState<Record<string, UnlockStatus>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>(() => ({}));
  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({});
  const [videoReadyMap, setVideoReadyMap] = useState<Record<string, boolean>>({});
  // §3: "You're In" post-purchase screen
  const [youreInVideoId, setYoureInVideoId] = useState<string | null>(null);

  // ─── §6: Stream error tracking ───
  const [streamErrorMap, setStreamErrorMap] = useState<Record<string, boolean>>({});

  // ─── §2: Premiere reveal tracking ───
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});
  const prevActiveIndexRef = useRef(-1);

  // ─── §5: Ticket tear animation ───
  const [tearingMap, setTearingMap] = useState<Record<string, boolean>>({});

  // ─── Phone input for unlock ───
  const [unlockModalVideoId, setUnlockModalVideoId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('254');
  const [checkoutError, setCheckoutError] = useState('');

  // ─── Referral code from deep link ───
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(null);

  // ─── Share sheet ───
  const [shareSheetVideoId, setShareSheetVideoId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Comments drawer ───
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; userId: string; body: string; createdAt: string }>>([]);
  const [commentInput, setCommentInput] = useState('');

  // ─── Double-tap to like ───
  const lastTapRef = useRef<Record<string, number>>({});
  const [heartBurst, setHeartBurst] = useState<{ videoId: string; x: number; y: number } | null>(null);

  // ─── Sponsor preview mode ───
  const [sponsorPreview, setSponsorPreview] = useState(false);

  // ─── Auto-seed house content ref ───
  const houseSeededRef = useRef(false);

  // ─── Refs ───
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // ─── Filtered videos ───
  const displayVideos = searchResults ?? (
    activeCategory === 'All' ? videos : videos.filter(v => v.category.toLowerCase().replace(' ', '_') === activeCategory.toLowerCase() || v.category.toLowerCase() === activeCategory.toLowerCase())
  );

  // ─── Read sponsorPreview from URL on mount ───
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const qMark = hash.indexOf('?');
      const search = qMark >= 0 ? hash.substring(qMark + 1) : '';
      const params = new URLSearchParams(search);
      if (params.get('sponsorPreview') === '1') {
        setSponsorPreview(true);
      }
    } catch {}
  }, []);

  // ─── Fetch feed on mount ───
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const refMatch = hash.match(/[?&]ref=([^&]+)/);
      if (refMatch?.[1]) setActiveReferralCode(refMatch[1]);
    } catch {}

    const initFeed = async () => {
      try {
        const res = await fetch('/api/content/foryou');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setVideos(data);
            const lm: Record<string, number> = {};
            const um: Record<string, UnlockStatus> = {};
            for (const v of data) {
              lm[v.id] = v.likeCount;
              um[v.id] = v.ticketPriceKes === 0 ? 'unlocked' : 'locked';
            }
            setLikeCountMap(lm);
            setUnlockMap(um);
            setLoading(false);
            return;
          }
        }
      } catch { /* fallback to preview */ }

      // Feed empty — try seeding house content once
      if (!houseSeededRef.current) {
        houseSeededRef.current = true;
        try {
          await fetch('/api/content/seed-house', { method: 'POST' });
          const refetch = await fetch('/api/content/foryou');
          if (refetch.ok) {
            const seededData = await refetch.json();
            if (Array.isArray(seededData) && seededData.length > 0) {
              setVideos(seededData);
              const lm: Record<string, number> = {};
              const um: Record<string, UnlockStatus> = {};
              for (const v of seededData) {
                lm[v.id] = v.likeCount;
                um[v.id] = v.ticketPriceKes === 0 ? 'unlocked' : 'locked';
              }
              setLikeCountMap(lm);
              setUnlockMap(um);
              setLoading(false);
              return;
            }
          }
        } catch { /* seed failed, fall through to preview */ }
      }

      // Fallback to preview cards
      setVideos(PREVIEW_CARDS);
      const lm: Record<string, number> = {};
      const um: Record<string, UnlockStatus> = {};
      for (const v of PREVIEW_CARDS) {
        lm[v.id] = v.likeCount;
        um[v.id] = v.ticketPriceKes === 0 ? 'unlocked' : 'locked';
      }
      setLikeCountMap(lm);
      setUnlockMap(um);
      setLoading(false);
    };

    initFeed();
  }, []);

  // ─── Track active index changes for spring animation and reveal ───
  useEffect(() => {
    if (activeIndex !== prevActiveIndexRef.current) {
      prevActiveIndexRef.current = activeIndex;
      const vid = displayVideos[activeIndex];
      if (vid && !revealedMap[vid.id]) {
        // Mark as revealed after the premiere sequence window
        const timer = setTimeout(() => {
          setRevealedMap(p => ({ ...p, [vid.id]: true }));
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, displayVideos, revealedMap]);

  // ─── IntersectionObserver for active card + video play/pause ───
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const idx = Number(entry.target.getAttribute('data-index'));
      if (isNaN(idx)) continue;
      const vid = displayVideos[idx];
      if (!vid) continue;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        setActiveIndex(idx);
        const videoEl = videoRefs.current.get(vid.id);
        if (videoEl) { videoEl.currentTime = 0; videoEl.play().catch(() => {}); }
      } else {
        const videoEl = videoRefs.current.get(vid.id);
        if (videoEl) videoEl.pause();
      }
    }
  }, [displayVideos]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(handleIntersect, { root, threshold: [0.5] });
    cardRefs.current.forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [displayVideos, handleIntersect]);

  // ─── Actions ───
  const toggleLike = useCallback(async (id: string) => {
    const next = !likedMap[id];
    setLikedMap(p => ({ ...p, [id]: next }));
    setLikeCountMap(p => ({ ...p, [id]: (p[id] ?? 0) + (next ? 1 : -1) }));
    try { await fetch('/api/content/like', { method: next ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: id }) }); } catch {}
  }, [likedMap]);

  const toggleFollow = useCallback(async (creatorId: string) => {
    const next = !followMap[creatorId];
    setFollowMap(p => ({ ...p, [creatorId]: next }));
    try { await fetch('/api/content/follow', { method: next ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creatorId }) }); } catch {}
  }, [followMap]);

  // ─── Real unlock flow (STK Push) ───
  const initiateCheckout = useCallback(async (videoId: string) => {
    const phone = phoneInput.replace(/\D/g, '');
    if (!phone.startsWith('254') || phone.length < 12) { setCheckoutError('Enter a valid 254... number'); return; }
    setUnlockMap(p => ({ ...p, [videoId]: 'processing' }));
    setCheckoutError('');
    try {
      const res = await fetch('/api/content/checkout/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, phone, referralCode: activeReferralCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.merchantRequestId) throw new Error(data.error || 'Checkout failed');
      const poll = async (mrId: string, attempts = 0) => {
        if (attempts > 40) { setUnlockMap(p => ({ ...p, [videoId]: 'locked' })); setCheckoutError('Payment timed out. Try again.'); return; }
        await new Promise(r => setTimeout(r, 3000));
        try {
          const s = await fetch(`/api/content/checkout/status/${mrId}`);
          const d = await s.json();
          if (d.status === 'completed') {
            // §5: Tear away ticket stub, then flash
            setTearingMap(p => ({ ...p, [videoId]: true }));
            setTimeout(() => {
              setUnlockMap(p => ({ ...p, [videoId]: 'unlocked' }));
              setFlashMap(p => ({ ...p, [videoId]: true }));
              setTearingMap(p => ({ ...p, [videoId]: false }));
              setUnlockModalVideoId(null);
              // §3: Show "You're In" screen after flash
              setTimeout(() => {
                setFlashMap(p => ({ ...p, [videoId]: false }));
                setYoureInVideoId(videoId);
              }, 1500);
            }, 500);
          } else if (d.status === 'expired') {
            setUnlockMap(p => ({ ...p, [videoId]: 'locked' }));
            setCheckoutError('Payment expired. Try again.');
          } else { poll(mrId, attempts + 1); }
        } catch { poll(mrId, attempts + 1); }
      };
      poll(data.merchantRequestId);
    } catch (e: any) {
      setUnlockMap(p => ({ ...p, [videoId]: 'locked' }));
      setCheckoutError(e.message || 'Something went wrong');
    }
  }, [phoneInput, activeReferralCode]);

  // ─── Search ───
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    try {
      const res = await fetch('/api/content/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery }) });
      if (res.ok) { const data = await res.json(); setSearchResults(Array.isArray(data) ? data : []); }
    } catch { setSearchResults([]); }
  }, [searchQuery]);

  // ─── Share ───
  const handleShare = useCallback(async (video: VideoItem) => {
    try {
      const res = await fetch('/api/content/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: video.id, channel: 'copy_link' }) });
      const data = await res.json();
      const url = data.shareUrl || `https://www.afri-spine.com/w/${video.id}`;
      setShareUrl(url);
      setShareSheetVideoId(video.id);
      if (navigator.share) {
        await navigator.share({ title: video.title, text: `Watch \"${video.title}\" by ${video.creator.stageName} on AfriSpine`, url });
        setShareSheetVideoId(null);
      }
    } catch { /* fallback to sheet */ }
  }, []);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  // ─── Comments ───
  const openComments = useCallback(async (videoId: string) => {
    setCommentsVideoId(videoId);
    try { const res = await fetch(`/api/content/comments?videoId=${videoId}`); if (res.ok) setComments(await res.json()); } catch { setComments([]); }
  }, []);

  const postComment = useCallback(async () => {
    if (!commentInput.trim() || !commentsVideoId) return;
    try {
      const res = await fetch('/api/content/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: commentsVideoId, body: commentInput }) });
      if (res.ok) { setComments(prev => [...prev, { id: Date.now().toString(), userId: 'you', body: commentInput, createdAt: new Date().toISOString() }]); setCommentInput(''); }
    } catch {}
  }, [commentInput, commentsVideoId]);

  // ─── Double-tap to like ───
  const handleCardTap = useCallback((videoId: string, e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const last = lastTapRef.current[videoId] || 0;
    lastTapRef.current[videoId] = now;
    if (now - last < 300) {
      if (!likedMap[videoId]) toggleLike(videoId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.left + rect.width / 2 : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? rect.top + rect.height / 2 : (e as React.MouseEvent).clientY;
      setHeartBurst({ videoId, x: clientX, y: clientY });
      setTimeout(() => setHeartBurst(null), 800);
    }
  }, [likedMap, toggleLike]);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el); else cardRefs.current.delete(id);
  }, []);

  // ─── Handle video error ───
  const handleVideoError = useCallback((videoId: string) => {
    setStreamErrorMap(p => ({ ...p, [videoId]: true }));
  }, []);

  // ─── Render ───
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* Inline keyframes for heartBurst + kenBurns */}
      <style>{`
        @keyframes heartBurst {
          0% { transform: scale(0.5); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes kenBurns {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes slowPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
      `}</style>

      {/* ─── z-30: Top bar ─── */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 pb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('landing')}
          className="pointer-events-auto h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 hover:text-white" aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1 mx-4">
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search videos..." className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm" autoFocus />
            <Button size="icon" variant="ghost" onClick={() => { setSearchOpen(false); setSearchResults(null); setSearchQuery(''); }} className="h-9 w-9 text-white hover:bg-white/10"><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-lg select-none">AfriSpine</span>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}
          className="pointer-events-auto h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 hover:text-white" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
      </header>

      {/* ─── Sponsor Preview Mode Badge ─── */}
      {sponsorPreview && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-4 z-30 flex items-center gap-2 rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5"
          style={{ top: 64 }}
        >
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">Sponsor Preview Mode</span>
          <button
            onClick={() => setSponsorPreview(false)}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Disable sponsor preview"
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </motion.div>
      )}

      {/* ─── z-20: Category chips ─── */}
      {!searchOpen && (
        <div className="absolute inset-x-0 top-16 z-20 flex items-center gap-2 px-4 pt-2 pb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat as Category); setSearchResults(null); }}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                activeCategory === cat && !searchResults ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ─── Scroll-snap container ─── */}
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pt-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading ? (
          <><FilmLeaderCountdown /><FilmLeaderCountdown /><FilmLeaderCountdown /></>
        ) : displayVideos.length === 0 ? (
          <div className="h-dvh w-full snap-start snap-always flex-shrink-0 relative">
            <PosterCard isContentComingSoon />
          </div>
        ) : (
          displayVideos.map((video, idx) => {
            const isActive = activeIndex === idx;
            const status = unlockMap[video.id] ?? (video.ticketPriceKes === 0 ? 'unlocked' : 'locked');
            const isLocked = status === 'locked';
            const isProcessing = status === 'processing';
            const isUnlocked = status === 'unlocked';
            const isLiked = !!likedMap[video.id];
            const likeCount = likeCountMap[video.id] ?? video.likeCount;
            const isFollowing = !!followMap[video.creatorId ?? ''];
            const gradientColor = CATEGORY_GRADIENTS[video.category.toLowerCase().replace(' ', '_')] ?? CATEGORY_GRADIENTS[video.category.toLowerCase()] ?? 'from-gray-900/40';
            const isMuted = mutedMap[video.id] !== false;
            const videoReady = !!videoReadyMap[video.id];
            const hasStreamError = !!streamErrorMap[video.id];
            // Use preview stream always; swap to premium when unlocked
            const streamId = isUnlocked && video.cfPremiumStreamId ? video.cfPremiumStreamId : video.cfPreviewStreamId;
            // Use demoVideoUrl when no Cloudflare stream is available
            const hasDemoVideo = !streamId && !!video.demoVideoUrl;
            const needsPosterCard = (!video.thumbnailUrl && !streamId && !hasDemoVideo) || hasStreamError;
            const isRevealed = !!revealedMap[video.id];
            // §4: Social presence
            const watchingNow = Math.max(1, Math.floor(video.viewCount / 500));
            const isTrending = video.likeCount > 100;
            const isHotTrending = video.likeCount > 5000;

            return (
              <div key={video.id} ref={el => setCardRef(video.id, el)} data-index={idx}
                className="relative h-dvh w-full snap-start snap-always flex-shrink-0 select-none"
                onClick={e => handleCardTap(video.id, e)}>

                {/* ─── z-0: PosterCard (no thumbnail, no stream, no demo, or stream error) ─── */}
                {needsPosterCard && (
                  <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${videoReady && !hasStreamError ? 'opacity-0' : 'opacity-100'}`}>
                    <PosterCard
                      title={video.title}
                      creatorName={video.creator.stageName}
                      category={video.category}
                    />
                  </div>
                )}

                {/* ─── z-0: Thumbnail (shown until video is ready, with Ken Burns) ─── */}
                {video.thumbnailUrl && !hasStreamError && (
                  <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}>
                    <Image
                      src={video.thumbnailUrl} alt={video.title} fill className="object-cover"
                      priority={idx < 2}
                      style={isActive && !isRevealed ? { animation: 'kenBurns 20s ease-out forwards' } : undefined}
                    />
                  </div>
                )}

                {/* ─── §2: Spotlight sweep (300-600ms, only on first activation) ─── */}
                {isActive && !isRevealed && (video.thumbnailUrl || needsPosterCard) && (
                  <motion.div
                    className="absolute inset-0 z-[5] pointer-events-none"
                    initial={{ opacity: 1, x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
                    onAnimationComplete={() => { /* let it disappear via AnimatePresence exit */ }}
                    style={{
                      background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.1) 60%, transparent 100%)',
                    }}
                  />
                )}

                {/* ─── z-0: Cloudflare Stream video element (trailer or premium) ─── */}
                {streamId && !hasStreamError && (
                  <video
                    ref={el => {
                      if (el) {
                        videoRefs.current.set(video.id, el);
                        if (!videoReadyMap[video.id]) {
                          const onReady = () => {
                            setVideoReadyMap(p => ({ ...p, [video.id]: true }));
                            el.removeEventListener('canplay', onReady);
                            el.removeEventListener('loadeddata', onReady);
                          };
                          el.addEventListener('canplay', onReady);
                          el.addEventListener('loadeddata', onReady);
                          const onError = () => {
                            handleVideoError(video.id);
                            el.removeEventListener('error', onError);
                          };
                          el.addEventListener('error', onError);
                        }
                      } else { videoRefs.current.delete(video.id); }
                    }}
                    autoPlay muted={isMuted} playsInline loop preload="auto"
                    className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    src={`https://customer-c4f5c4f4.cloudflarestream.com/${streamId}/manifest/video.m3u8`} />
                )}

                {/* ─── z-0: Demo video element (direct URL, no Cloudflare Stream) ─── */}
                {hasDemoVideo && !hasStreamError && (
                  <video
                    ref={el => {
                      if (el) {
                        videoRefs.current.set(video.id, el);
                        if (!videoReadyMap[video.id]) {
                          const onReady = () => {
                            setVideoReadyMap(p => ({ ...p, [video.id]: true }));
                            el.removeEventListener('canplay', onReady);
                            el.removeEventListener('loadeddata', onReady);
                          };
                          el.addEventListener('canplay', onReady);
                          el.addEventListener('loadeddata', onReady);
                        }
                      } else { videoRefs.current.delete(video.id); }
                    }}
                    autoPlay muted={isMuted} playsInline loop preload="auto"
                    className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    src={video.demoVideoUrl} />
                )}

                {/* ─── §2: Curtain-open reveal overlay (400-800ms, z-10) ─── */}
                {isActive && !isRevealed && (streamId || hasDemoVideo) && !hasStreamError && (
                  <motion.div
                    className="absolute inset-0 z-[8] pointer-events-none"
                    initial={{ clipPath: 'inset(0 50% 0 50%)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0%)' }}
                    transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} to-gray-950/80`} />
                  </motion.div>
                )}

                {/* ─── z-10: Ambient gradient overlay (decorative, no pointer events) ───*/}
                <div className={`absolute inset-0 z-10 pointer-events-none bg-gradient-to-br ${gradientColor} to-gray-950/80 ${isRevealed || !isActive ? '' : 'opacity-0'}`}>
                  <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
                </div>

                {/* ─── z-35: Sponsor Overlay Demo (only on active card when sponsor preview is on) ─── */}
                {isActive && sponsorPreview && (
                  <SponsorOverlayDemo />
                )}

                {/* ─── z-20: Bottom info bar + action rail ─── */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 z-20"
                  onClick={e => e.stopPropagation()}
                  initial={false}
                  animate={isActive && idx !== 0 ? { y: 6, opacity: 0.95 } : { y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* Scrim gradient */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  <div className="relative flex items-end justify-between px-5 pr-14 pb-6 pt-24">
                    {/* Left: Creator info + title + unlock bar */}
                    <div className="flex max-w-[70%] flex-col gap-1">
                      {/* Creator row */}
                      <div className="flex items-center gap-2">
                        {video.creator.avatarUrl ? (
                          <Image src={video.creator.avatarUrl} alt={video.creator.stageName} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/20" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{getInitials(video.creator.stageName)}</div>
                        )}
                        <span className="text-sm font-semibold text-white">{video.creator.stageName}</span>
                        {video.creator.verified && <BadgeCheck className="h-4 w-4 text-sky-400" />}
                        {video.creatorId && (
                          <button onClick={() => toggleFollow(video.creatorId)}
                            className={`ml-1 rounded-full border px-3 py-0.5 text-[11px] font-semibold transition-all duration-200 active:scale-90 ${isFollowing ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'}`}>
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>

                      {/* §4: Trending chip below creator name */}
                      {isTrending && (
                        <div className="mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            🔥 Trending
                            {video.likeCount > 100 && <span className="text-emerald-400/70">· {formatCount(video.likeCount)}</span>}
                          </span>
                        </div>
                      )}

                      {/* Social proof line */}
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <Users className="h-3 w-3" />{formatCount(video.creator.followerCount)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <Eye className="h-3 w-3" />{formatCount(video.viewCount)} views
                          {isHotTrending && <span style={{ animation: 'flamePulse 1.5s ease-in-out infinite', display: 'inline-block' }}>🔥</span>}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="mt-1.5 text-base font-bold leading-snug text-white">{video.title}</h2>

                      {/* Description (only when unlocked) */}
                      <p className={`mt-0.5 text-xs leading-relaxed text-white/70 transition-all duration-500 ${isUnlocked ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>{video.description}</p>

                      {/* ─── §1: Premiere Countdown ───*/}
                      {video.releaseMode === 'premiere' && video.premiereAt && video.premiereWindowEnds && new Date(video.premiereWindowEnds) > new Date() && (
                        <PremiereCountdownBadge premiereAt={video.premiereAt} premiereWindowEnds={video.premiereWindowEnds} />
                      )}

                      {/* ─── §5: Ticket Stub Unlock bar ───*/}
                      <AnimatePresence>
                        {isLocked && !tearingMap[video.id] && (
                          <motion.div
                            initial={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20, rotateX: 15, transition: { duration: 0.5, ease: 'easeIn' } }}
                          >
                            <TicketStubUnlock
                              price={video.ticketPriceKes}
                              onClick={() => { setUnlockModalVideoId(video.id); setPhoneInput('254'); setCheckoutError(''); }}
                              isProcessing={false}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Processing indicator */}
                      {isProcessing && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-300">Processing payment...</span>
                        </div>
                      )}

                      {/* Unlocked badge */}
                      {isUnlocked && video.ticketPriceKes > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400">Unlocked</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Action column — ALWAYS visible */}
                    <div className="flex flex-col items-center gap-4">
                      <button onClick={() => toggleLike(video.id)} className="flex flex-col items-center gap-1 transition-transform duration-200 active:scale-90" aria-label="Like">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${isLiked ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 text-white'}`}>
                          <Heart className={`h-6 w-6 transition-all duration-300 ${isLiked ? 'scale-110' : ''}`} fill={isLiked ? 'currentColor' : 'none'} />
                        </div>
                        <span className="text-xs font-semibold text-white/80">{formatCount(likeCount)}</span>
                      </button>

                      <button onClick={() => openComments(video.id)} className="flex flex-col items-center gap-1 transition-transform duration-200 active:scale-90" aria-label="Comments">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white"><MessageCircle className="h-6 w-6" /></div>
                        <span className="text-xs font-semibold text-white/80">{formatCount(video.viewCount)}</span>
                      </button>

                      <button onClick={() => handleShare(video)} className="flex flex-col items-center gap-1 transition-transform duration-200 active:scale-90" aria-label="Share">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white"><Share2 className="h-6 w-6" /></div>
                        <span className="text-xs font-semibold text-white/80">Share</span>
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* ─── §4: 'X watching now' chip (top-right area, below header) ─── */}
                <AnimatePresence>
                  {isActive && !video.isPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="absolute top-32 right-4 z-30 flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 pointer-events-none"
                    >
                      <Eye className="h-3 w-3 text-white/70" />
                      <span className="text-[11px] font-medium text-white/80">{watchingNow} watching</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── z-30: Mute toggle ───*/}
                {(streamId || hasDemoVideo) && !hasStreamError && (
                  <button onClick={e => { e.stopPropagation(); setMutedMap(p => ({ ...p, [video.id]: !isMuted })); }}
                    className="absolute right-4 bottom-48 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                )}

                {/* ─── z-40: Unlocked flash (transient, pointer-events-none) ───*/}
                <div className={`absolute inset-0 z-40 flex items-center justify-center bg-emerald-600/20 backdrop-blur-[2px] transition-all duration-700 pointer-events-none ${flashMap[video.id] ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="flex flex-col items-center gap-2"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20"><Unlock className="h-8 w-8 text-emerald-400" /></div><p className="text-sm font-semibold text-emerald-400">Unlocked ✓</p></div>
                </div>

                {/* ─── z-40: Double-tap heart burst (transient, pointer-events-none) ───*/}
                {heartBurst?.videoId === video.id && (
                  <div className="absolute z-40 pointer-events-none" style={{ left: heartBurst.x - 40, top: heartBurst.y - 40 }}>
                    <Heart className="h-20 w-20 text-rose-500" fill="currentColor" style={{ animation: 'heartBurst 0.8s ease-out forwards' }} />
                  </div>
                )}

                {/* ─── z-30: Scroll indicator (first card) ───*/}
                {idx === 0 && activeIndex === 0 && <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 flex animate-bounce"><div className="h-8 w-5 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5"><div className="h-1.5 w-1 rounded-full bg-white/60" /></div></div>}
              </div>
            );
          })
        )}
      </div>

      {/* ─── §1: FilmSpineRail (replaces scroll progress dots) ───*/}
      {!loading && displayVideos.length > 1 && (
        <FilmSpineRail count={displayVideos.length} activeIndex={activeIndex} />
      )}

      {/* ═══════ z-50: MODALS (nothing below this blocks the screen) ═══════ */}

      {/* ─── z-50: Phone Input Modal (§5: dark theater tones) ───*/}
      {unlockModalVideoId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setUnlockModalVideoId(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ background: '#030712' }}>
            {/* §5: Torn-ticket header decoration */}
            <div className="relative h-2 overflow-hidden">
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(90deg, rgba(16,185,129,0.2) 0px, rgba(16,185,129,0.2) 8px, transparent 8px, transparent 12px)',
              }} />
              {/* Zigzag bottom edge */}
              <svg className="absolute -bottom-1 left-0 w-full" height="6" preserveAspectRatio="none" viewBox="0 0 400 6">
                <path d="M0,0 L6,6 L12,0 L18,6 L24,0 L30,6 L36,0 L42,6 L48,0 L54,6 L60,0 L66,6 L72,0 L78,6 L84,0 L90,6 L96,0 L102,6 L108,0 L114,6 L120,0 L126,6 L132,0 L138,6 L144,0 L150,6 L156,0 L162,6 L168,0 L174,6 L180,0 L186,6 L192,0 L198,6 L204,0 L210,6 L216,0 L222,6 L228,0 L234,6 L240,0 L246,6 L252,0 L258,6 L264,0 L270,6 L276,0 L282,6 L288,0 L294,6 L300,0 L306,6 L312,0 L318,6 L324,0 L330,6 L336,0 L342,6 L348,0 L354,6 L360,0 L366,6 L372,0 L378,6 L384,0 L390,6 L396,0 L400,0" fill="#030712" stroke="none" />
              </svg>
            </div>
            <div className="p-6 pt-4">
              <h3 className="text-lg font-bold text-white">Unlock with M-Pesa</h3>
              <p className="mt-1 text-sm text-white/60">Enter your M-Pesa phone number to pay KES {videos.find(v => v.id === unlockModalVideoId)?.ticketPriceKes ?? 0}</p>
              <Input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="2547XXXXXXXX" className="mt-4 h-12 bg-white/5 border-white/10 text-white text-lg placeholder:text-white/30" />
              {checkoutError && <p className="mt-2 text-sm text-rose-400">{checkoutError}</p>}
              <Button onClick={() => initiateCheckout(unlockModalVideoId)} disabled={phoneInput.length < 12}
                className="mt-4 h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base">
                Pay Now
              </Button>
              <Button variant="ghost" onClick={() => setUnlockModalVideoId(null)} className="mt-2 w-full text-white/50 hover:text-white hover:bg-white/5">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── z-50: Share Sheet ───*/}
      {shareSheetVideoId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setShareSheetVideoId(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-gray-900 p-6 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Share</h3>
            <div className="mt-4 grid grid-cols-5 gap-3">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Watch on AfriSpine: ${shareUrl}`)}`} target="_blank" rel="noopener"
                className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600/20 text-green-500 text-xl font-bold">W</div>
                <span className="text-xs text-white/70">WhatsApp</span>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this out on AfriSpine')}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener"
                className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600/20 text-sky-500 text-xl font-bold">X</div>
                <span className="text-xs text-white/70">X/Twitter</span>
              </a>
              <a href={`https://www.instagram.com/`}
                onClick={async (e) => { e.preventDefault(); try { await navigator.clipboard.writeText(shareUrl); } catch {} if (navigator.share) { try { await navigator.share({ title: 'AfriSpine', text: 'Check out this video on AfriSpine!', url: shareUrl }); setShareSheetVideoId(null); return; } catch {} } window.open('https://www.instagram.com/', '_blank'); toast.success('Link copied — paste it in Instagram Stories!'); }}
                className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-600/20 text-pink-500 text-xl font-bold">IG</div>
                <span className="text-xs text-white/70">Instagram</span>
              </a>
              <a href={`https://www.tiktok.com/`}
                onClick={async (e) => { e.preventDefault(); try { await navigator.clipboard.writeText(shareUrl); } catch {} if (navigator.share) { try { await navigator.share({ title: 'AfriSpine', text: 'Check out this video on AfriSpine!', url: shareUrl }); setShareSheetVideoId(null); return; } catch {} } window.open('https://www.tiktok.com/', '_blank'); toast.success('Link copied — share it on TikTok!'); }}
                className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white text-xl font-bold">TT</div>
                <span className="text-xs text-white/70">TikTok</span>
              </a>
              <button onClick={copyShareLink} className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  {copied ? <Check className="h-6 w-6 text-emerald-400" /> : <Copy className="h-6 w-6" />}
                </div>
                <span className="text-xs text-white/70">Copy Link</span>
              </button>
            </div>
            <Button variant="ghost" onClick={() => setShareSheetVideoId(null)} className="mt-4 w-full text-white/50 hover:text-white hover:bg-white/5">Close</Button>
          </div>
        </div>
      )}

      {/* ─── z-50: Comments Drawer ───*/}
      {commentsVideoId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setCommentsVideoId(null)}>
          <div className="w-full max-w-md max-h-[70vh] rounded-t-2xl bg-gray-900 flex flex-col sm:rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-bold text-white">Comments</h3>
              <Button variant="ghost" size="icon" onClick={() => setCommentsVideoId(null)} className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
              {comments.length === 0 && <p className="text-center text-sm text-white/40 py-8">No comments yet. Be the first!</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400">{c.userId === 'you' ? 'YO' : getInitials(c.userId)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80">{c.userId === 'you' ? 'You' : c.userId}</p>
                    <p className="mt-0.5 text-sm text-white/60 break-words">{c.body}</p>
                    <p className="mt-1 text-[10px] text-white/30">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-3 flex gap-2">
              <Input value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()}
                placeholder="Add a comment..." className="h-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30" />
              <Button size="icon" onClick={postComment} disabled={!commentInput.trim()} className="h-10 w-10 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ z-60: "You're In" Post-Purchase Screen (§3) ═══════ */}
      <AnimatePresence>
        {youreInVideoId && (
          <YoureInScreen
            video={(videos.find(v => v.id === youreInVideoId) ?? displayVideos.find(v => v.id === youreInVideoId))!}
            onClose={() => setYoureInVideoId(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
