import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';

/* ------------------------------------------------------------------ */
/*  Zod schema                                                        */
/* ------------------------------------------------------------------ */
const verifySchema = z.object({
  reference: z.string().min(1, 'Paystack reference is required'),
});

/* ------------------------------------------------------------------ */
/*  POST: Verify payment and issue the voucher                        */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const sender = await requireSenderAuth(req);

    // 2. Parse & validate
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    // 3. Find voucher by paystackRef
    const voucher = await db.giftVoucher.findFirst({
      where: { paystackRef: parsed.data.reference },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // 4. If already sent, return current voucher
    if (voucher.status === 'sent') {
      return NextResponse.json({ voucher });
    }

    // 5. Verify with Paystack
    const result = await verifyTransaction(parsed.data.reference);

    if (result.status !== 'success') {
      return NextResponse.json(
        { error: `Payment ${result.status}` },
        { status: 400 },
      );
    }

    // 6. Update voucher to sent
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months

    const updated = await db.giftVoucher.update({
      where: { id: voucher.id },
      data: {
        status: 'sent',
        issuedAt: now,
        expiresAt,
      },
    });

    return NextResponse.json({ voucher: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[gifts/verify]', e);
    return NextResponse.json(
      { error: e.message || 'Verification failed' },
      { status: 500 },
    );
  }
}