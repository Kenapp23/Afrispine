import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { createSubAccount, assertKyc, isConfigured } from '@/lib/mystocks';

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch full sender record to check KYC
    const sender = await db.sender.findUnique({
      where: { id: senderPayload.id },
    });
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // KYC check
    if (sender.kycStatus !== 'approved') {
      return NextResponse.json({
        error: 'KYC_REQUIRED',
        message: 'Please complete identity verification before activating your investment account.',
      }, { status: 403 });
    }

    // Check for existing investment account
    const existing = await db.investmentAccount.findUnique({
      where: { senderId: sender.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Investment account already exists' }, { status: 409 });
    }

    const fullName = `${sender.firstName} ${sender.lastName}`.trim();
    let mystocksAccountId: string;
    let kycAssertedAt: Date = new Date();

    if (isConfigured()) {
      // ── Production: call mystocks API ───────────────────────
      const subResult = await createSubAccount({
        id: sender.id,
        fullName,
        email: sender.email,
      });
      mystocksAccountId = subResult.subAccountId;

      await assertKyc(mystocksAccountId, {
        status: 'approved',
        provider: 'smile_id',
        verifiedAt: sender.kycCompletedAt?.toISOString() || new Date().toISOString(),
        documentType: sender.kycIdType || 'national_id',
      });
    } else {
      // ── Sandbox / development mode ──────────────────────────
      mystocksAccountId = `sandbox_usr_${sender.id.slice(0, 8)}`;
      console.warn('[wealth/account/activate] mystocks not configured — using sandbox mode');
    }

    // Persist the investment account
    const account = await db.investmentAccount.create({
      data: {
        senderId: sender.id,
        mystocksAccountId,
        kycAssertedAt,
        kycAssertedStatus: 'approved',
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      subAccountId: account.mystocksAccountId,
    });
  } catch (e: any) {
    console.error('[wealth/account/activate]', e);
    return NextResponse.json({ error: e.message || 'Failed to activate investment account' }, { status: 500 });
  }
}