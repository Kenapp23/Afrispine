'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

interface Story { id: string; slug: string; section: string; title: string; subtitle: string; bodyHtml: string; author: string; imageUrl: string; readTime: number; meta: string; }
interface Sponsor { id: string; sponsorName: string; sponsorLogoUrl: string; adHeadline: string; adBody: string; adCtaText: string; adCtaUrl: string; }
export interface DigestIssueData { id: string; issueNumber: number; slug: string; issueDate: string; status: string; coverHeadline: string; coverImageUrl: string; podcastUrl: string; stories: Story[]; sponsorSlots: Sponsor[]; }
interface Props { issue: DigestIssueData; showBackLink?: boolean; backLinkView?: string; }

const GOLD = '#C9981A', GREEN = '#0A4D2E', DARK = '#1A1008', CREAM = '#FAF8F3', DIVIDER = '#E5E0D8';
const S = ({ label, className = '' }: { label: string; className?: string }) => (
  <div className={`mb-4 ${className}`}>
    <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: GOLD }}>{label}</span>
    <div className="h-px mt-1.5 w-12" style={{ background: GOLD }} />
  </div>
);

const SECTIONS = [
  { key: 'cover-story', label: 'Cover Story' }, { key: 'market-pulse', label: 'Market Pulse' },
  { key: 'company-spotlight', label: 'Company Spotlight' }, { key: 'opportunity', label: 'Opportunity' },
  { key: 'diaspora-story', label: 'Diaspora Money' }, { key: 'podcast', label: 'Podcast' },
];

