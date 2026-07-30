'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app';

const CREAM = '#FAF8F3';
const NEAR_BLACK = '#1A1008';
const AFRISPINE_GREEN = '#0A4D2E';
const GOLD = '#C9981A';

interface ArchiveIssue {
  id: string;
  issueNumber: number;
  slug: string;
  issueDate: string;
  status: string;
  coverHeadline: string;
  coverImageUrl: string;
  stories: { title: string; section: string }[];
}

export function DigestArchivePage() {
  const { t } = useTranslation();
  const { navigate } = useAppStore();
  const [issues, setIssues] = useState<ArchiveIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeYear, setActiveYear] = useState<string>('all');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  useEffect(() => {
    fetch('/api/digest/issues?status=published')
      .then((res) => res.json())
      .then((data) => {
        setIssues(Array.isArray(data) ? data : (data.issues || []));
        setLoading(false);
      })
      .catch(() => {
        setError(t('digest.loadError', 'Failed to load archive.'));
        setLoading(false);
      });
  }, []);

  // Compute available years
  const years = useMemo(() => {
    const set = new Set(issues.map((i) => new Date(i.issueDate).getFullYear().toString()));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [issues]);

  // Filter by year
  const filteredIssues = useMemo(() => {
    if (activeYear === 'all') return issues;
    return issues.filter((i) => new Date(i.issueDate).getFullYear().toString() === activeYear);
  }, [issues, activeYear]);

  // Handle subscribe
  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubError(t('digest.invalidEmail', 'Please enter a valid email address'));
      return;
    }
    setSubscribing(true);
    setSubError('');
    try {
      const res = await fetch('/api/digest/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency: 'weekly', marketFocus: 'all' }),
      });
      if (res.ok) {
        setSubscribed(true);
      } else {
        const data = await res.json();
        setSubError(data.error || t('digest.subscribeError', 'Subscription failed.'));
      }
    } catch {
      setSubError(t('digest.subscribeError', 'Something went wrong.'));
    } finally {
      setSubscribing(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: AFRISPINE_GREEN, borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
            {t('digest.loadingArchive', 'Loading archive...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM, color: NEAR_BLACK }}>
      {/* ── Header ── */}
      <header className="pt-12 pb-8 px-4" style={{ borderBottom: '1px solid rgba(201, 152, 26, 0.2)' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <h1
            className="text-sm md:text-base font-bold tracking-[0.3em] uppercase mb-1"
            style={{ color: GOLD, fontFamily: 'sans-serif' }}
          >
            THE AFRI SPINE DIGEST ARCHIVE
          </h1>
          <p className="text-xs italic" style={{ color: 'rgba(26, 16, 8, 0.45)', fontFamily: 'sans-serif' }}>
            Africa's pulse. Your portfolio. Every week.
          </p>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 md:px-8 py-12">
        {/* ── Navigation ── */}
        <nav className="flex items-center justify-center gap-6 mb-10">
          <button
            onClick={() => navigate('digest-current' as any)}
            className="text-xs uppercase tracking-widest transition-colors duration-200 hover:opacity-60"
            style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
          >
            {t('digest.latestIssue', 'Latest Issue')}
          </button>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: GOLD }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(26, 16, 8, 0.3)', fontFamily: 'sans-serif' }}>
            {t('digest.archive', 'Archive')}
          </span>
        </nav>

        {error && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.6)', fontFamily: 'sans-serif' }}>{error}</p>
          </div>
        )}

        {/* ── Year filter pills ── */}
        {years.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            <button
              onClick={() => setActiveYear('all')}
              className="px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200"
              style={{
                backgroundColor: activeYear === 'all' ? AFRISPINE_GREEN : 'rgba(26, 16, 8, 0.05)',
                color: activeYear === 'all' ? 'white' : 'rgba(26, 16, 8, 0.6)',
                fontFamily: 'sans-serif',
              }}
            >
              {t('digest.allYears', 'All')}
            </button>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setActiveYear(year)}
                className="px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200"
                style={{
                  backgroundColor: activeYear === year ? AFRISPINE_GREEN : 'rgba(26, 16, 8, 0.05)',
                  color: activeYear === year ? 'white' : 'rgba(26, 16, 8, 0.6)',
                  fontFamily: 'sans-serif',
                }}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {filteredIssues.length === 0 && !error && (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(201, 152, 26, 0.1)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif mb-2" style={{ color: NEAR_BLACK }}>
              {t('digest.noIssues', 'No issues yet')}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(26, 16, 8, 0.5)', fontFamily: 'sans-serif' }}>
              {t('digest.noIssuesDesc', 'The first issue of the AfriSpine Digest is being prepared.')}
            </p>
          </div>
        )}

        {/* ── Issues Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => navigate('digest-issue' as any, { slug: issue.slug })}
            />
          ))}
        </div>
      </main>

      {/* ── Subscribe CTA ── */}
      <div className="py-16 md:py-24 px-4" style={{ borderTop: '1px solid rgba(201, 152, 26, 0.15)' }}>
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-xl font-serif mb-2" style={{ color: NEAR_BLACK }}>
            {t('digest.neverMissAnIssue', 'Never miss an issue')}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(26, 16, 8, 0.55)', fontFamily: 'sans-serif' }}>
            {t('digest.subscribeDesc', 'Get the AfriSpine Digest delivered to your inbox every week. Free.')}
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {t('digest.subscribed', 'You\'re subscribed!')}
            </div>
          ) : (
            <>
              <form onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('digest.emailPlaceholder', 'your@email.com')}
                  className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(26, 16, 8, 0.12)',
                    color: NEAR_BLACK,
                    fontFamily: 'sans-serif',
                  }}
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: AFRISPINE_GREEN, fontFamily: 'sans-serif' }}
                >
                  {subscribing ? '...' : t('digest.subscribeFree', 'Subscribe Free')}
                </button>
              </form>
              {subError && <p className="mt-2 text-xs" style={{ color: '#dc2626', fontFamily: 'sans-serif' }}>{subError}</p>}
            </>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid rgba(201, 152, 26, 0.1)' }}>
        <p className="text-xs" style={{ color: 'rgba(26, 16, 8, 0.35)', fontFamily: 'sans-serif' }}>
          © {new Date().getFullYear()} {t('digest.publishedBy', 'Published by AfriSpine Ltd')}
        </p>
      </footer>
    </div>
  );
}

