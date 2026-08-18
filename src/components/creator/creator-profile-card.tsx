'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Share2,
  Copy,
  Heart,
  MapPin,
  Globe,
  Music,
  Camera,
  Mic,
  Film,
  Palette,
  Radio,
  Shirt,
  Trophy,
  ChevronRight,
  QrCode,
  Instagram,
  Users,
  Eye,
  Play,
  Clock,
  Check,
  Loader2,
  Calendar,
  Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategoryGradient, formatCount, getInitials } from '@/lib/poster-utils';

// ─── Types ───────────────────────────────────────────────────────

interface CreatorProfileCardProps {
  handle: string;
  mode?: 'fan' | 'brand' | 'booking';
  viewerPhone?: string;
}

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  x?: string;
  youtube?: string;
}

interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  ticketPriceKes: number;
  viewCount: number;
  category?: string;
  durationSeconds?: number;
}

interface CreatorProfile {
  id: string;
  stageName: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  category?: string;
  location?: string;
  languages?: string;
  coverImageUrl?: string;
  availabilityStatus:
    | 'available_bookings'
    | 'open_brand_work'
    | 'not_currently_available'
    | 'not_listed';
  whatsappNumber?: string;
  socialLinks: string; // JSON
  brandPricingVisible: boolean;
  bookingInquiryEmail?: string;
  verified: boolean;
  followerCount: number;
  profilePublished: boolean;
  videoCount?: number;
  liveVideos?: VideoItem[];
}

// ─── Category icon mapping ──────────────────────────────────────
function getCategoryIcon(category?: string) {
  const cat = (category || '').toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
  const map: Record<string, React.ReactNode> = {
    music: <Music className="h-3.5 w-3.5" />,
    comedy: <Mic className="h-3.5 w-3.5" />,
    film: <Film className="h-3.5 w-3.5" />,
    fashion: <Shirt className="h-3.5 w-3.5" />,
    sports: <Trophy className="h-3.5 w-3.5" />,
    education: <Globe className="h-3.5 w-3.5" />,
    spirituality: <Radio className="h-3.5 w-3.5" />,
    food: <Palette className="h-3.5 w-3.5" />,
    beauty_lifestyle: <Camera className="h-3.5 w-3.5" />,
    news_culture: <Globe className="h-3.5 w-3.5" />,
  'beauty & lifestyle': <Camera className="h-3.5 w-3.5" />,
    'news & culture': <Globe className="h-3.5 w-3.5" />,
  };
  return map[cat] || <Film className="h-3.5 w-3.5" />;
}

// ─── Format duration helper ──────────────────────────────────────
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Round to nearest 500 ────────────────────────────────────────
function roundTo500(n: number): number {
  return Math.round(n / 500) * 500;
}