function ShareButtons() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  const url = globalThis.location?.href || '';
  const items = [
    { label: '𝕏', onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank') },
    { label: 'in', onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank') },
    { label: '💬', onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank') },
    { label: '🔗', onClick: () => { navigator.clipboard.writeText(url); } },
  ];
  return (
    <div ref={ref} className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
      {items.map((i) => (
        <button key={i.label} onClick={i.onClick} title={i.label}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-xs hover:scale-110 transition-transform cursor-pointer"
          style={{ borderColor: DIVIDER, background: CREAM, color: DARK }}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function DigestMagazineLayout({ issue, showBackLink, backLinkView }: Props) {
  const nav = useAppStore(s => s.navigate);
  const { t } = useTranslation();
  const cover = issue.stories.find(s => s.section === 'cover_story');
  const market = issue.stories.find(s => s.section === 'market_pulse');
  const company = issue.stories.find(s => s.section === 'company_spotlight');
  const opp = issue.stories.find(s => s.section === 'opportunity');
  const diaspora = issue.stories.find(s => s.section === 'diaspora_story');
  const ad = issue.sponsorSlots?.[0];
  const fmtDate = new Date(issue.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  let exchangeData: { flag: string; name: string; change: number }[] = [];
  try { if (market?.meta) exchangeData = JSON.parse(market.meta); } catch {}
  let metrics: Record<string, string> = {};
  try { if (company?.meta) metrics = JSON.parse(company.meta); } catch {}

  const smt = { scrollMarginTop: '80px' };

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <ShareButtons />
      <div className="flex max-w-[900px] mx-auto px-4 py-8 gap-8">
        {/* Sticky TOC - Desktop */}
        <nav className="hidden lg:block w-40 shrink-0 sticky top-24 self-start hidden" aria-label="Table of Contents">
          <p className="text-xs tracking-[0.2em] uppercase mb-3 font-semibold" style={{ color: GOLD }}>Sections</p>
          <ul className="space-y-2">
            {SECTIONS.map(sec => (
              <li key={sec.key}>
                <a href={`#${sec.key}`} className="text-xs block hover:underline transition-colors" style={{ color: DARK }}>
                  {sec.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* 1. MASTHEAD */}
          <header className="text-center mb-14">
            {showBackLink && (
              <button onClick={() => nav(backLinkView || 'digest-archive')} className="text-sm mb-4 hover:underline cursor-pointer" style={{ color: GREEN }}>← Back</button>
            )}
            <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: GOLD }}>THE AFRI SPINE DIGEST</p>
            <p className="text-sm mt-1.5" style={{ color: DARK }}>Issue #{issue.issueNumber} · {fmtDate}</p>
            <p className="text-xs mt-2 italic" style={{ color: '#888' }}>Africa&apos;s pulse. Your portfolio. Every week.</p>
            <div className="h-px mt-5 mx-auto max-w-xs" style={{ background: GOLD }} />
            <div className="flex justify-center gap-6 mt-4 text-xs font-medium" style={{ color: GREEN }}>
              <button onClick={() => nav('digest-archive')} className="hover:underline cursor-pointer">Archive</button>
              <button onClick={() => nav('digest-subscribe')} className="hover:underline cursor-pointer">Subscribe</button>
            </div>
          </header>

          {/* 2. TABLE OF CONTENTS */}
          <nav className="mb-12 p-5 rounded-lg hidden lg:block" style={{ background: '#F5F2EB' }} aria-label="Table of Contents">
            <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: GOLD }}>In This Issue</p>
            <ol className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm" style={{ color: DARK }}>
              {SECTIONS.map(sec => (
                <li key={sec.key}><a href={`#${sec.key}`} className="hover:underline">{sec.label}</a></li>
              ))}
            </ol>
          </nav>

          {/* 3. COVER STORY */}
          {cover && (
            <article id="cover-story" className="mb-14" style={smt}>
              <S label="COVER STORY" />
              {cover.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-6 aspect-video">
                  <img src={cover.imageUrl} alt={cover.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: DARK }}>{cover.title}</h1>
              {cover.subtitle && <p className="text-lg mb-4" style={{ color: '#555' }}>{cover.subtitle}</p>}
              <p className="text-xs mb-6" style={{ color: '#999' }}>By {cover.author} · {cover.readTime} min read</p>
              <div className="max-w-none" style={{ fontSize: '17px', lineHeight: '1.8', color: DARK }}
                dangerouslySetInnerHTML={{ __html: cover.bodyHtml.replace(/<blockquote>/g, '<blockquote style="border-left:3px solid #C9981A;padding-left:1rem;margin:1.5rem 0;font-style:italic;font-size:1.15em;color:#444;">').replace(/<\/blockquote>/g, '</blockquote>') }} />
              <p className="mt-6 text-sm font-medium hover:underline cursor-pointer" style={{ color: GREEN }}>Explore this on AfriSpine →</p>
              <hr className="my-10 border-0 h-px" style={{ background: DIVIDER }} />
            </article>
          )}

          {/* 4. MARKET PULSE */}
          {market && (
            <section id="market-pulse" className="mb-14" style={smt}>
              <S label="MARKET PULSE" />
              <p className="text-sm mb-5 italic" style={{ color: '#777' }}>The week in African markets</p>
              {exchangeData.length > 0 && (
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'white', border: `1px solid ${DIVIDER}` }}>
                  <table className="w-full text-sm" style={{ color: DARK }}>
                    <tbody>
                      {exchangeData.map((r, i) => (
                        <tr key={i} className={i > 0 ? 'border-t' : ''} style={{ borderColor: DIVIDER }}>
                          <td className="py-2.5 font-medium">{r.flag} {r.name}</td>
                          <td className="py-2.5 text-right font-semibold" style={{ color: r.change >= 0 ? GREEN : '#C0392B' }}>
                            {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="max-w-none" style={{ fontSize: '17px', lineHeight: '1.8', color: DARK }} dangerouslySetInnerHTML={{ __html: market.bodyHtml }} />
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>Data from mystocks.africa</p>
              <hr className="my-10 border-0 h-px" style={{ background: DIVIDER }} />
            </section>
          )}

          {/* 5. COMPANY SPOTLIGHT */}
          {company && (
            <section id="company-spotlight" className="mb-14" style={smt}>
              <S label="COMPANY SPOTLIGHT" />
              <div className="flex gap-6 mb-6 items-start">
                {company.imageUrl && (
                  <img src={company.imageUrl} alt={company.title} className="rounded-lg shrink-0" style={{ maxWidth: '200px', maxHeight: '140px', objectFit: 'cover' }} />
                )}
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: DARK }}>{company.title}</h2>
                  {company.subtitle && <p className="text-base mb-1" style={{ color: '#555' }}>{company.subtitle}</p>}
                </div>
              </div>
              {Object.keys(metrics).length > 0 && (
                <div className="flex gap-6 mb-5 text-sm">
                  {Object.entries(metrics).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <p className="text-xs uppercase tracking-wide" style={{ color: '#999' }}>{k}</p>
                      <p className="font-bold text-base" style={{ color: DARK }}>{v}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="max-w-none" style={{ fontSize: '17px', lineHeight: '1.8', color: DARK }} dangerouslySetInnerHTML={{ __html: company.bodyHtml }} />
              <p className="mt-5 text-sm font-medium hover:underline cursor-pointer" style={{ color: GREEN }}>View on AfriSpine Markets →</p>
              <hr className="my-10 border-0 h-px" style={{ background: DIVIDER }} />
            </section>
          )}

          {/* 6. OPPORTUNITY OF THE WEEK */}
          {opp && (
            <section id="opportunity" className="mb-14 p-6 md:p-8 rounded-lg" style={{ ...smt, background: GREEN }}>
              <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-2" style={{ color: GOLD }}>OPPORTUNITY OF THE WEEK</p>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-white mb-4">{opp.title}</h2>
              <div className="text-white/80" style={{ fontSize: '17px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: opp.bodyHtml }} />
              <p className="text-white/50 text-xs mt-5 italic">This is not financial advice. Capital at risk. AfriSpine is not a licensed investment adviser.</p>
              <button onClick={() => nav('digest-subscribe')} className="mt-5 px-5 py-2.5 rounded text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity" style={{ background: GOLD }}>
                Learn More
              </button>
            </section>
          )}

          {/* 7. DIASPORA MONEY STORY */}
          {diaspora && (
            <article id="diaspora-story" className="my-14" style={smt}>
              <S label="DIASPORA MONEY STORY" />
              <h2 className="font-serif text-2xl font-bold mb-4" style={{ color: DARK }}>{diaspora.title}</h2>
              <div className="max-w-none" style={{ fontSize: '17px', lineHeight: '1.8', color: DARK }} dangerouslySetInnerHTML={{ __html: diaspora.bodyHtml }} />
              <p className="text-xs mt-4 italic" style={{ color: '#999' }}>A fictional story based on real investment patterns.</p>
              <hr className="my-10 border-0 h-px" style={{ background: DIVIDER }} />
            </article>
          )}

          {/* 8. PODCAST SEGMENT */}
          <section id="podcast" className="mb-14" style={smt}>
            <S label="PODCAST" />
            {issue.podcastUrl ? (
              <div className="p-5 rounded-lg" style={{ background: 'white', border: `1px solid ${DIVIDER}` }}>
                <p className="text-sm mb-4" style={{ color: DARK }}>This week&apos;s audio briefing</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => window.open(issue.podcastUrl, '_blank')} className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity" style={{ border: `2px solid ${GOLD}`, background: 'transparent' }}>
                    <svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M1 1.5L16 10L1 18.5V1.5Z" fill={GREEN} /></svg>
                  </button>
                  <div>
                    <p className="text-sm font-medium" style={{ color: DARK }}>Listen Now</p>
                    <p className="text-xs" style={{ color: '#999' }}>~7 min listen</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-lg" style={{ background: 'white', border: `1px solid ${DIVIDER}` }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${GOLD}` }}>
                    <svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M1 1.5L16 10L1 18.5V1.5Z" fill={GREEN} /></svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#777' }}>This week&apos;s audio briefing drops soon. Subscribe to get notified.</p>
                    <p className="text-xs mt-1" style={{ color: '#999' }}>~7 min listen</p>
                  </div>
                </div>
              </div>
            )}
            <hr className="my-10 border-0 h-px" style={{ background: DIVIDER }} />
          </section>

          {/* 9. SPONSORED AD */}
          {ad && (
            <div className="my-14 p-6 rounded-lg" style={{ background: 'white', border: `1px solid ${DIVIDER}` }}>
              <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#999' }}>SPONSORED</p>
              <div className="flex items-start gap-4 mb-3">
                {ad.sponsorLogoUrl && <img src={ad.sponsorLogoUrl} alt={ad.sponsorName} style={{ height: '48px' }} className="rounded" />}
                <div>
                  <p className="font-bold text-lg" style={{ color: DARK }}>{ad.adHeadline}</p>
                  <p className="text-sm mt-1" style={{ color: '#555' }}>{ad.adBody}</p>
                </div>
              </div>
              {ad.adCtaText && (
                <a href={ad.adCtaUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 rounded text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: GREEN }}>
                  {ad.adCtaText}
                </a>
              )}
            </div>
          )}

          {/* 10. FOOTER */}
          <footer className="pt-8 pb-12">
            <hr className="border-0 h-px mb-8" style={{ background: DIVIDER }} />
            <div className="text-center">
              <p className="text-sm" style={{ color: '#777' }}>Published by AfriSpine Ltd</p>
              <div className="flex justify-center gap-4 mt-2 text-xs" style={{ color: '#999' }}>
                <button onClick={() => nav('digest-subscribe')} className="hover:underline cursor-pointer">Subscribe</button>
                <button onClick={() => nav('advertise')} className="hover:underline cursor-pointer">Advertise</button>
                <button onClick={() => nav('terms')} className="hover:underline cursor-pointer">Terms</button>
                <button onClick={() => nav('privacy')} className="hover:underline cursor-pointer">Privacy</button>
              </div>
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>© {new Date().getFullYear()} AfriSpine Ltd. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}