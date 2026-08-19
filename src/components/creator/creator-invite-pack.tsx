'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Twitter,
  ExternalLink,
  Link2,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CreatorInvitePackProps {
  creatorHandle: string;
  creatorName: string;
  referralCode?: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://www.afri-spine.com';

/* ── Animation Variants ──────────────────────────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const buttonTap = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.03 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

/* ── Component ────────────────────────────────────────────────── */

export function CreatorInvitePack({
  creatorHandle,
  creatorName,
  referralCode,
}: CreatorInvitePackProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const profileUrl = referralCode
    ? `${BASE_URL}/c/profile?handle=${encodeURIComponent(creatorHandle)}&ref=${encodeURIComponent(referralCode)}`
    : `${BASE_URL}/c/profile?handle=${encodeURIComponent(creatorHandle)}`;

  const shareMessage = `Check out ${creatorName} on AfriSpine \u2014 watch their latest content! ${profileUrl}`;

  /* ── Handlers ── */

  const handleWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareMessage]);

  const handleShareX = useCallback(() => {
    const text = `Check out ${creatorName} on AfriSpine \u2014 watch their latest content!`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  }, [creatorName, profileUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [profileUrl]);

  const handleCopyCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  }, [referralCode]);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-gray-100 overflow-hidden">
        {/* ── Header ── */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <Share2 className="h-4 w-4 text-emerald-600" />
              </div>
              Share Your Profile
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
            >
              <Gift className="h-3 w-3 mr-1" />
              Invite & Earn
            </Badge>
          </div>
          <CardDescription className="text-sm text-gray-500">
            Grow your audience and earn rewards \u2014 share your AfriSpine profile with one tap.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Profile URL Preview Card ── */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
                {creatorName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {creatorName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  afri-spine.com/c/{creatorHandle}
                </p>
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Truncated URL bar */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="text-xs text-gray-600 truncate flex-1 font-mono select-all">
                {profileUrl}
              </span>
            </div>
          </div>

          {/* ── Referral Code Badge ── */}
          {referralCode && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide shrink-0">
                Your Referral Code
              </span>
              <motion.button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 px-3 py-1.5 transition-colors hover:bg-emerald-100 hover:border-emerald-400"
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-sm font-bold font-mono tracking-widest text-emerald-700">
                  {referralCode.toUpperCase()}
                </span>
                {codeCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </motion.button>
            </div>
          )}

          <Separator className="bg-gray-100" />

          {/* ── Share Buttons ── */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Share via
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp */}
              <motion.div {...buttonTap}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </motion.div>

              {/* X / Twitter */}
              <motion.div {...buttonTap}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                  onClick={handleShareX}
                >
                  <Twitter className="h-4 w-4" />
                  X / Twitter
                </Button>
              </motion.div>

              {/* Copy Link */}
              <motion.div {...buttonTap}>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 transition-colors ${
                    copied
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </motion.div>
            </div>
          </div>

          <Separator className="bg-gray-100" />

          {/* ── Referral Earnings Note ── */}
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <Gift className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Earn 5% commission</span> on every unlock through your link.
              Share widely to maximize your referral earnings!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
