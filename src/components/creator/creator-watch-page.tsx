'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import {
  Lock,
  Unlock,
  Heart,
  Play,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

/* ─── Demo data ─── */
const DEMO_CONTENT = [
  {
    id: '1',
    creator: 'Wanjiku Kariuki',
    handle: '@wanjiku_creates',
    avatar: '',
    title: 'Behind the Scenes: My Nairobi Fashion Shoot',
    description:
      'Exclusive BTS from my latest collaboration with a top Kenyan designer.',
    price: 100,
    thumbnail: '',
    likes: 2340,
    isLocked: true,
  },
  {
    id: '2',
    creator: 'DJ Muthoni',
    handle: '@dj_muthoni',
    avatar: '',
    title: 'How I Produce a Track in 30 Minutes',
    description:
      'My full production workflow from sample selection to final mix.',
    price: 150,
    thumbnail: '',
    likes: 5100,
    isLocked: true,
  },
  {
    id: '3',
    creator: 'Chef Otieno',
    handle: '@chef_otieno',
    avatar: '',
    title: 'Nyama Choma: The Perfect Recipe',
    description:
      'The recipe that got me 100K followers. Free for everyone!',
    price: 0,
    thumbnail: '',
    likes: 12000,
    isLocked: false,
  },
  {
    id: '4',
    creator: 'Amina Daudi',
    handle: '@amina_fitness',
    avatar: '',
    title: '30-Day Transformation Guide',
    description:
      'The exact workout and meal plan I used. Daily check-ins included.',
    price: 200,
    thumbnail: '',
    likes: 8900,
    isLocked: true,
  },
  {
    id: '5',
    creator: 'Bryan Mwangi',
    handle: '@bryan_comedy',
    avatar: '',
    title: 'How I Write Skits That Go Viral',
    description:
      'My creative process, from idea to 1M views.',
    price: 50,
    thumbnail: '',
    likes: 45000,
    isLocked: true,
  },
];

const CARD_BG_ACCENTS = [
  'bg-gradient-to-br from-rose-800/40 to-gray-900',
  'bg-gradient-to-br from-violet-800/40 to-gray-900',
  'bg-gradient-to-br from-amber-800/40 to-gray-900',
  'bg-gradient-to-br from-emerald-800/40 to-gray-900',
  'bg-gradient-to-br from-orange-800/40 to-gray-900',
];

