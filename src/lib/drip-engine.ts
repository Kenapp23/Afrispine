/**
 * Drip Email Engine for AfriSpine
 *
 * Manages sequenced email campaigns triggered by growth events (signup, first send,
 * IPO registration, dormancy). Uses the existing sendEmail() from notifications.ts
 * and tracks sent emails in the DripEmailSent table.
 */

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/notifications';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DripStep {
  delay_days: number;
  email_type: string;
  template: string;
}

/* ------------------------------------------------------------------ */
/*  Sequence Definitions                                               */
/* ------------------------------------------------------------------ */

const DRIP_SEQUENCES: Record<string, DripStep[]> = {
  onboarding: [
    { delay_days: 0, email_type: 'welcome', template: 'welcome' },
    { delay_days: 3, email_type: 'first_send_prompt', template: 'first_send_prompt' },
    { delay_days: 7, email_type: 'social_proof', template: 'social_proof_nudge' },
  ],
  investment_nurture: [
    { delay_days: 0, email_type: 'investment_intro', template: 'investment_intro' },
    { delay_days: 7, email_type: 'weekly_markets', template: 'weekly_markets' },
  ],
  dangote_ipo: [
    { delay_days: 0, email_type: 'ipo_confirmation', template: 'ipo_registered_confirmation' },
    { delay_days: 7, email_type: 'ipo_update_1', template: 'ipo_weekly_1' },
  ],
  re_engagement_30d: [
    { delay_days: 0, email_type: 'miss_you', template: 'reengagement_30d' },
  ],
  re_engagement_60d: [
    { delay_days: 0, email_type: 'markets_moved', template: 'reengagement_60d' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Email Templates (inline-styled for maximum compatibility)          */
/* ------------------------------------------------------------------ */

const BRAND_COLOR = '#0A4D2E';
const GOLD = '#D4A017';
const LIGHT_BG = '#FAFAF5';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://afri-spine.com';

function emailWrapper(innerHtml: string, unsubscribeToken: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AfriSpine</title>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${LIGHT_BG};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AfriSpine</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${innerHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
              <p style="font-size:12px;color:#999;margin:0 0 8px 0;">AfriSpine — Africa&apos;s home for money transfers &amp; investments.</p>
              <p style="font-size:11px;color:#bbb;margin:0;">
                <a href="${BASE_URL}/unsubscribe?token=${unsubscribeToken}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${BASE_URL}" style="color:#999;text-decoration:underline;">afri-spine.com</a>
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

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0 auto;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:${BRAND_COLOR};">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

const EMAIL_TEMPLATES: Record<string, (data: Record<string, any>) => { subject: string; html: string }> = {
  // 1. Welcome
  welcome: (data) => ({
    subject: `Welcome to AfriSpine, ${data.firstName}! Your family is one tap away.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        Karibu, ${data.firstName}! 🌍
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Welcome to AfriSpine — the easiest way to send money home to Africa.
        Whether your family is in Kenya, Nigeria, Ghana, or anywhere across the continent,
        you&apos;re now just a few taps away from putting money in their hands.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 8px 0;">
        <strong>Here&apos;s what you can do right now:</strong>
      </p>
      <ul style="font-size:14px;color:#444;line-height:1.8;padding-left:20px;margin:0 0 16px 0;">
        <li>Send money to M-Pesa, OPay, MTN MoMo, and 50+ banks</li>
        <li>Get the best exchange rates — just 1.5% flat fee</li>
        <li>Invest in African stocks like Safaricom, GTBank, and MTN</li>
        <li>Pay bills and buy airtime for your family from abroad</li>
      </ul>
      ${ctaButton('Send Your First Transfer', `${BASE_URL}/#/send`)}
    `, data.id || 'default'),
  }),

  // 2. First send prompt
  first_send_prompt: (data) => ({
    subject: `Your first send is free, ${data.firstName}. Use code FIRST 🎁`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        Ready to send something home, ${data.firstName}?
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        We noticed you haven&apos;t made your first transfer yet. We&apos;d love to change that —
        so <strong>your first send is on us</strong>. Use the promo code below and we&apos;ll
        waive the 1.5% fee entirely.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto;">
        <tr>
          <td style="border:2px dashed ${GOLD};border-radius:8px;padding:16px 24px;text-align:center;">
            <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Promo Code</span><br/>
            <span style="font-size:28px;font-weight:800;color:${GOLD};letter-spacing:2px;">FIRST</span>
          </td>
        </tr>
      </table>
      <p style="font-size:14px;color:#666;line-height:1.5;margin:0 0 8px 0;">
        Send £100 to Kenya and your family receives the full amount — zero fees.
        This code works for any corridor and any amount.
      </p>
      ${ctaButton('Send Now — Fee Waived', `${BASE_URL}/#/send`)}
    `, data.id || 'default'),
  }),

  // 3. Social proof nudge
  social_proof_nudge: (data) => ({
    subject: `10,000+ people sent money home last week, ${data.firstName}. Your family is waiting.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        Your family is waiting, ${data.firstName}.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Last week alone, <strong>over 10,000 people</strong> used AfriSpine to send money home
        to their loved ones across Africa. From M-Pesa in Nairobi to OPay in Lagos to
        MTN MoMo in Accra — money was delivered in minutes, not days.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            <span style="font-size:14px;color:#444;">🇬🇧 → 🇰🇪</span>
            <span style="float:right;font-size:14px;font-weight:600;color:${BRAND_COLOR};">£1 = KES 190</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            <span style="font-size:14px;color:#444;">🇬🇧 → 🇳🇬</span>
            <span style="float:right;font-size:14px;font-weight:600;color:${BRAND_COLOR};">£1 = ₦1,950</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px;">
            <span style="font-size:14px;color:#444;">🇨🇦 → 🇬🇭</span>
            <span style="float:right;font-size:14px;font-weight:600;color:${BRAND_COLOR};">C$1 = GH₵ 11</span>
          </td>
        </tr>
      </table>
      <p style="font-size:14px;color:#666;line-height:1.5;margin:0;">
        Don&apos;t let another week go by. Your family deserves better than waiting.
      </p>
      ${ctaButton('Send Money Home Now', `${BASE_URL}/#/send`)}
    `, data.id || 'default'),
  }),

  // 4. Investment intro
  investment_intro: (data) => ({
    subject: `Safaricom shares rose 56% this year. Invest from abroad with AfriSpine.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        Your money can do more than just transfer, ${data.firstName}.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Did you know that <strong>Safaricom (SCOM) shares are up 56% this year</strong>?
        Or that GTBank (GTCO) has returned 32% to shareholders? The African stock
        market is one of the fastest-growing in the world — and AfriSpine gives you
        direct access from wherever you live.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        <strong>What you can invest in:</strong>
      </p>
      <ul style="font-size:14px;color:#444;line-height:1.8;padding-left:20px;margin:0 0 16px 0;">
        <li>Nigerian equities — GTBank, Access, MTN Nigeria, Dangote Cement</li>
        <li>Kenyan stocks — Safaricom, KCB, Equity Group, EABL</li>
        <li>Government bonds — Nigerian FGN bonds, Kenyan Treasury bonds</li>
        <li>Upcoming IPOs — Dangote Refinery (register interest now!)</li>
      </ul>
      <p style="font-size:13px;color:#999;line-height:1.4;margin:0 0 8px 0;">
        Investing involves risk. Past performance does not guarantee future returns. Please invest responsibly.
      </p>
      ${ctaButton('Explore African Markets', `${BASE_URL}/#/markets`)}
    `, data.id || 'default'),
  }),

  // 5. Weekly markets
  weekly_markets: (data) => ({
    subject: `African Markets Weekly: Top movers, company spotlight, and bond highlight`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        African Markets Weekly 📊
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Here&apos;s your weekly roundup of the biggest moves across African stock markets.
      </p>
      <p style="font-size:16px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">Top Movers This Week</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <tr style="background-color:${LIGHT_BG};">
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#666;">Stock</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#666;text-align:right;">Change</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">SCOM <span style="color:#999;">(Safaricom)</span></td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+3.2%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">GTCO <span style="color:#999;">(Guaranty Trust)</span></td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+2.8%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">MTNN <span style="color:#999;">(MTN Nigeria)</span></td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+1.9%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">EQTY <span style="color:#999;">(Equity Group)</span></td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#dc2626;text-align:right;">-0.8%</td>
        </tr>
      </table>
      <p style="font-size:16px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">Company Spotlight</p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        <strong>Access Holdings (ACCESS)</strong> — Access Bank&apos;s parent company continues
        its expansion across Africa with operations now in 17 countries. The fintech
        subsidiary, Oxygen, is gaining traction among young Nigerians. Analysts see
        20% upside from current levels.
      </p>
      <p style="font-size:16px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">Bond Highlight</p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 8px 0;">
        <strong>Nigeria 10-Year FGN Bond</strong> — Currently yielding ~18.5%.
        For investors looking for fixed income exposure to Africa, Nigerian
        government bonds offer compelling real yields. Available through AfriSpine.
      </p>
      ${ctaButton('Open Markets Dashboard', `${BASE_URL}/#/markets`)}
    `, data.id || 'default'),
  }),

  // 6. IPO registered confirmation
  ipo_registered_confirmation: (data) => ({
    subject: `You're on the list! We'll notify you when Dangote IPO opens.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        You're registered for the Dangote IPO, ${data.firstName}! 🔥
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Great news — you&apos;ve successfully registered your interest in the
        <strong>Dangote Petroleum Refinery IPO</strong>. You&apos;re now on the priority
        notification list and will be among the first to know when the IPO opens.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        <strong>What happens next:</strong>
      </p>
      <ol style="font-size:14px;color:#444;line-height:1.8;padding-left:20px;margin:0 0 16px 0;">
        <li>You&apos;ll receive an email as soon as the IPO date and pricing are announced</li>
        <li>We&apos;ll guide you through KYC completion (required by Nigerian regulators)</li>
        <li>When the IPO opens, you can invest in GBP, USD, or CAD through AfriSpine</li>
        <li>Your shares will be held in a licensed custodial account in Nigeria</li>
      </ol>
      <p style="font-size:14px;color:#666;line-height:1.5;margin:0 0 8px 0;">
        In the meantime, you can explore other investment opportunities on AfriSpine —
        including Nigerian equities, Kenyan stocks, and government bonds.
      </p>
      ${ctaButton('Explore Markets Now', `${BASE_URL}/#/markets`)}
    `, data.id || 'default'),
  }),

  // 7. IPO weekly update
  ipo_weekly_1: (data) => ({
    subject: `Dangote IPO Update: 650,000 barrels per day. Here's what we know.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        Dangote Refinery IPO Update 🏭
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        ${data.firstName}, here&apos;s the latest on the most anticipated IPO in African history.
      </p>
      <p style="font-size:16px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">Key Facts</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#666;border-bottom:1px solid #eee;">Capacity</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#444;text-align:right;border-bottom:1px solid #eee;">650,000 barrels/day</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#666;border-bottom:1px solid #eee;">Est. Valuation</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#444;text-align:right;border-bottom:1px solid #eee;">$15–20 Billion</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#666;border-bottom:1px solid #eee;">Products</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#444;text-align:right;border-bottom:1px solid #eee;">Petrol, Diesel, Jet Fuel, Polypropylene</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#666;">Location</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#444;text-align:right;">Lekki Free Zone, Lagos, Nigeria</td>
        </tr>
      </table>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        The refinery has begun processing crude oil and is expected to reach
        full commercial operations soon. Nigeria currently spends over <strong>$20 billion
        annually</strong> on imported fuel — the Dangote Refinery is designed to eliminate
        this entirely, turning Nigeria into a net fuel exporter.
      </p>
      <p style="font-size:14px;color:#666;line-height:1.5;margin:0 0 8px 0;">
        We&apos;ll keep you updated as the IPO timeline becomes clearer. Make sure your
        KYC is complete so you can invest the moment the window opens.
      </p>
      ${ctaButton('Complete KYC Now', `${BASE_URL}/#/verify`)}
    `, data.id || 'default'),
  }),

  // 8. Re-engagement 30 days
  reengagement_30d: (data) => ({
    subject: `We miss you, ${data.firstName}. Your family in ${data.country || 'Africa'} misses you too.`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        It&apos;s been a while, ${data.firstName}.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        We noticed it&apos;s been about a month since you last used AfriSpine.
        Life gets busy — we understand. But your family in
        ${data.country || 'Africa'} is always thinking of you.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Whether it&apos;s school fees, rent, a birthday gift, or just because —
        sending money home takes less than 2 minutes on AfriSpine. And at 1.5% flat,
        you know exactly what it costs.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:2px dashed ${GOLD};border-radius:8px;">
        <tr>
          <td style="padding:16px;text-align:center;">
            <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Welcome back offer</span><br/>
            <span style="font-size:14px;font-weight:600;color:${GOLD};">Use code WELCOMEBACK for free fees on your next send</span>
          </td>
        </tr>
      </table>
      ${ctaButton('Send Something Home Today', `${BASE_URL}/#/send`)}
    `, data.id || 'default'),
  }),

  // 9. Re-engagement 60 days
  reengagement_60d: (data) => ({
    subject: `Markets moved: SCOM +8.2% | GTCO +12% | MTN +6% — don't miss out`,
    html: emailWrapper(`
      <p style="font-size:20px;font-weight:700;color:${BRAND_COLOR};margin:0 0 8px 0;">
        A lot has happened, ${data.firstName}.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        While you&apos;ve been away, African markets have been on a strong run.
        Here&apos;s what you missed:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <tr style="background-color:${LIGHT_BG};">
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#666;">Stock</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#666;text-align:right;">60-Day Change</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">SCOM (Safaricom)</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+8.2%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">GTCO (Guaranty Trust)</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+12.1%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">MTNN (MTN Nigeria)</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+6.3%</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 12px;font-size:14px;color:#444;">DANGCEM (Dangote Cement)</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;">+5.7%</td>
        </tr>
      </table>
      <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px 0;">
        Whether you want to <strong>send money home</strong> or <strong>start investing in
        African markets</strong>, AfriSpine makes it simple from wherever you are.
      </p>
      <p style="font-size:13px;color:#999;line-height:1.4;margin:0 0 8px 0;">
        Past performance is not indicative of future results. Investing involves risk.
      </p>
      ${ctaButton('Come Back — Send or Invest', `${BASE_URL}/#/send`)}
    `, data.id || 'default'),
  }),
};

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Check if a drip email of a specific type has already been sent to a sender.
 */
async function shouldSendDrip(senderId: string, emailType: string): Promise<boolean> {
  try {
    const existing = await db.dripEmailSent.findFirst({
      where: { senderId, emailType },
    });
    return !existing;
  } catch (e) {
    console.error('[drip] Error checking send status:', e);
    return false;
  }
}

/**
 * Record that a drip email has been sent (idempotency).
 */
async function recordDripSent(senderId: string, sequenceType: string, emailType: string): Promise<void> {
  try {
    await db.dripEmailSent.create({
      data: { senderId, eventType: sequenceType, emailType },
    });
  } catch (e) {
    console.error('[drip] Error recording sent email:', e);
  }
}

/**
 * Send a single drip email to a sender.
 */
async function sendDripEmail(senderId: string, sequenceType: string, step: DripStep, metadata: Record<string, any> = {}): Promise<boolean> {
  // Check if already sent
  const canSend = await shouldSendDrip(senderId, step.email_type);
  if (!canSend) {
    console.log(`[drip] Skipping ${step.email_type} for ${senderId} — already sent`);
    return false;
  }

  // Get sender info
  const sender = await db.sender.findUnique({
    where: { id: senderId },
    select: { email: true, firstName: true, lastName: true, countryOfResidence: true },
  });

  if (!sender || !sender.email) {
    console.log(`[drip] No email for sender ${senderId}`);
    return false;
  }

  // Get template
  const templateFn = EMAIL_TEMPLATES[step.template];
  if (!templateFn) {
    console.error(`[drip] No template found: ${step.template}`);
    return false;
  }

  // Build template data
  const templateData = {
    firstName: sender.firstName || 'there',
    lastName: sender.lastName || '',
    email: sender.email,
    country: sender.countryOfResidence || 'Africa',
    id: senderId,
    ...metadata,
  };

  const { subject, html } = templateFn(templateData);

  // Send
  const sent = await sendEmail(sender.email, subject, html);

  if (sent) {
    await recordDripSent(senderId, sequenceType, step.email_type);
    console.log(`[drip] Sent ${step.email_type} to ${sender.email}`);
  }

  return sent;
}

/**
 * Trigger a drip sequence for a sender. Called fire-and-forget from growth events.
 * This schedules all steps in the sequence (with delay_days=0 sent immediately,
 * future steps are evaluated on next processDripQueue() call).
 */
export async function triggerDripSequence(
  senderId: string,
  sequenceType: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const sequence = DRIP_SEQUENCES[sequenceType];
  if (!sequence) {
    console.warn(`[drip] Unknown sequence type: ${sequenceType}`);
    return;
  }

  console.log(`[drip] Triggering sequence "${sequenceType}" for sender ${senderId}`);

  for (const step of sequence) {
    if (step.delay_days === 0) {
      // Send immediately
      await sendDripEmail(senderId, sequenceType, step, metadata);
    } else {
      // For delayed steps, check if they should be sent based on sender creation date
      // They'll also be caught by the cron/processDripQueue
      try {
        const sender = await db.sender.findUnique({
          where: { id: senderId },
          select: { createdAt: true },
        });

        if (sender) {
          const daysSinceCreation = (Date.now() - sender.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreation >= step.delay_days) {
            await sendDripEmail(senderId, sequenceType, step, metadata);
          }
        }
      } catch (e) {
        console.error(`[drip] Error checking delay for step ${step.email_type}:`, e);
      }
    }
  }
}

/**
 * Process all pending drip emails. Intended to be called by a cron job or
 * manual trigger via the API endpoint.
 *
 * Finds all senders who may have pending drips (created in the last 90 days)
 * and evaluates all sequences for them.
 */
export async function processDripQueue(): Promise<{ processed: number; sent: number; errors: number }> {
  const result = { processed: 0, sent: 0, errors: 0 };

  try {
    // Find all active senders created in the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const senders = await db.sender.findMany({
      where: {
        accountStatus: 'active',
        emailVerified: true,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        createdAt: true,
        countryOfResidence: true,
        growthEvents: {
          where: {
            triggeredAt: { gte: ninetyDaysAgo },
          },
          select: { eventType: true },
        },
      },
    });

    console.log(`[drip] Processing queue for ${senders.length} active senders`);

    for (const sender of senders) {
      result.processed++;
      const daysSinceCreation = (Date.now() - sender.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const eventTypes = new Set(sender.growthEvents.map((e: any) => e.eventType));

      // Determine which sequences to evaluate
      const sequencesToCheck: string[] = [];

      // Everyone gets onboarding
      sequencesToCheck.push('onboarding');

      // If they've sent at least once, check investment nurture
      if (eventTypes.has('first_send') || eventTypes.has('transfer_completed')) {
        sequencesToCheck.push('investment_nurture');
      }

      // If they registered for Dangote IPO
      if (eventTypes.has('ipo_registered')) {
        sequencesToCheck.push('dangote_ipo');
      }

      // Re-engagement based on last active
      const lastActive = sender.createdAt; // simplified — in production, use lastActiveAt
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActive >= 25 && daysSinceActive <= 35) {
        sequencesToCheck.push('re_engagement_30d');
      }
      if (daysSinceActive >= 55 && daysSinceActive <= 70) {
        sequencesToCheck.push('re_engagement_60d');
      }

      // Evaluate each sequence
      for (const seqType of sequencesToCheck) {
        const sequence = DRIP_SEQUENCES[seqType];
        if (!sequence) continue;

        for (const step of sequence) {
          if (daysSinceCreation >= step.delay_days) {
            try {
              const wasSent = await sendDripEmail(
                sender.id,
                seqType,
                step,
                { firstName: sender.firstName, country: sender.countryOfResidence }
              );
              if (wasSent) result.sent++;
            } catch (e) {
              result.errors++;
              console.error(`[drip] Error sending ${step.email_type} to ${sender.id}:`, e);
            }
          }
        }
      }
    }

    console.log(`[drip] Queue processed: ${result.processed} checked, ${result.sent} sent, ${result.errors} errors`);
  } catch (e) {
    console.error('[drip] Queue processing failed:', e);
    result.errors++;
  }

  return result;
}