// ─── Issue Card ───────────────────────────────────────────────

function IssueCard({ issue, onClick }: { issue: ArchiveIssue; onClick: () => void }) {
  const formattedDate = new Date(issue.issueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Get cover story preview
  const coverStory = (issue.stories || []).find((s) => s.section === 'cover_story');
  const previewText = coverStory
    ? (issue.coverHeadline || coverStory.title)
    : issue.coverHeadline || `Issue #${issue.issueNumber}`;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
      style={{
        backgroundColor: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(26, 16, 8, 0.06)',
      }}
    >
      {/* Cover area */}
      <div
        className="aspect-[16/9] flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${AFRISPINE_GREEN}, #0d6b3f)` }}
      >
        {issue.coverImageUrl ? (
          <img
            src={issue.coverImageUrl}
            alt={previewText}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-white/15 text-5xl font-serif select-none">#{issue.issueNumber}</span>
        )}
        {/* Issue number badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: GOLD, fontFamily: 'sans-serif', backdropFilter: 'blur(4px)' }}
        >
          #{issue.issueNumber}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-serif text-base leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-emerald-800"
          style={{ color: NEAR_BLACK }}
        >
          {previewText}
        </h3>
        <p className="text-xs" style={{ color: 'rgba(26, 16, 8, 0.45)', fontFamily: 'sans-serif' }}>
          {formattedDate}
        </p>
      </div>
    </button>
  );
}