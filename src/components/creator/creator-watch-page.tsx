'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';
import {
  Unlock, Heart, Play, ArrowLeft, Loader2, MessageCircle,
  Share2, Search, BadgeCheck, X, Send, Copy, Check, VolumeX, Volume2,
  ChevronRight, Users, Eye,
} from 'lucide-react';

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

// ─── Types ───────────────────────────────────────────────────────
interface VideoCreator {
  stageName: string; handle: string; avatarUrl?: string;
  verified: boolean; followerCount: number; id?: string;
}

interface VideoItem {
  id: string; title: string; description?: string; category: string;
  ticketPriceKes: number; thumbnailUrl?: string; durationSeconds?: number;
  cfPreviewStreamId?: string; cfPremiumStreamId?: string;
  viewCount: number; likeCount: number; shareCount: number;
  status: string; createdAt: string; creatorId?: string;
  creator: VideoCreator;
}

type UnlockStatus = 'locked' | 'processing' | 'unlocked';

// ─── Fallback demo content (used when API is unreachable) ───────
const DEMO_CONTENT: VideoItem[] = [
  { id: 'demo1', title: 'Behind the Scenes: My Nairobi Fashion Shoot', description: 'Exclusive BTS from my latest collaboration with a top Kenyan designer.', category: 'fashion', ticketPriceKes: 100, viewCount: 2340, likeCount: 890, shareCount: 120, status: 'live', createdAt: new Date().toISOString(), creator: { stageName: 'Wanjiku Kariuki', handle: '@wanjiku_creates', verified: true, followerCount: 45000, id: 'c1' } },
  { id: 'demo2', title: 'How I Produce a Track in 30 Minutes', description: 'My full production workflow from sample selection to final mix.', category: 'music', ticketPriceKes: 150, viewCount: 5100, likeCount: 2100, shareCount: 340, status: 'live', createdAt: new Date().toISOString(), creator: { stageName: 'DJ Muthoni', handle: '@dj_muthoni', verified: true, followerCount: 82000, id: 'c2' } },
  { id: 'demo3', title: 'Nyama Choma: The Perfect Recipe', description: 'The recipe that got me 100K followers.', category: 'food', ticketPriceKes: 0, viewCount: 12000, likeCount: 5600, shareCount: 890, status: 'live', createdAt: new Date().toISOString(), creator: { stageName: 'Chef Otieno', handle: '@chef_otieno', verified: false, followerCount: 105000, id: 'c3' } },
  { id: 'demo4', title: '30-Day Transformation Guide', description: 'The exact workout and meal plan I used.', category: 'sports', ticketPriceKes: 200, viewCount: 8900, likeCount: 3200, shareCount: 560, status: 'live', createdAt: new Date().toISOString(), creator: { stageName: 'Amina Daudi', handle: '@amina_fitness', verified: true, followerCount: 67000, id: 'c4' } },
  { id: 'demo5', title: 'How I Write Skits That Go Viral', description: 'My creative process, from idea to 1M views.', category: 'comedy', ticketPriceKes: 50, viewCount: 45000, likeCount: 18000, shareCount: 3200, status: 'live', createdAt: new Date().toISOString(), creator: { stageName: 'Bryan Mwangi', handle: '@bryan_comedy', verified: true, followerCount: 340000, id: 'c5' } },
];

