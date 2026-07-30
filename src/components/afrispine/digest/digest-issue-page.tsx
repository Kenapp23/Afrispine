'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app';
import { DigestMagazineLayout, DigestIssueData } from './digest-magazine-layout';

const CREAM = '#FAF8F3';
const NEAR_BLACK = '#1A1008';
const AFRISPINE_GREEN = '#0A4D2E';

export function DigestIssuePage() {
  const { t } = useTranslation();
  const { navigate, viewParams } = useAppStore();
  const slug = viewParams.slug;

  const [issue, setIssue] = useState<DigestIssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    fetch(`/api/digest/issues/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.id) {
          setIssue(data);
        } else {
          setError('NOT_FOUND');
        }
      })
      .catch(() => {
        if (!cancelled) setError('NOT_FOUND');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Track impression analytics (fire-and-forget)
    fetch('/api/growth/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'digest_issue_view', metadata: { slug, source: 'web' } }),
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [slug]);

  // ── No slug ──
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-center px-4">
          <h2 className="text-xl font-serif mb-3" style={{ color: NEAR_BLACK }}>
            {t('digest.notFound', 'Issue not found')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
            {t('digest.notFoundDesc', "The issue you're looking for doesn't exist or has been removed.")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('digest-archive' as any)}
              className="text-sm underline" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
            >
              {t('digest.backToArchive', '← Back to Archive')}
            </button>
            <span className="text-xs" style={{ color: 'rgba(26, 16, 8, 0.3)' }}>|</span>
            <button
              onClick={() => navigate('landing')}
              className="text-sm underline" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
            >
              {t('digest.backHome', 'Home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: AFRISPINE_GREEN, borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
            {t('digest.loadingIssue', 'Loading issue...')}
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !issue) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-center px-4">
          <h2 className="text-xl font-serif mb-3" style={{ color: NEAR_BLACK }}>
            {t('digest.notFound', 'Issue not found')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
            {error || t('digest.notFoundDesc', 'The issue you\'re looking for doesn\'t exist or has been removed.')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('digest-archive' as any)}
              className="text-sm underline" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
            >
              {t('digest.backToArchive', '← Back to Archive')}
            </button>
            <span className="text-xs" style={{ color: 'rgba(26, 16, 8, 0.3)' }}>|</span>
            <button
              onClick={() => navigate('landing')}
              className="text-sm underline" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
            >
              {t('digest.backHome', 'Home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render magazine layout with back link ──
  return (
    <DigestMagazineLayout
      issue={issue}
      showBackLink
      backLinkView="digest-archive"
    />
  );
}