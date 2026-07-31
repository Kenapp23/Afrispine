'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Check,
  User,
  Share2,
  Twitter,
  Linkedin,
  Copy,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
interface StoryIssue {
  issueNumber: number;
  slug: string;
  issueDate: string;
}

interface RelatedStory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  section: string;
  readTime: number;
  imageUrl: string;
}

interface StoryData {
  id: string;
  slug: string;
  section: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
  bodyText: string;
  author: string;
  imageUrl: string;
  readTime: number;
  issue: StoryIssue;
  relatedStories: RelatedStory[];
}

/* ─── Section Label Helper ──────────────────────────────── */
function formatSection(section: string): string {
  return section
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ─── Fade-in wrapper ──────────────────────────────────── */
function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Share Button Component ────────────────────────────── */
function ShareButton({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: 'white', border: '1px solid #E8E2D8', color }}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════
   TASK 3 — DigestStoryPage
   ═════════════════════════════════════════════════════════════ */
export function DigestStoryPage() {
  const { t } = useTranslation();
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);

  const slug = viewParams.slug || '';
  const issueSlug = viewParams.issue || '';

  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Fetch story ── */
  const fetchStory = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    try {
      const query = issueSlug ? `?issue=${issueSlug}` : '';
      const res = await fetch(`/api/digest/stories/${slug}${query}`);
      if (!res.ok) throw new Error('Story not found');
      const data = await res.json();
      setStory(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug, issueSlug]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  /* ── Track impression on mount ── */
  useEffect(() => {
    if (!slug || !story) return;
    fetch('/api/growth/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'story_impression',
        properties: {
          slug,
          issueSlug,
          section: story.section,
          readTime: story.readTime,
        },
      }),
    }).catch(() => {});
  }, [slug, issueSlug, story]);

  /* ── Share helpers ── */
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#/digest-story?slug=${slug}&issue=${issueSlug}` : '';

  const handleShareTwitter = useCallback(() => {
    const text = story?.title || '';
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
  }, [story?.title, shareUrl]);

  const handleShareLinkedIn = useCallback(() => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }, [shareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const text = story?.title || '';
    const url = encodeURIComponent(shareUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
  }, [story?.title, shareUrl]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success(t('digest.story.linkCopied') || 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error(t('digest.story.copyFailed') || 'Failed to copy link.');
    });
  }, [shareUrl, t]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F3' }}>
        <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
          <div className="flex items-center gap-2 mb-8">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-3 w-24 mb-6 rounded" />
          <Skeleton className="h-12 w-full mb-4 rounded" />
          <Skeleton className="h-6 w-3/4 mb-6 rounded" />
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full mb-3 rounded" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F3' }}>
        <div className="text-center px-4">
          <h2 className="text-2xl font-serif font-bold mb-2" style={{ color: '#1A1008' }}>
            {t('digest.story.notFound') || 'Story Not Found'}
          </h2>
          <p className="text-sm mb-6" style={{ color: '#5A4F3C' }}>
            {t('digest.story.notFoundDesc') || 'This story could not be loaded. It may have been moved or removed.'}
          </p>
          <Button
            className="font-semibold"
            style={{ backgroundColor: '#0A4D2E', color: '#FAF8F3' }}
            onClick={() => navigate('landing')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('digest.story.goBack') || 'Go Back'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F3' }}>
      <article className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-6 sm:pt-16">
        {/* ── Back to issue ── */}
        <FadeIn>
          <button
            onClick={() => navigate('digest-issue', { slug: story.issue.slug })}
            className="flex items-center gap-2 text-xs font-medium mb-8 transition-colors hover:opacity-70"
            style={{ color: '#8B7E6A' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="tracking-wider uppercase font-semibold" style={{ color: '#0A4D2E' }}>
              The Afri Spine Digest
            </span>
            <span style={{ color: '#B8A98C' }}>·</span>
            <span>
              {t('digest.story.issue')} #{story.issue.issueNumber}
            </span>
          </button>
        </FadeIn>

        {/* ── Section label ── */}
        <FadeIn>
          <Badge
            className="mb-4 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase border-0"
            style={{ backgroundColor: 'rgba(201,152,26,0.15)', color: '#C9981A' }}
          >
            {formatSection(story.section)}
          </Badge>
        </FadeIn>

        {/* ── Headline ── */}
        <FadeIn>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-4" style={{ color: '#1A1008' }}>
            {story.title}
          </h1>
        </FadeIn>

        {/* ── Subtitle ── */}
        {story.subtitle && (
          <FadeIn>
            <p className="text-lg sm:text-xl leading-relaxed mb-6" style={{ color: '#5A4F3C' }}>
              {story.subtitle}
            </p>
          </FadeIn>
        )}

        {/* ── Meta ── */}
        <FadeIn>
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b" style={{ borderColor: '#E8E2D8' }}>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8B7E6A' }}>
              <User className="h-3.5 w-3.5" />
              {story.author}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8B7E6A' }}>
              <Clock className="h-3.5 w-3.5" />
              {story.readTime} min {t('digest.story.read') || 'read'}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8B7E6A' }}>
              <Calendar className="h-3.5 w-3.5" />
              {story.issue.issueDate}
            </div>
          </div>
        </FadeIn>

        {/* ── Hero Image ── */}
        {story.imageUrl && (
          <FadeIn>
            <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
              <img
                src={story.imageUrl}
                alt={story.title}
                className="w-full object-cover"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </FadeIn>
        )}

        {/* ── Article Body ── */}
        <FadeIn>
          <div
            className="prose prose-lg max-w-none mb-12"
            style={{ color: '#1A1008' }}
            dangerouslySetInnerHTML={{ __html: story.bodyHtml }}
          />
        </FadeIn>

        {/* ── Share Buttons ── */}
        <FadeIn>
          <div className="border-t pt-8 mb-12" style={{ borderColor: '#E8E2D8' }}>
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4" style={{ color: '#8B7E6A' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B7E6A' }}>
                {t('digest.story.share') || 'Share this story'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareButton icon={Twitter} label="X / Twitter" onClick={handleShareTwitter} color="#1A1008" />
              <ShareButton icon={MessageCircle} label="WhatsApp" onClick={handleShareWhatsApp} color="#25D366" />
              <ShareButton icon={Linkedin} label="LinkedIn" onClick={handleShareLinkedIn} color="#0A66C2" />
              <ShareButton
                icon={copied ? Check : Copy}
                label={copied ? (t('digest.story.copied') || 'Copied!') : (t('digest.story.copyLink') || 'Copy link')}
                onClick={handleCopyLink}
                color="#C9981A"
              />
            </div>
          </div>
        </FadeIn>

        {/* ── Read Full Issue Link ── */}
        <FadeIn>
          <Card className="border-0 shadow-lg overflow-hidden mb-12" style={{ backgroundColor: '#0A4D2E' }}>
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4">
              <TrendingUp className="h-8 w-8 flex-shrink-0" style={{ color: '#C9981A' }} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-medium mb-1" style={{ color: '#D0DFC8' }}>
                  {t('digest.story.enjoyingIssue') || 'Enjoying this issue?'}
                </p>
                <p className="text-xs" style={{ color: '#8BAA82' }}>
                  {t('digest.story.readFullIssue') || 'Read the full Digest for more stories, data, and insights.'}
                </p>
              </div>
              <Button
                className="flex-shrink-0 font-semibold"
                style={{ backgroundColor: '#C9981A', color: '#1A1008' }}
                onClick={() => navigate('digest-issue', { slug: story.issue.slug })}
              >
                {t('digest.story.readFullIssueCta') || 'Read the full issue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </FadeIn>

        {/* ── Related Stories ── */}
        {story.relatedStories && story.relatedStories.length > 0 && (
          <FadeIn>
            <section>
              <h2 className="text-xl font-serif font-bold mb-6" style={{ color: '#1A1008' }}>
                {t('digest.story.relatedStories') || 'More from this issue'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {story.relatedStories.map((related) => (
                  <Card
                    key={related.id}
                    className="border-0 shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg group"
                    style={{ backgroundColor: 'white' }}
                    onClick={() => navigate('digest-story', { slug: related.slug, issue: story.issue.slug })}
                  >
                    <CardContent className="p-5">
                      <Badge
                        className="mb-2 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border-0"
                        style={{ backgroundColor: 'rgba(10,77,46,0.1)', color: '#0A4D2E' }}
                      >
                        {formatSection(related.section)}
                      </Badge>
                      <h3
                        className="text-sm font-serif font-bold leading-snug mb-1.5 transition-colors group-hover:opacity-80"
                        style={{ color: '#1A1008' }}
                      >
                        {related.title}
                      </h3>
                      {related.subtitle && (
                        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#5A4F3C' }}>
                          {related.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] font-medium" style={{ color: '#8B7E6A' }}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {related.readTime} min
                        </div>
                        <span className="inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: '#C9981A' }}>
                          {t('digest.story.readMore') || 'Read'} <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* ── Bottom CTA ── */}
        <FadeIn>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" style={{ color: '#C9981A' }} />
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color: '#C9981A' }}>
                AfriSpine
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: '#5A4F3C' }}>
              {t('digest.story.bottomCta') || 'Ready to explore African markets?'}
            </p>
            <Button
              className="font-bold px-8"
              style={{ backgroundColor: '#0A4D2E', color: '#FAF8F3' }}
              onClick={() => navigate('landing')}
            >
              {t('digest.story.investWithAfriSpine') || 'Invest with AfriSpine'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      </article>
    </div>
  );
}