// ─── Framer variants ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function CreatorProfileCard({
  handle,
  mode = 'fan',
  viewerPhone,
}: CreatorProfileCardProps) {
  // ─── State ───────────────────────────────────────────────────
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Share sheet
  const [shareOpen, setShareOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Brand inquiry dialog
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brandSubmitting, setBrandSubmitting] = useState(false);
  const [brandForm, setBrandForm] = useState({
    brandName: '',
    contactEmail: '',
    message: '',
  });

  // Booking inquiry dialog
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventType: '',
    roughDate: '',
    contactEmail: '',
    contactName: '',
    message: '',
  });

  const shareUrl = `https://afrispine.com/c/${handle}`;

  // ─── Parse social links ──────────────────────────────────────
  const socialLinks: SocialLinks = useMemo(() => {
    if (!profile?.socialLinks) return {};
    try {
      return JSON.parse(profile.socialLinks);
    } catch {
      return {};
    }
  }, [profile?.socialLinks]);

  // ─── QR code generation ───────────────────────────────────────
  useEffect(() => {
    if (!shareOpen) return;
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#ffffff', light: '#09090b' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [shareOpen, shareUrl]);

  // ─── Fetch profile ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/creator/profile?handle=${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Profile not found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fire analytics
    if (profile) {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'profile_viewed',
          actorType: 'viewer',
          actorId: 'anonymous',
          targetType: 'creator',
          targetId: profile.id,
        }),
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [handle]);

  // Fire analytics on mount (separate effect to ensure profile is loaded)
  useEffect(() => {
    if (!profile) return;
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'profile_viewed',
        actorType: 'viewer',
        actorId: 'anonymous',
        targetType: 'creator',
        targetId: profile.id,
      }),
    }).catch(() => {});
  }, [profile?.id]);

  // ─── Follow handler ──────────────────────────────────────────
  const handleFollow = useCallback(async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await fetch('/api/content/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: profile.id,
          viewerPhone: viewerPhone || '',
        }),
      });
      setIsFollowing((prev) => !prev);
      if (!isFollowing) {
        toast.success(`Now following ${profile.stageName}`);
        // Fire analytics
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'creator_followed',
            actorType: 'viewer',
            actorId: viewerPhone || 'anonymous',
            targetType: 'creator',
            targetId: profile.id,
          }),
        }).catch(() => {});
      }
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  }, [profile, viewerPhone, isFollowing]);

  // ─── Share handler ───────────────────────────────────────────
  const handleShareClick = useCallback(() => {
    setShareOpen(true);
    // Fire analytics
    if (profile) {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'profile_shared',
          actorType: 'viewer',
          actorId: 'anonymous',
          targetType: 'creator',
          targetId: profile.id,
        }),
      }).catch(() => {});
    }
  }, [profile]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [shareUrl]);

  // ─── Brand inquiry submit ────────────────────────────────────
  const handleBrandSubmit = useCallback(async () => {
    if (!profile) return;
    if (!brandForm.brandName || !brandForm.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    setBrandSubmitting(true);
    try {
      const res = await fetch('/api/creator/brand-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: profile.id,
          ...brandForm,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Brand inquiry sent successfully!');
      setBrandDialogOpen(false);
      setBrandForm({ brandName: '', contactEmail: '', message: '' });
    } catch {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setBrandSubmitting(false);
    }
  }, [profile, brandForm]);

  // ─── Booking inquiry submit ───────────────────────────────────
  const handleBookingSubmit = useCallback(async () => {
    if (!profile) return;
    if (!bookingForm.eventType || !bookingForm.roughDate || !bookingForm.contactEmail || !bookingForm.contactName) {
      toast.error('Please fill in all required fields');
      return;
    }
    setBookingSubmitting(true);
    try {
      const res = await fetch('/api/creator/booking-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: profile.id,
          ...bookingForm,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Booking request sent successfully!');
      setBookingDialogOpen(false);
      setBookingForm({ eventType: '', roughDate: '', contactEmail: '', contactName: '', message: '' });
    } catch {
      toast.error('Failed to send booking request. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  }, [profile, bookingForm]);

  // ─── Pricing computation ──────────────────────────────────────
  const pricingRange = useMemo(() => {
    if (!profile?.brandPricingVisible || !profile.followerCount) return null;
    const low = roundTo500(Math.max(2000, profile.followerCount * 10));
    const high = roundTo500(low * 1.6);
    return { low, high };
  }, [profile?.brandPricingVisible, profile?.followerCount]);

  // ─── Availability badge ───────────────────────────────────────
  const availabilityBadge = useMemo(() => {
    if (!profile || profile.availabilityStatus === 'not_listed') return null;
    const map: Record<string, { label: string; color: string; bg: string }> = {
      available_bookings: {
        label: 'Available for Bookings',
        color: 'text-emerald-300',
        bg: 'bg-emerald-500/15 border-emerald-500/30',
      },
      open_brand_work: {
        label: 'Open to Brand Work',
        color: 'text-amber-300',
        bg: 'bg-amber-500/15 border-amber-500/30',
      },
      not_currently_available: {
        label: 'Not Currently Available',
        color: 'text-red-300',
        bg: 'bg-red-500/15 border-red-500/30',
      },
    };
    return map[profile.availabilityStatus] || null;
  }, [profile]);

  // ─── Loading skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        {/* Cover skeleton */}
        <Skeleton className="w-full h-48 bg-zinc-800" />
        <div className="px-4 -mt-12">
          <Skeleton className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-950" />
        </div>
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-7 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-16 w-full bg-zinc-800" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 bg-zinc-800" />
            <Skeleton className="h-10 w-28 bg-zinc-800" />
            <Skeleton className="h-10 w-28 bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Film className="h-12 w-12 text-zinc-700 mx-auto" />
          <h2 className="text-lg font-semibold text-white">Creator not found</h2>
          <p className="text-sm text-zinc-500">This profile may not exist or is not published.</p>
        </div>
      </div>
    );
  }

  // ─── Share text ──────────────────────────────────────────────
  const shareText = `Check out ${profile.stageName} on AfriSpine!`;

  const coverGradient = getCategoryGradient(profile.category);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ─── Cover Section ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-52 sm:h-64 overflow-hidden"
      >
        {profile.coverImageUrl ? (
          <Image
            src={profile.coverImageUrl}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: coverGradient }}
          />
        )}
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </motion.div>

      {/* ─── Profile Header ───────────────────────────────────── */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative px-4 -mt-14 sm:px-6"
      >
        {/* Avatar */}
        <div className="relative inline-block">
          <div className="h-28 w-28 rounded-full overflow-hidden ring-[3px] ring-emerald-500 shadow-xl shadow-emerald-500/20">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.stageName}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: coverGradient }}
              >
                {getInitials(profile.stageName)}
              </div>
            )}
          </div>
          {profile.verified && (
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center border-[3px] border-zinc-950">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Name + Info ──────────────────────────────────────── */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="px-4 pt-3 sm:px-6 space-y-2"
      >
        {/* Stage name row */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {profile.stageName}
          </h1>
        </div>

        {/* Handle + category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-400">@{profile.handle}</span>
          {profile.category && (
            <Badge
              className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700 text-xs"
            >
              {getCategoryIcon(profile.category)}
              {profile.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          )}
        </div>

        {/* Location + languages + followers */}
        <div className="flex items-center gap-3 flex-wrap text-sm text-zinc-500">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
          )}
          {profile.languages && (
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {profile.languages}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatCount(profile.followerCount)} followers
          </span>
        </div>
      </motion.div>

      {/* ─── Bio ──────────────────────────────────────────────── */}
      {profile.bio && (
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="px-4 pt-3 sm:px-6"
        >
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        </motion.div>
      )}

      {/* ─── Social Links ─────────────────────────────────────── */}
      {(socialLinks.instagram || socialLinks.tiktok || socialLinks.x || socialLinks.youtube || profile.whatsappNumber) && (
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="px-4 pt-4 sm:px-6"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {socialLinks.tiktok && (
              <a
                href={socialLinks.tiktok.startsWith('http') ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                aria-label="TikTok"
              >
                <Music className="h-4 w-4" />
              </a>
            )}
            {socialLinks.x && (
              <a
                href={socialLinks.x.startsWith('http') ? socialLinks.x : `https://x.com/${socialLinks.x.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                aria-label="X / Twitter"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            {socialLinks.youtube && (
              <a
                href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/@${socialLinks.youtube.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                aria-label="YouTube"
              >
                <Play className="h-4 w-4" />
              </a>
            )}
            {profile.whatsappNumber && (
              <a
                href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Action Buttons ───────────────────────────────────── */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="px-4 pt-4 sm:px-6"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleFollow}
            disabled={followLoading}
            className={
              isFollowing
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white font-semibold'
            }
            variant={isFollowing ? 'outline' : 'default'}
          >
            {followLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {isFollowing ? 'Following' : 'Follow'}
          </Button>

          <Button
            onClick={handleShareClick}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            onClick={() => toast.info('Coming soon — tip support is on the way!', { duration: 3000 })}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Heart className="h-4 w-4" />
            Support
          </Button>
        </div>
      </motion.div>

      {/* ─── Availability Badge (Fan mode) ────────────────────── */}
      {mode === 'fan' && availabilityBadge && (
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="px-4 pt-4 sm:px-6"
        >
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${availabilityBadge.bg} ${availabilityBadge.color}`}
          >
            <Clock className="h-3 w-3" />
            {availabilityBadge.label}
          </span>
        </motion.div>
      )}

      <Separator className="bg-zinc-800/50 my-5" />

      {/* ═══════════════════════════════════════════════════════════
          BRAND MODE ADDITIONS
          ═══════════════════════════════════════════════════════════ */}
      {mode === 'brand' && (
        <>
          {/* Availability — prominent in brand mode */}
          {availabilityBadge && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 sm:px-6"
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${availabilityBadge.bg} ${availabilityBadge.color}`}
              >
                <Clock className="h-3 w-3" />
                {availabilityBadge.label}
              </span>
            </motion.div>
          )}

          {/* Brand Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
            className="px-4 pt-4 sm:px-6"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Brand Information
              </h3>

              {/* Category + Brand-safe */}
              <div className="flex items-center gap-3 flex-wrap">
                {profile.category && (
                  <Badge className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700">
                    {getCategoryIcon(profile.category)}
                    {profile.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                )}
                <Badge
                  className={
                    profile.verified
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }
                >
                  <CheckCircle className="h-3 w-3" />
                  {profile.verified ? 'Brand-Safe' : 'Not Verified'}
                </Badge>
              </div>

              {/* Engagement Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                    <Users className="h-3 w-3" />
                    Followers
                  </div>
                  <p className="text-lg font-bold text-white">
                    {formatCount(profile.followerCount)}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-1">
                    <Film className="h-3 w-3" />
                    Videos
                  </div>
                  <p className="text-lg font-bold text-white">
                    {profile.videoCount ?? profile.liveVideos?.length ?? 0}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-2">
                {pricingRange ? (
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Estimated per placement</p>
                    <p className="text-lg font-bold text-emerald-400">
                      KES {pricingRange.low.toLocaleString()}–{pricingRange.high.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-sm text-zinc-400">
                      Contact for pricing
                    </p>
                  </div>
                )}
              </div>

              {/* Inquire button */}
              <Button
                onClick={() => setBrandDialogOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold h-11"
              >
                <MessageCircle className="h-4 w-4" />
                Inquire About Brand Collaboration
              </Button>
            </div>
          </motion.div>

          <Separator className="bg-zinc-800/50 my-5" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BOOKING MODE ADDITIONS
          ═══════════════════════════════════════════════════════════ */}
      {mode === 'booking' && (
        <>
          {/* Availability — prominent in booking mode */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 sm:px-6"
          >
            {availabilityBadge ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    profile.availabilityStatus === 'available_bookings'
                      ? 'bg-emerald-500/15'
                      : profile.availabilityStatus === 'open_brand_work'
                        ? 'bg-amber-500/15'
                        : 'bg-red-500/15'
                  }`}
                >
                  <Clock
                    className={`h-5 w-5 ${
                      profile.availabilityStatus === 'available_bookings'
                        ? 'text-emerald-400'
                        : profile.availabilityStatus === 'open_brand_work'
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {availabilityBadge.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {profile.bookingInquiryEmail
                      ? `Bookings via ${profile.bookingInquiryEmail}`
                      : 'Use the form below to inquire'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className="text-sm text-zinc-500">Availability not listed</p>
              </div>
            )}
          </motion.div>

          {/* Request Booking button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
            className="px-4 pt-4 sm:px-6"
          >
            <Button
              onClick={() => setBookingDialogOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold h-11"
            >
              <Calendar className="h-4 w-4" />
              Request Booking
            </Button>
          </motion.div>

          <Separator className="bg-zinc-800/50 my-5" />
        </>
      )}

      {/* ─── Videos Grid ──────────────────────────────────────── */}
      {profile.liveVideos && profile.liveVideos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="px-4 sm:px-6 pb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Videos</h2>
            <span className="text-xs text-zinc-500">
              {profile.liveVideos.length} video{profile.liveVideos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {profile.liveVideos.map((video, idx) => (
              <motion.a
                key={video.id}
                href={`#/w/${video.id}`}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                  {/* Thumbnail */}
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: getCategoryGradient(video.category) }}
                    />
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  {/* Duration badge */}
                  {video.durationSeconds && video.durationSeconds > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-mono text-white/80">
                        {formatDuration(video.durationSeconds)}
                      </span>
                    </div>
                  )}

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-1.5">
                      {video.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/60">
                        <Eye className="h-3 w-3" />
                        <span className="text-[10px]">{formatCount(video.viewCount)}</span>
                      </div>
                      {video.ticketPriceKes > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          KES {video.ticketPriceKes.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── No videos fallback ───────────────────────────────── */}
      {(!profile.liveVideos || profile.liveVideos.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="px-4 sm:px-6 pb-8"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <Film className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No videos yet</p>
            <p className="text-xs text-zinc-600 mt-1">Check back soon for new content</p>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SHARE SHEET
          ═══════════════════════════════════════════════════════════ */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-center">
            <SheetTitle className="text-white text-lg">Share Profile</SheetTitle>
            <SheetDescription className="text-zinc-500">
              Share {profile.stageName}'s AfriSpine profile
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              {qrDataUrl && (
                <div className="bg-white rounded-xl p-3">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              )}
              {!qrDataUrl && (
                <div className="w-[212px] h-[212px] bg-zinc-900 rounded-xl flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-zinc-700" />
                </div>
              )}
              <p className="text-xs text-zinc-500">Scan to view profile</p>
            </div>

            {/* Share buttons grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">WhatsApp</p>
                  <p className="text-xs text-zinc-500">Send a message</p>
                </div>
              </a>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  {linkCopied ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Copy className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {linkCopied ? 'Copied!' : 'Copy Link'}
                  </p>
                  <p className="text-xs text-zinc-500">Copy to clipboard</p>
                </div>
              </button>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">X / Twitter</p>
                  <p className="text-xs text-zinc-500">Post a tweet</p>
                </div>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Facebook</p>
                  <p className="text-xs text-zinc-500">Share to timeline</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Email</p>
                  <p className="text-xs text-zinc-500">Send via email</p>
                </div>
              </a>
            </div>

            {/* Profile URL display */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-500 truncate flex-1 font-mono">
                {shareUrl}
              </p>
              <button
                onClick={handleCopyLink}
                className="text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
                aria-label="Copy URL"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════
          BRAND INQUIRY DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Brand Inquiry</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Tell {profile.stageName} about your brand collaboration interest.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="brand-name">
                Brand Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="brand-name"
                placeholder="Your brand or company name"
                value={brandForm.brandName}
                onChange={(e) => setBrandForm((f) => ({ ...f, brandName: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="brand-email">
                Contact Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="brand-email"
                type="email"
                placeholder="you@brand.com"
                value={brandForm.contactEmail}
                onChange={(e) => setBrandForm((f) => ({ ...f, contactEmail: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="brand-message">
                What are you interested in?
              </Label>
              <Textarea
                id="brand-message"
                placeholder="Describe the collaboration you have in mind..."
                rows={4}
                value={brandForm.message}
                onChange={(e) => setBrandForm((f) => ({ ...f, message: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setBrandDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBrandSubmit}
              disabled={brandSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
            >
              {brandSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Send Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          BOOKING INQUIRY DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Request Booking</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Request a booking with {profile.stageName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="event-type">
                Event Type <span className="text-red-400">*</span>
              </Label>
              <Select
                value={bookingForm.eventType}
                onValueChange={(val) => setBookingForm((f) => ({ ...f, eventType: val }))}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="Performance" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Performance</SelectItem>
                  <SelectItem value="Appearance" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Appearance</SelectItem>
                  <SelectItem value="Voiceover" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Voiceover</SelectItem>
                  <SelectItem value="Filming" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Filming</SelectItem>
                  <SelectItem value="Digital" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Digital</SelectItem>
                  <SelectItem value="Other" className="text-zinc-300 focus:bg-zinc-800 focus:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="rough-date">
                Rough Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="rough-date"
                type="date"
                value={bookingForm.roughDate}
                onChange={(e) => setBookingForm((f) => ({ ...f, roughDate: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="booking-email">
                Contact Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="booking-email"
                type="email"
                placeholder="you@email.com"
                value={bookingForm.contactEmail}
                onChange={(e) => setBookingForm((f) => ({ ...f, contactEmail: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="booking-name">
                Your Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="booking-name"
                placeholder="Your full name"
                value={bookingForm.contactName}
                onChange={(e) => setBookingForm((f) => ({ ...f, contactName: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm" htmlFor="booking-message">
                Message
              </Label>
              <Textarea
                id="booking-message"
                placeholder="Any additional details about the event..."
                rows={3}
                value={bookingForm.message}
                onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={bookingSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
            >
              {bookingSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
