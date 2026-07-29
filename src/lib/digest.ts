// Digest subscription management
// - subscribe/unsubscribe to digest
// - generate personalized digest HTML
// - send digest via Resend (or mock in dev)

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/notifications';

// ─── Types ─────────────────────────────────────────────────────

export type DigestFrequency = 'weekly' | 'daily';
export type MarketFocus = 'KE' | 'NG' | 'GH' | 'ZA' | 'all';

export interface DigestSubscriber {
  id: string;
  senderId: string;
  email: string;
  whatsappOptIn: boolean;
  frequency: DigestFrequency;
  marketFocus: MarketFocus;
  isActive: boolean;
  isPro: boolean;
  joinedAt: Date;
  lastSentAt: Date | null;
}

export interface TopMover {
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number; // percentage
  direction: 'up' | 'down';
}

export interface FxInsight {
  country: string;
  countryCode: string;
  currencyCode: string;
  bestDay: string;
  rate: string;
  reasoning: string;
}

export interface InvestmentOpportunity {
  type: 'bond' | 'ipo';
  title: string;
  description: string;
  yield: string;
  minimum: string;
  ctaUrl: string;
  ctaText: string;
}

export interface DigestData {
  date: string;
  topMovers: TopMover[];
  storyOfTheWeek: { title: string; summary: string; readMoreUrl: string };
  fxInsights: FxInsight[];
  investmentOpportunity: InvestmentOpportunity | null;
  sponsor: {
    name: string;
    logoUrl: string;
    headline: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
  } | null;
}

export interface DigestSendResult {
  totalSent: number;
  successCount: number;
  failCount: number;
  errors: string[];
  skipped: number;
}

// ─── Mock Data ─────────────────────────────────────────────────

const MOCK_TOP_MOVERS: TopMover[] = [
  // NSE Kenya
  { ticker: 'SCOM', name: 'Safaricom PLC', exchange: 'NSE', price: 17.85, change: 5.2, direction: 'up' },
  { ticker: 'KCB', name: 'KCB Group', exchange: 'NSE', price: 44.1, change: -2.8, direction: 'down' },
  { ticker: 'EQTY', name: 'Equity Group', exchange: 'NSE', price: 51.3, change: 3.1, direction: 'up' },
  // NGX Nigeria
  { ticker: 'DANGCEM', name: 'Dangote Cement', exchange: 'NGX', price: 415.0, change: 4.7, direction: 'up' },
  { ticker: 'MTNN', name: 'MTN Nigeria', exchange: 'NGX', price: 215.5, change: -1.3, direction: 'down' },
  { ticker: 'ZENITHBANK', name: 'Zenith Bank', exchange: 'NGX', price: 28.9, change: 2.1, direction: 'up' },
  // GSE Ghana
  { ticker: 'GCB', name: 'GCB Bank', exchange: 'GSE', price: 3.42, change: 6.8, direction: 'up' },
  { ticker: 'EBG', name: 'Ecobank Ghana', exchange: 'GSE', price: 0.38, change: -4.1, direction: 'down' },
  { ticker: 'GOIL', name: 'GOIL Company', exchange: 'GSE', price: 1.95, change: 1.5, direction: 'up' },
  // JSE South Africa
  { ticker: 'NPN', name: 'Naspers', exchange: 'JSE', price: 685.2, change: 3.9, direction: 'up' },
  { ticker: 'SST', name: 'Sasol', exchange: 'JSE', price: 142.8, change: -2.5, direction: 'down' },
  { ticker: 'FSR', name: 'FirstRand', exchange: 'JSE', price: 72.4, change: 1.8, direction: 'up' },
];

