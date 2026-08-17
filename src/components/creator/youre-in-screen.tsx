'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Share2, Check, Copy, Play, Lock, PartyPopper, ChevronRight, Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AfriSpineCard from './afrispine-card';

// ─── Types ───────────────────────────────────────────────────────

interface VideoInfo {
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
  creator?: {
    id: string;
    stageName: string;
    handle: string;
    avatarUrl?: string;
    verified: boolean;
    followerCount: number;
  };
  backstageVideoId?: string;
}

interface BackstageInfo {
  id: string;
  title: string;
  category: string;
  ticketPriceKes: number;
  thumbnailUrl?: string;
}

interface YoureInScreenProps {
  video: VideoInfo;
  onClose: () => void;
  onNavigateToVideo?: (videoId: string) => void;
}

// ─── Main Component ─────────────────────────────────────────────
export function YoureInScreen({ video, onClose, onNavigateToVideo }: YoureInScreenProps) {
  const [copied, setCopied] = useState(false);
  const [backstage, setBackstage] = useState<BackstageInfo | null>(null);

  // Fetch backstage info if available
  const hasBackstage = video.backstageVideoId != null;
  useEffect(() => {
    if (!hasBackstage) return;
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      try {
        const res = await fetch('/api/content/foryou');
        if (!res.ok || cancelled) return;
        const videos: any[] = await res.json();
        const bs = videos.find((v: any) => v.id === video.backstageVideoId);
        if (bs && !cancelled) {
          setBackstage({
            id: bs.id,
            title: bs.title,
            category: bs.category,
            ticketPriceKes: bs.ticketPriceKes,
            thumbnailUrl: bs.thumbnailUrl,
          });
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [hasBackstage, video.backstageVideoId]);

  const handleShare = useCallback(() => {
    const url = `https://www.afri-spine.com/w/${video.id}`;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Watch \"${video.title}\" by ${video.creator?.stageName || 'a creator'} on AfriSpine`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [video]);

  const handleCopyLink = useCallback(() => {
    const url = `https://www.afri-spine.com/w/${video.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [video.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-lg flex flex-col overflow-y-auto"
    >
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full gap-6">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <PartyPopper className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/30 animate-ping" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">You&apos;re In</h1>
          <p className="text-sm text-white/50">You have access to this show</p>
        </motion.div>

        {/* The show card — always present */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <AfriSpineCard
            mode="show"
            data={video as any}
            onShare={handleCopyLink}
          />
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 w-full"
        >
          <Button
            onClick={handleShare}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-12"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
            {copied ? 'Link Copied' : 'Share This Show'}
          </Button>
        </motion.div>

        {/* Backstage/Afterparty teaser — only if backstageVideoId exists and loaded */}
        <AnimatePresence>
          {backstage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full"
            >
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <PartyPopper className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Backstage & Afterparty</p>
                      <p className="text-xs text-white/50">{backstage.title}</p>
                      {backstage.ticketPriceKes > 0 && (
                        <p className="text-xs text-amber-400 font-semibold mt-0.5">KES {backstage.ticketPriceKes.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigateToVideo?.(backstage.id)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AfriSpine branding footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 mt-4"
        >
          <Film className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">Powered by AfriSpine</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default YoureInScreen;