/* ─── Helpers ─── */
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLikes(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

type UnlockStatus = 'locked' | 'processing' | 'unlocked';

export function CreatorWatchPage() {
  const navigate = useAppStore((s) => s.navigate);

  const [unlockMap, setUnlockMap] = useState<Record<string, UnlockStatus>>(() => {
    const m: Record<string, UnlockStatus> = {};
    for (const c of DEMO_CONTENT) m[c.id] = c.isLocked ? 'locked' : 'unlocked';
    return m;
  });

  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const c of DEMO_CONTENT) m[c.id] = c.likes;
    return m;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        const idx = Number(entry.target.getAttribute('data-index'));
        if (!isNaN(idx)) setActiveIndex(idx);
      }
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root,
      threshold: [0.5],
    });

    cardRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect]);

  const handleUnlock = useCallback((id: string) => {
    setUnlockMap((prev) => ({ ...prev, [id]: 'processing' }));

    setTimeout(() => {
      setUnlockMap((prev) => ({ ...prev, [id]: 'unlocked' }));
      setFlashMap((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setFlashMap((prev) => ({ ...prev, [id]: false }));
      }, 1500);
    }, 2000);
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLikedMap((prev) => {
      const next = !prev[id];
      setLikeCountMap((lm) => ({
        ...lm,
        [id]: lm[id] + (next ? 1 : -1),
      }));
      return { ...prev, [id]: next };
    });
  }, []);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* ─── Top bar (floating) ─── */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 pb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('landing')}
          className="pointer-events-auto h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <span className="text-lg font-extrabold tracking-tight text-white drop-shadow-lg select-none">
          AfriSpine
        </span>

        <div className="h-10 w-10" />
      </header>

      {/* ─── Scroll-snap container ─── */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEMO_CONTENT.map((card, idx) => {
          const isActive = activeIndex === idx;
          const status = unlockMap[card.id];
          const isLocked = status === 'locked';
          const isProcessing = status === 'processing';
          const isUnlocked = status === 'unlocked' || !card.isLocked;
          const isLiked = !!likedMap[card.id];
          const likeCount = likeCountMap[card.id];

          return (
            <div
              key={card.id}
              ref={(el) => setCardRef(card.id, el)}
              data-index={idx}
              className="relative h-dvh w-full snap-start snap-always flex-shrink-0 select-none"
            >
              {/* ─── Background layer ─── */}
              <div
                className={`absolute inset-0 ${CARD_BG_ACCENTS[idx % CARD_BG_ACCENTS.length]}`}
              >
                <div
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isActive ? 'opacity-100' : 'opacity-40'
                  }`}
                  style={{
                    backgroundImage:
                      'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
                  }}
                />
              </div>

              {/* ─── Content layer ─── */}
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  {/* Avatar circle */}
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-2xl transition-transform duration-500 ${
                      isActive
                        ? 'scale-100 opacity-100'
                        : 'scale-90 opacity-60'
                    }`}
                    style={{
                      background:
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    {getInitials(card.creator)}
                  </div>

                  {/* Play icon (pulses when active) */}
                  <div
                    className={`transition-all duration-500 ${
                      isActive
                        ? 'scale-100 opacity-100'
                        : 'scale-75 opacity-30'
                    }`}
                  >
                    <div className="relative">
                      {isActive && (
                        <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
                      )}
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                        <Play
                          className={`h-7 w-7 text-white transition-transform duration-300 ${
                            isActive ? 'translate-x-0.5' : ''
                          }`}
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FREE badge for free content */}
                  {card.price === 0 && isUnlocked && (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
                      Free
                    </span>
                  )}
                </div>

                {/* ─── Bottom info bar ─── */}
                <div className="absolute inset-x-0 bottom-0 z-20">
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  <div className="relative z-10 flex items-end justify-between px-5 pb-8 pt-20">
                    {/* Left: Creator info + title */}
                    <div className="flex max-w-[70%] flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          }}
                        >
                          {getInitials(card.creator)}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {card.creator}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{card.handle}</p>

                      <h2 className="mt-1 text-base font-bold leading-snug text-white">
                        {card.title}
                      </h2>

                      {/* Description (visible when unlocked) */}
                      <p
                        className={`mt-0.5 text-xs leading-relaxed text-white/70 transition-all duration-500 ${
                          isUnlocked
                            ? 'max-h-20 opacity-100'
                            : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                      >
                        {card.description}
                      </p>

                      {/* Price tag for locked items */}
                      {isLocked && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400">
                            KES {card.price}
                          </span>
                          <Lock className="h-3.5 w-3.5 text-white/40" />
                        </div>
                      )}

                      {isUnlocked && card.price > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400">
                            Unlocked
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Action buttons column */}
                    <div className="flex flex-col items-center gap-5">
                      {/* Like button */}
                      <button
                        onClick={() => toggleLike(card.id)}
                        className="flex flex-col items-center gap-1 transition-transform duration-200 active:scale-90"
                        aria-label={
                          isLiked
                            ? `Unlike ${card.title}`
                            : `Like ${card.title}`
                        }
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <Heart
                            className={`h-6 w-6 transition-all duration-300 ${
                              isLiked ? 'scale-110' : ''
                            }`}
                            fill={isLiked ? 'currentColor' : 'none'}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white/80">
                          {formatLikes(likeCount)}
                        </span>
                      </button>

                      {/* Lock icon button (locked state only) */}
                      {isLocked && (
                        <button
                          onClick={() => handleUnlock(card.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-200 active:scale-90"
                          aria-label={`Unlock ${card.title} for KES ${card.price}`}
                        >
                          <Lock className="h-6 w-6 text-white/80" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Lock overlay ─── */}
              <div
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500 ${
                  isLocked || isProcessing
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {!isProcessing && (
                      <div className="absolute inset-0 animate-ping rounded-full bg-white/5" />
                    )}
                    <div
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                        isProcessing
                          ? 'bg-emerald-600/30'
                          : 'bg-white/10'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
                      ) : (
                        <Lock className="h-9 w-9 text-white/80" />
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-white">
                      KES {card.price}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      One-time payment
                    </p>
                  </div>

                  <Button
                    onClick={() => handleUnlock(card.id)}
                    disabled={isProcessing}
                    className={`mt-2 h-12 min-w-[220px] rounded-xl text-base font-bold shadow-lg transition-all duration-300 ${
                      isProcessing
                        ? 'bg-emerald-700 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2.5">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Unlock className="h-4 w-4" />
                        Unlock with M-Pesa
                      </span>
                    )}
                  </Button>

                  {!isProcessing && (
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
                      Instant unlock via M-Pesa
                      <br />
                      Secure &middot; Powered by Safaricom
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Unlocked success flash (auto-dismisses) ─── */}
              <div
                className={`absolute inset-0 z-20 flex items-center justify-center bg-emerald-600/20 backdrop-blur-[2px] transition-all duration-700 ${
                  flashMap[card.id]
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex flex-col items-center gap-2 animate-in fade-in duration-300">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <Unlock className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Unlocked ✓
                  </p>
                </div>
              </div>

              {/* ─── Scroll indicator (first card only) ─── */}
              {idx === 0 && activeIndex === 0 && (
                <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 flex animate-bounce">
                  <div className="h-8 w-5 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
                    <div className="h-1.5 w-1 rounded-full bg-white/60" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Scroll progress dots (right edge) ─── */}
      <div className="pointer-events-none absolute right-2 top-1/2 z-30 -translate-y-1/2 flex flex-col items-center gap-1.5">
        {DEMO_CONTENT.map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              activeIndex === idx
                ? 'h-3 w-1.5 bg-white'
                : 'h-1.5 w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