const MOCK_FX_INSIGHTS: FxInsight[] = [
  {
    country: 'Kenya',
    countryCode: 'KE',
    currencyCode: 'KES',
    bestDay: 'Tuesday',
    rate: 'GBP 1 = KES 193.45',
    reasoning: 'CBK weekly auction typically strengthens the shilling mid-week. Send on Tuesday for the best rate before Thursday volatility.',
  },
  {
    country: 'Nigeria',
    countryCode: 'NG',
    currencyCode: 'NGN',
    bestDay: 'Wednesday',
    rate: 'GBP 1 = NGN 1,985.00',
    reasoning: 'NAFEM window opens mid-week with improved liquidity. Avoid sending on Fridays when parallel market premiums widen.',
  },
  {
    country: 'Ghana',
    countryCode: 'GH',
    currencyCode: 'GHS',
    bestDay: 'Thursday',
    rate: 'GBP 1 = GHS 18.72',
    reasoning: 'Bank of Ghana forex auctions settle on Thursdays, providing the most competitive interbank rates.',
  },
  {
    country: 'South Africa',
    countryCode: 'ZA',
    currencyCode: 'ZAR',
    bestDay: 'Monday',
    rate: 'GBP 1 = ZAR 23.85',
    reasoning: 'SARB policy signals on Monday mornings set the tone. Post-weekend gaps often create favourable entry points.',
  },
];

const EXCHANGE_MAP: Record<string, string> = {
  KE: 'NSE',
  NG: 'NGX',
  GH: 'GSE',
  ZA: 'JSE',
};

const EXCHANGE_LABELS: Record<string, string> = {
  NSE: 'Nairobi Securities Exchange',
  NGX: 'Nigerian Exchange Group',
  GSE: 'Ghana Stock Exchange',
  JSE: 'Johannesburg Stock Exchange',
};

const COUNTRY_LABELS: Record<string, string> = {
  KE: 'Kenya',
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
};

// ─── Data Assembly ─────────────────────────────────────────────

function getTopMoversForMarket(marketFocus: MarketFocus, limit: number = 3): TopMover[] {
  if (marketFocus === 'all') {
    // Return top 3 from each exchange
    const byExchange: Record<string, TopMover[]> = {};
    for (const m of MOCK_TOP_MOVERS) {
      if (!byExchange[m.exchange]) byExchange[m.exchange] = [];
      byExchange[m.exchange].push(m);
    }
    const result: TopMover[] = [];
    for (const exchange of Object.keys(byExchange)) {
      const sorted = byExchange[exchange].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      result.push(...sorted.slice(0, limit));
    }
    return result;
  }

  const exchange = EXCHANGE_MAP[marketFocus];
  if (!exchange) return MOCK_TOP_MOVERS.slice(0, 3);

  return MOCK_TOP_MOVERS
    .filter(m => m.exchange === exchange)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, limit);
}

function getFxInsightsForMarket(marketFocus: MarketFocus): FxInsight[] {
  if (marketFocus === 'all') return MOCK_FX_INSIGHTS;
  const insight = MOCK_FX_INSIGHTS.find(f => f.countryCode === marketFocus);
  return insight ? [insight] : MOCK_FX_INSIGHTS;
}

function getStoryOfTheWeek(): DigestData['storyOfTheWeek'] {
  // Placeholder for RSS-curated content — will be replaced with real curation
  return {
    title: 'Africa\'s Fintech Funding Hits $2.2B in H1 2025',
    summary:
      'African fintech startups raised $2.2 billion in the first half of 2025, a 38% increase year-over-year. Payments and remittance companies led the charge, with diaspora-focused platforms like AfriSpine capturing growing market share in the UK-Africa corridor.',
    readMoreUrl: 'https://afri-spine.com/blog',
  };
}

function getInvestmentOpportunity(): InvestmentOpportunity {
  // Rotating placeholder for bond/IPO highlights
  return {
    type: 'bond',
    title: 'Kenya Treasury Bond 10-Year',
    description:
      'The Central Bank of Kenya is offering a 10-year infrastructure bond at 16.5% yield — one of the highest sovereign returns on the continent. Minimum investment of KES 50,000 (~GBP 260). Ideal for diaspora investors seeking dollar-adjacent returns.',
    yield: '16.5% p.a.',
    minimum: 'KES 50,000 (~GBP 260)',
    ctaUrl: 'https://afri-spine.com/wealth/bonds',
    ctaText: 'Explore Bond Investment',
  };
}

