import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeTransaction } from '@/lib/paystack';

const PACKAGE_PRICES: Record<string, number> = {
  single: 800,
  monthly: 2800,
  quarterly: 8500,
  ipo_feature: 2500,
};

const VALID_PACKAGES = Object.keys(PACKAGE_PRICES);

const BANNED_PHRASES = [
  'guaranteed returns',
  'get rich',
  '100% profit',
  'scam',
  'crypto',
  'MLM',
];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some((phrase) => lower.includes(phrase));
}

function generateRef(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      companyName,
      industry,
      contactName,
      contactEmail,
      website,
      adHeadline,
      adBody,
      adCtaText,
      adCtaUrl,
      logoUrl,
      package: adPackage,
      targetDate,
    } = body as {
      companyName?: string;
      industry?: string;
      contactName?: string;
      contactEmail?: string;
      website?: string;
      adHeadline?: string;
      adBody?: string;
      adCtaText?: string;
      adCtaUrl?: string;
      logoUrl?: string;
      package?: string;
      targetDate?: string;
    };

    // ── Validation ──
    const requiredFields = [
      'companyName',
      'industry',
      'contactName',
      'contactEmail',
      'adHeadline',
      'adBody',
      'adCtaText',
      'adCtaUrl',
      'package',
    ];
    const missing = requiredFields.filter(
      (f) => !(body as Record<string, unknown>)[f],
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    if (!isValidEmail(contactEmail!)) {
      return NextResponse.json(
        { error: 'Invalid contact email format' },
        { status: 400 },
      );
    }

    if (!isValidUrl(adCtaUrl!)) {
      return NextResponse.json(
        { error: 'Invalid CTA URL — must be a valid http/https URL' },
        { status: 400 },
      );
    }

    const headlineWords = adHeadline!.trim().split(/\s+/);
    if (headlineWords.length > 10) {
      return NextResponse.json(
        { error: 'Ad headline must be 10 words or fewer' },
        { status: 400 },
      );
    }

    const bodyWords = adBody!.trim().split(/\s+/);
    if (bodyWords.length > 80) {
      return NextResponse.json(
        { error: 'Ad body must be 80 words or fewer' },
        { status: 400 },
      );
    }

    const ctaWords = adCtaText!.trim().split(/\s+/);
    if (ctaWords.length > 5) {
      return NextResponse.json(
        { error: 'CTA text must be 5 words or fewer' },
        { status: 400 },
      );
    }

    if (!VALID_PACKAGES.includes(adPackage!)) {
      return NextResponse.json(
        { error: `Invalid package. Must be one of: ${VALID_PACKAGES.join(', ')}` },
        { status: 400 },
      );
    }

    const priceUsd = PACKAGE_PRICES[adPackage!];

    // ── AI content check (mock) ──
    const combinedText = `${adHeadline} ${adBody} ${adCtaText}`;
    const hasBannedContent = containsBannedWords(combinedText);

    const aiReview = hasBannedContent
      ? { approved: false, reason: 'Contains prohibited financial claims' }
      : { approved: true, reason: 'Content complies with advertising guidelines' };

    // ── Create or find advertiser ──
    const advertiser = await db.digestAdvertiser.upsert({
      where: { contactEmail: contactEmail! },
      create: {
        companyName: companyName!,
        logoUrl: logoUrl || '',
        industry: industry || '',
        contactEmail: contactEmail!,
        contactName: contactName || '',
      },
      update: {
        companyName: companyName!,
        logoUrl: logoUrl || '',
        industry: industry || '',
        contactName: contactName || '',
      },
    });

    // ── Create ad slot ──
    const paystackRef = generateRef('dig_ad');
    const slot = await db.sponsoredDigestSlot.create({
      data: {
        sponsorName: companyName!,
        sponsorLogoUrl: logoUrl || '',
        adHeadline: adHeadline!,
        adBody: adBody!,
        adCtaText: adCtaText!,
        adCtaUrl: adCtaUrl!,
        status: aiReview.approved ? 'pending_review' : 'rejected',
        aiReviewResult: JSON.stringify(aiReview),
        issueDate: targetDate ? new Date(targetDate) : null,
        advertiserId: advertiser.id,
      },
    });

    // ── Create payment record ──
    await db.digestAdPayment.create({
      data: {
        advertiserId: advertiser.id,
        adId: slot.id,
        package: adPackage!,
        amountUsd: priceUsd,
        paystackRef,
        status: 'pending',
      },
    });

    // ── If AI approved, initialize Paystack ──
    if (aiReview.approved) {
      try {
        const paystackResult = await initializeTransaction({
          email: contactEmail!,
          amount: priceUsd,
          reference: paystackRef,
          metadata: {
            type: 'digest_ad',
            adId: slot.id,
            package: adPackage,
            companyName: companyName,
          },
        });

        // Build the authorization URL
        const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
        const authorizationUrl = `https://checkout.paystack.com/${paystackResult.access_code}?key=${publicKey}`;

        return NextResponse.json({
          authorizationUrl,
          adId: slot.id,
          advertiserId: advertiser.id,
          aiReview,
        });
      } catch (paystackErr: any) {
        console.error('[digest/ads/book] Paystack init failed:', paystackErr);
        // Still return the ad info but note payment init failed
        return NextResponse.json(
          {
            error: 'Payment initialization failed',
            adId: slot.id,
            advertiserId: advertiser.id,
            aiReview,
            paystackError: paystackErr.message,
          },
          { status: 502 },
        );
      }
    }

    // ── AI rejected — return without payment URL ──
    return NextResponse.json({
      adId: slot.id,
      advertiserId: advertiser.id,
      aiReview,
    });
  } catch (e: any) {
    console.error('[digest/ads/book]', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}