// ─── Helpers ─────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// ─── Skeleton Card ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="relative h-dvh w-full snap-start snap-always flex-shrink-0 bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-24 w-24 rounded-full bg-gray-800" />
        <div className="h-4 w-48 rounded bg-gray-800" />
        <div className="h-3 w-32 rounded bg-gray-800" />
      </div>
    </div>
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

  // ─── Refs ───
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // ─── Filtered videos ───
  const displayVideos = searchResults ?? (
    activeCategory === 'All' ? videos : videos.filter(v => v.category.toLowerCase().replace(' ', '_') === activeCategory.toLowerCase() || v.category.toLowerCase() === activeCategory.toLowerCase())
  );

  // ─── Fetch feed on mount ───
  useEffect(() => {
    // Capture referral code from URL hash (e.g. #watch?ref=REF_xxx)
    try {
      const hash = window.location.hash;
      const refMatch = hash.match(/[?&]ref=([^&]+)/);
      if (refMatch?.[1]) setActiveReferralCode(refMatch[1]);
    } catch {}

    (async () => {
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
          }
        }
      } catch { /* fallback to demo */ }
      // Fallback to demo
      if (videos.length === 0) {
        setVideos(DEMO_CONTENT);
        const lm: Record<string, number> = {};
        const um: Record<string, UnlockStatus> = {};
        for (const v of DEMO_CONTENT) {
          lm[v.id] = v.likeCount;
          um[v.id] = v.ticketPriceKes === 0 ? 'unlocked' : 'locked';
        }
        setLikeCountMap(lm);
        setUnlockMap(um);
      }
      setLoading(false);
    })();
  }, []);

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
            setUnlockMap(p => ({ ...p, [videoId]: 'unlocked' }));
            setFlashMap(p => ({ ...p, [videoId]: true }));
            setTimeout(() => setFlashMap(p => ({ ...p, [videoId]: false })), 1500);
            setUnlockModalVideoId(null);
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

  // ─── Render ───
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* Inline keyframes for shimmer + heartBurst */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heartBurst {
          0% { transform: scale(0.5); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
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
          <>{[0, 1, 2].map(i => <SkeletonCard key={i} />)}</>
        ) : displayVideos.length === 0 ? (
          <div className="h-dvh flex items-center justify-center text-white/50 text-sm">No videos found</div>
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
            // Use preview stream always; swap to premium when unlocked
            const streamId = isUnlocked && video.cfPremiumStreamId ? video.cfPremiumStreamId : video.cfPreviewStreamId;

            return (
              <div key={video.id} ref={el => setCardRef(video.id, el)} data-index={idx}
                className="relative h-dvh w-full snap-start snap-always flex-shrink-0 select-none"
                onClick={e => handleCardTap(video.id, e)}>

                {/* ─── z-0: Thumbnail (shown until video is ready) ─── */}
                {video.thumbnailUrl && (
                  <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}>
                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" priority={idx < 2} />
                  </div>
                )}

                {/* ─── z-0: Video element (trailer or premium) ─── */}
                {streamId && (
                  <video
                    ref={el => {
                      if (el) {
                        videoRefs.current.set(video.id, el);
                        // Progressive reveal: once video can play, fade it in
                        if (!videoReadyMap[video.id]) {
                          const onReady = () => {
                            setVideoReadyMap(p => ({ ...p, [video.id]: true }));
                            el.removeEventListener('canplay', onReady);
                          };
                          el.addEventListener('canplay', onReady);
                        }
                      } else { videoRefs.current.delete(video.id); }
                    }}
                    muted={isMuted} playsInline loop
                    className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    src={`https://customer-c4f5c4f4.cloudflarestream.com/${streamId}/manifest/video.m3u8`} />
                )}

                {/* ─── z-10: Ambient gradient overlay (decorative, no pointer events) ───*/}
                <div className={`absolute inset-0 z-10 pointer-events-none bg-gradient-to-br ${gradientColor} to-gray-950/80`}>
                  <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
                </div>

                {/* ─── z-20: Bottom info bar + action rail ─── */}
                <div className="absolute inset-x-0 bottom-0 z-20" onClick={e => e.stopPropagation()}>
                  {/* Scrim gradient */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  <div className="relative flex items-end justify-between px-5 pb-6 pt-24">
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

                      {/* Social proof line */}
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <Users className="h-3 w-3" />{formatCount(video.creator.followerCount)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <Eye className="h-3 w-3" />{formatCount(video.viewCount)} views
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="mt-1.5 text-base font-bold leading-snug text-white">{video.title}</h2>

                      {/* Description (only when unlocked) */}
                      <p className={`mt-0.5 text-xs leading-relaxed text-white/70 transition-all duration-500 ${isUnlocked ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>{video.description}</p>

                      {/* ─── Compact unlock bar (z-20, always visible for locked videos) ───*/}
                      {isLocked && (
                        <button
                          onClick={() => { setUnlockModalVideoId(video.id); setPhoneInput('254'); setCheckoutError(''); }}
                          className="mt-2.5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-left transition-all duration-200 active:scale-[0.97]"
                          style={{
                            background: 'linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.25) 50%, rgba(16,185,129,0.15) 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 3s ease-in-out infinite',
                            border: '1px solid rgba(16,185,129,0.3)',
                          }}
                        >
                          <span className="rounded-lg bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">KES {video.ticketPriceKes}</span>
                          <span className="text-xs font-medium text-emerald-300">Unlock full video</span>
                          <ChevronRight className="h-4 w-4 text-emerald-400/70" />
                        </button>
                      )}

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
                </div>

                {/* ─── z-30: Mute toggle ───*/}
                {streamId && (
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

      {/* ─── z-30: Scroll progress dots ───*/}
      <div className="pointer-events-none absolute right-2 top-1/2 z-30 -translate-y-1/2 flex flex-col items-center gap-1.5">
        {displayVideos.map((_, idx) => (
          <div key={idx} className={`rounded-full transition-all duration-300 ${activeIndex === idx ? 'h-3 w-1.5 bg-white' : 'h-1.5 w-1.5 bg-white/30'}`} />
        ))}
      </div>

      {/* ═══════ z-50: MODALS (nothing below this blocks the screen) ═══════ */}

      {/* ─── z-50: Phone Input Modal ───*/}
      {unlockModalVideoId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setUnlockModalVideoId(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-gray-900 p-6 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
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

    </div>
  );
}