async function getActiveSponsor(): Promise<DigestData['sponsor']> {
  // Check for any upcoming or active sponsored slots
  const now = new Date();
  const slot = await db.sponsoredDigestSlot.findFirst({
    where: {
      OR: [
        { issueDate: { gte: now } },
        { issueDate: null },
      ],
    },
  });

  if (!slot) return null;

  return {
    name: slot.sponsorName,
    logoUrl: slot.sponsorLogoUrl,
    headline: slot.adHeadline,
    body: slot.adBody,
    ctaText: slot.adCtaText || 'Learn More',
    ctaUrl: slot.adCtaUrl,
  };
}

export async function assembleDigestData(marketFocus: MarketFocus): Promise<DigestData> {
  const sponsor = await getActiveSponsor();

  return {
    date: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    topMovers: getTopMoversForMarket(marketFocus),
    storyOfTheWeek: getStoryOfTheWeek(),
    fxInsights: getFxInsightsForMarket(marketFocus),
    investmentOpportunity: getInvestmentOpportunity(),
    sponsor,
  };
}

// ─── HTML Generation ───────────────────────────────────────────

function moversTableHtml(movers: TopMover[]): string {
  // Group by exchange
  const grouped: Record<string, TopMover[]> = {};
  for (const m of movers) {
    if (!grouped[m.exchange]) grouped[m.exchange] = [];
    grouped[m.exchange].push(m);
  }

  const tables = Object.entries(grouped).map(([exchange, items]) => {
    const rows = items
      .map(m => {
        const color = m.direction === 'up' ? '#059669' : '#dc2626';
        const arrow = m.direction === 'up' ? '&#9650;' : '&#9660;';
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#1f2937;">${m.ticker}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${m.name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;">${m.price.toFixed(2)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color};font-weight:600;">${arrow} ${m.change > 0 ? '+' : ''}${m.change.toFixed(1)}%</td>
          </tr>`;
      })
      .join('');

    return `
      <div style="margin-bottom:20px;">
        <p style="font-size:13px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">${EXCHANGE_LABELS[exchange] || exchange}</p>
        <table style="width:100%;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;">Ticker</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;">Name</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;">Price</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;">Change</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  });

  return tables.join('');
}

function fxInsightCardHtml(insight: FxInsight): string {
  return `
    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-weight:700;color:#065f46;">${insight.country} (${insight.currencyCode})</span>
        <span style="font-size:12px;background:#10b981;color:#fff;padding:3px 10px;border-radius:20px;font-weight:600;">Best: ${insight.bestDay}</span>
      </div>
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#1f2937;">${insight.rate}</p>
      <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.5;">${insight.reasoning}</p>
    </div>`;
}

function sponsorSlotHtml(sponsor: NonNullable<DigestData['sponsor']>): string {
  const logoHtml = sponsor.logoUrl
    ? `<img src="${sponsor.logoUrl}" alt="${sponsor.name}" style="max-height:40px;margin-bottom:8px;border-radius:4px;" />`
    : `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Sponsored by ${sponsor.name}</p>`;

  return `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
      ${logoHtml}
      <h4 style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1f2937;">${sponsor.headline}</h4>
      <p style="margin:0 0 14px;font-size:14px;color:#6b7280;line-height:1.5;">${sponsor.body}</p>
      <a href="${sponsor.ctaUrl}" target="_blank" style="display:inline-block;padding:10px 24px;background:#f59e0b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${sponsor.ctaText}</a>
    </div>`;
}

export function generateDigestHtml(data: DigestData, unsubscribeUrl: string): string {
  const fxSection =
    data.fxInsights.length > 0
      ? `
    <!-- FX Insight -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px;">💱</span> FX Insight
      </h2>
      <p style="margin:0 0 14px;font-size:14px;color:#6b7280;">Best day to send money this week</p>
      ${data.fxInsights.map(fxInsightCardHtml).join('')}
    </div>`
      : '';

  const investmentSection = data.investmentOpportunity
    ? `
    <!-- Investment Opportunity -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px;">📈</span> Investment Opportunity
      </h2>
      <div style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:1px solid #fde047;border-radius:10px;padding:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="background:#eab308;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;">${data.investmentOpportunity.type}</span>
          <span style="font-size:13px;font-weight:600;color:#854d0e;">${data.investmentOpportunity.yield}</span>
        </div>
        <h3 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1f2937;">${data.investmentOpportunity.title}</h3>
        <p style="margin:0 0 14px;font-size:14px;color:#4b5563;line-height:1.6;">${data.investmentOpportunity.description}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <span style="font-size:13px;color:#6b7280;">Min. investment: <strong>${data.investmentOpportunity.minimum}</strong></span>
          <a href="${data.investmentOpportunity.ctaUrl}" target="_blank" style="display:inline-block;padding:10px 24px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${data.investmentOpportunity.ctaText}</a>
        </div>
      </div>
    </div>`
    : '';

  const sponsorSection = data.sponsor ? sponsorSlotHtml(data.sponsor) : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The AfriSpine Digest — ${data.date}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">The AfriSpine Digest</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#d1fae5;opacity:0.9;">${data.date}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <!-- Intro -->
              <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.6;">
                Your weekly round-up of African market moves, FX intelligence, and investment opportunities — curated for the diaspora.
              </p>

              <!-- Top Movers -->
              <div style="margin-bottom:32px;">
                <h2 style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:24px;">🚀</span> Top Movers
                </h2>
                ${moversTableHtml(data.topMovers)}
              </div>

              ${fxSection}

              <!-- Story of the Week -->
              <div style="margin-bottom:32px;">
                <h2 style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:24px;">📰</span> Story of the Week
                </h2>
                <div style="background:#f9fafb;border-left:4px solid #10b981;border-radius:0 8px 8px 0;padding:16px 20px;">
                  <h3 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1f2937;">${data.storyOfTheWeek.title}</h3>
                  <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">${data.storyOfTheWeek.summary}</p>
                  <a href="${data.storyOfTheWeek.readMoreUrl}" target="_blank" style="font-size:14px;color:#059669;font-weight:600;text-decoration:none;">Read more &rarr;</a>
                </div>
              </div>

              ${investmentSection}

              ${sponsorSection}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">AfriSpine</p>
              <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;">Bridging the diaspora to African markets</p>
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                <a href="https://afri-spine.com" style="color:#059669;text-decoration:none;">afri-spine.com</a>
                &nbsp;&middot;&nbsp;
                <a href="https://twitter.com/afri_spine" style="color:#059669;text-decoration:none;">Twitter</a>
                &nbsp;&middot;&nbsp;
                <a href="https://linkedin.com/company/afri-spine" style="color:#059669;text-decoration:none;">LinkedIn</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                You're receiving this because you subscribed to the AfriSpine Digest.<br/>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Logic ────────────────────────────────────────────────

export async function sendDigestToSubscriber(
  subscriber: DigestSubscriber,
  data: DigestData,
): Promise<boolean> {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://afri-spine.com'}/api/digest/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
  const html = generateDigestHtml(data, unsubscribeUrl);
  const subject = `The AfriSpine Digest — ${data.date}`;

  const sent = await sendEmail(subscriber.email, subject, html);

  if (sent) {
    await db.digestSubscription.update({
      where: { id: subscriber.id },
      data: { lastSentAt: new Date() },
    });
  }

  return sent;
}

export async function sendDigestToAll(options?: {
  frequency?: DigestFrequency;
  marketFocus?: MarketFocus;
}): Promise<DigestSendResult> {
  const result: DigestSendResult = {
    totalSent: 0,
    successCount: 0,
    failCount: 0,
    errors: [],
    skipped: 0,
  };

  const whereClause: Record<string, any> = { isActive: true };

  // For daily digest, only send to Pro subscribers
  if (options?.frequency === 'daily') {
    whereClause.frequency = 'daily';
    whereClause.isPro = true;
  } else if (options?.frequency === 'weekly') {
    whereClause.frequency = 'weekly';
  }

  // Optionally filter by market
  if (options?.marketFocus && options.marketFocus !== 'all') {
    whereClause.marketFocus = options.marketFocus;
  }

  const subscribers = await db.digestSubscription.findMany({
    where: whereClause,
  });

  if (subscribers.length === 0) {
    console.log('[digest] No active subscribers found for the given filters.');
    return result;
  }

  // We group by marketFocus to generate personalized content
  const byMarket: Record<string, DigestSubscriber[]> = {};
  for (const sub of subscribers) {
    const key = sub.marketFocus;
    if (!byMarket[key]) byMarket[key] = [];
    byMarket[key].push(sub);
  }

  for (const [market, subs] of Object.entries(byMarket)) {
    const marketFocus = market as MarketFocus;
    let digestData: DigestData;

    try {
      digestData = await assembleDigestData(marketFocus);
    } catch (e: any) {
      console.error(`[digest] Failed to assemble data for ${market}:`, e.message);
      result.errors.push(`Data assembly failed for ${market}: ${e.message}`);
      result.skipped += subs.length;
      continue;
    }

    // Save digest issue record
    const issue = await db.digestIssue.create({
      data: {
        issueDate: new Date(),
        subject: `The AfriSpine Digest — ${digestData.date}`,
        htmlContent: generateDigestHtml(digestData, ''),
        sentCount: 0,
      },
    });

    for (const sub of subs) {
      result.totalSent++;
      try {
        const sent = await sendDigestToSubscriber(sub, digestData);
        if (sent) {
          result.successCount++;
        } else {
          result.failCount++;
          result.errors.push(`Send failed for ${sub.email}`);
        }
      } catch (e: any) {
        result.failCount++;
        result.errors.push(`Error sending to ${sub.email}: ${e.message}`);
      }
    }

    // Update issue sent count
    await db.digestIssue.update({
      where: { id: issue.id },
      data: { sentCount: result.successCount },
    });
  }

  console.log(
    `[digest] Send complete: ${result.successCount}/${result.totalSent} successful, ${result.failCount} failed, ${result.skipped} skipped`,
  );

  return result;
}

// ─── Rate Limiter (in-memory) ──────────────────────────────────

const digestRateLimit = new Map<string, number>();
const DIGEST_RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function checkDigestRateLimit(key: string = 'global'): { allowed: boolean; waitMs: number } {
  const lastRun = digestRateLimit.get(key) || 0;
  const now = Date.now();
  const elapsed = now - lastRun;

  if (elapsed < DIGEST_RATE_LIMIT_MS) {
    return { allowed: false, waitMs: DIGEST_RATE_LIMIT_MS - elapsed };
  }

  digestRateLimit.set(key, now);
  return { allowed: true, waitMs: 0 };
}

// ─── Digest Magazine Engine ─────────────────────────────────

export async function getLatestPublishedIssue() {
  return db.digestIssue.findFirst({
    where: { status: 'published' },
    orderBy: { issueDate: 'desc' },
    include: {
      stories: { orderBy: { sortOrder: 'asc' } },
      sponsorSlots: true,
    },
  });
}

export async function getPublishedIssues(options?: { limit?: number; year?: number }) {
  const where: Record<string, unknown> = { status: 'published' };

  if (options?.year) {
    const start = new Date(options.year, 0, 1);
    const end = new Date(options.year + 1, 0, 1);
    where.issueDate = { gte: start, lt: end };
  }

  return db.digestIssue.findMany({
    where,
    orderBy: { issueDate: 'desc' },
    take: options?.limit ?? 20,
    include: {
      _count: { select: { stories: true, sponsorSlots: true } },
    },
  });
}

export async function getIssueBySlug(slug: string) {
  return db.digestIssue.findUnique({
    where: { slug },
    include: {
      stories: { orderBy: { sortOrder: 'asc' } },
      sponsorSlots: true,
    },
  });
}

export async function getStoryBySlug(slug: string, issueSlug?: string) {
  const whereClause: Record<string, unknown> = { slug };

  if (issueSlug) {
    whereClause.issue = { slug: issueSlug };
  }

  const story = await db.digestStory.findFirst({
    where: whereClause,
    include: {
      issue: {
        include: {
          stories: {
            orderBy: { sortOrder: 'asc' },
            take: 6,
          },
        },
      },
    },
  });

  if (story) {
    // Fire-and-forget analytics impression
    db.digestAnalytics
      .create({
        data: {
          issueId: story.issueId,
          eventType: 'impression',
          source: 'web',
          metadata: JSON.stringify({ storySlug: slug, storySection: story.section }),
        },
      })
      .catch(() => { /* ignore analytics errors */ });
  }

  return story;
}

export async function createDigestIssue(data: {
  issueNumber: number;
  slug: string;
  subject: string;
  coverHeadline: string;
}) {
  return db.digestIssue.create({
    data: {
      issueNumber: data.issueNumber,
      slug: data.slug,
      subject: data.subject,
      coverHeadline: data.coverHeadline,
      status: 'draft',
    },
  });
}

export async function updateDigestIssue(id: string, data: Record<string, unknown>) {
  return db.digestIssue.update({
    where: { id },
    data,
  });
}

export async function createDigestStory(data: {
  issueId: string;
  section: string;
  title: string;
  subtitle?: string;
  bodyHtml?: string;
  bodyText?: string;
  author?: string;
  readTime?: number;
  sortOrder?: number;
  meta?: string;
}) {
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return db.digestStory.create({
    data: {
      issueId: data.issueId,
      slug,
      section: data.section,
      title: data.title,
      subtitle: data.subtitle ?? '',
      bodyHtml: data.bodyHtml ?? '',
      bodyText: data.bodyText ?? (data.bodyHtml?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() ?? ''),
      author: data.author ?? 'AfriSpine Digest AI',
      readTime: data.readTime ?? 5,
      sortOrder: data.sortOrder ?? 0,
      meta: data.meta ?? '{}',
      seoTitle: data.title,
      seoDescription: data.subtitle ?? '',
    },
  });
}

export async function getDigestAdminStats() {
  const [
    totalSubscribers,
    activeSubscribers,
    proSubscribers,
    totalIssues,
    publishedIssues,
    totalSponsors,
    totalRevenue,
    latestImpressions,
  ] = await Promise.all([
    db.digestSubscription.count(),
    db.digestSubscription.count({ where: { isActive: true } }),
    db.digestSubscription.count({ where: { isActive: true, isPro: true } }),
    db.digestIssue.count(),
    db.digestIssue.count({ where: { status: 'published' } }),
    db.sponsoredDigestSlot.count({ where: { status: 'published' } }),
    db.digestAdPayment.aggregate({ where: { status: 'completed' }, _sum: { amountUsd: true } }),
    db.digestAnalytics.count({ where: { eventType: 'impression' } }),
  ]);

  // Get subscriber growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSubscribers = await db.digestSubscription.count({
    where: { joinedAt: { gte: thirtyDaysAgo } },
  });

  // Get average open rate
  const avgOpenResult = await db.digestIssue.aggregate({
    where: { status: 'published' },
    _avg: { openRate: true },
  });

  // Get average click rate
  const avgClickResult = await db.digestIssue.aggregate({
    where: { status: 'published' },
    _avg: { clickRate: true },
  });

  return {
    totalSubscribers,
    activeSubscribers,
    proSubscribers,
    totalIssues,
    publishedIssues,
    totalSponsors,
    totalRevenue: totalRevenue._sum.amountUsd ?? 0,
    latestImpressions,
    recentSubscribers,
    avgOpenRate: avgOpenResult._avg.openRate ?? 0,
    avgClickRate: avgClickResult._avg.clickRate ?? 0,
  };
}

export async function trackDigestEvent(
  issueId: string,
  eventType: string,
  source: string,
  metadata?: Record<string, unknown>,
) {
  return db.digestAnalytics.create({
    data: {
      issueId,
      eventType,
      source,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
    },
  });
}

export async function getDigestSubscribers(options?: {
  limit?: number;
  status?: string;
}) {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.isActive = options.status === 'active';
  }

  return db.digestSubscription.findMany({
    where,
    orderBy: { joinedAt: 'desc' },
    take: options?.limit ?? 50,
  });
}