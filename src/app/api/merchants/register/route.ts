import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PayoutMethodType } from '@/lib/daraja';

// ─── Valid payout method types ───────────────────────────────────
const VALID_PAYOUT_TYPES: PayoutMethodType[] = [
  'mpesa_till',
  'mpesa_paybill',
  'bank_ke',
  'bank_ng',
  'momo_mtn',
];

// ─── Country → allowed payout types ──────────────────────────────
const COUNTRY_PAYOUT_MAP: Record<string, PayoutMethodType[]> = {
  KE: ['mpesa_till', 'mpesa_paybill', 'bank_ke'],
  NG: ['bank_ng'],
  GH: ['momo_mtn'],
  UG: ['momo_mtn'],
  TZ: [],
  ZA: [],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      businessName,
      registrationNumber,
      country,
      category,
      contactEmail,
      phone,
      posType,
      payoutMethods,
      commissionPct,
    } = body;

    // ── Validate required fields ──
    const missing: string[] = [];
    if (!businessName?.trim()) missing.push('businessName');
    if (!registrationNumber?.trim()) missing.push('registrationNumber');
    if (!country) missing.push('country');
    if (!category) missing.push('category');
    if (!contactEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      missing.push('contactEmail (valid email)');
    }
    if (!phone?.trim()) missing.push('phone');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    // ── Validate country ──
    if (!COUNTRY_PAYOUT_MAP[country]) {
      return NextResponse.json(
        { error: `Unsupported country: ${country}` },
        { status: 400 },
      );
    }

    // ── Validate payout methods ──
    if (!Array.isArray(payoutMethods) || payoutMethods.length === 0) {
      return NextResponse.json(
        { error: 'At least one payout method is required' },
        { status: 400 },
      );
    }

    if (payoutMethods.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 payout methods allowed' },
        { status: 400 },
      );
    }

    const allowedTypes = COUNTRY_PAYOUT_MAP[country];
    const hasPrimary = payoutMethods.some((m: Record<string, unknown>) => m.isPrimary);

    if (!hasPrimary) {
      return NextResponse.json(
        { error: 'One payout method must be marked as primary' },
        { status: 400 },
      );
    }

    // Validate each payout method
    for (let i = 0; i < payoutMethods.length; i++) {
      const m = payoutMethods[i] as Record<string, unknown>;

      if (!VALID_PAYOUT_TYPES.includes(m.type as PayoutMethodType)) {
        return NextResponse.json(
          { error: `Invalid payout type at index ${i}: ${m.type}` },
          { status: 400 },
        );
      }

      if (!allowedTypes.includes(m.type as PayoutMethodType)) {
        return NextResponse.json(
          { error: `Payout type "${m.type}" is not available in ${country}` },
          { status: 400 },
        );
      }

      // Type-specific validation
      switch (m.type) {
        case 'mpesa_till': {
          const till = String(m.tillNumber ?? '');
          if (!till || till.length < 5 || till.length > 7) {
            return NextResponse.json(
              { error: `Till number at index ${i} must be 5-7 digits` },
              { status: 400 },
            );
          }
          break;
        }
        case 'mpesa_paybill': {
          const pb = String(m.paybillNumber ?? '');
          if (!pb || pb.length !== 6) {
            return NextResponse.json(
              { error: `Paybill number at index ${i} must be 6 digits` },
              { status: 400 },
            );
          }
          break;
        }
        case 'bank_ke': {
          if (!m.bankNameKe) {
            return NextResponse.json(
              { error: `Bank name required at index ${i}` },
              { status: 400 },
            );
          }
          if (!m.accountNameKe) {
            return NextResponse.json(
              { error: `Account name required at index ${i}` },
              { status: 400 },
            );
          }
          if (!m.accountNumberKe) {
            return NextResponse.json(
              { error: `Account number required at index ${i}` },
              { status: 400 },
            );
          }
          break;
        }
        case 'bank_ng': {
          if (!m.bankNameNg) {
            return NextResponse.json(
              { error: `Bank name required at index ${i}` },
              { status: 400 },
            );
          }
          const nuban = String(m.accountNumberNg ?? '');
          if (!nuban || nuban.length !== 10) {
            return NextResponse.json(
              { error: `NUBAN account number at index ${i} must be 10 digits` },
              { status: 400 },
            );
          }
          break;
        }
        case 'momo_mtn': {
          if (!m.momoNumber) {
            return NextResponse.json(
              { error: `MoMo number required at index ${i}` },
              { status: 400 },
            );
          }
          break;
        }
      }
    }

    // ── Check for duplicate slug ──
    const slug = businessName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await db.merchant.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A merchant with this name already exists. Contact support if this is your business.' },
        { status: 409 },
      );
    }

    // ── Create merchant ──
    const merchant = await db.merchant.create({
      data: {
        name: businessName.trim(),
        slug,
        country,
        category,
        businessReg: registrationNumber.trim(),
        contactEmail: contactEmail.trim(),
        posType: posType || 'online',
        payoutMethods: JSON.stringify(payoutMethods),
        commissionPct: commissionPct ? Number(commissionPct) : 2,
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        id: merchant.id,
        status: 'pending_review',
        message: 'Merchant application submitted successfully. Our team will review within 1-2 business days.',
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Merchant registration error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}