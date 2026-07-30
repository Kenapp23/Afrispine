import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/lib/credential-store';
import { createPayout } from '@/lib/services/eversend';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// POST /api/eversend/payouts
// Create a mobile-money or bank-transfer payout via Eversend.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    // 2. Parse body
    const body = await req.json();
    const {
      payoutMethod,
      destination,
      amount,
      currency,
      country,
      idempotencyKey: providedKey,
      senderId,
    } = body;

    // 3. Validate required fields
    if (!payoutMethod || !destination || !amount || !currency || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: payoutMethod, destination, amount, currency, country' },
        { status: 400 },
      );
    }

    if (payoutMethod !== 'mobile_money' && payoutMethod !== 'bank_transfer') {
      return NextResponse.json(
        { error: "payoutMethod must be 'mobile_money' or 'bank_transfer'" },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    // 4. Generate idempotencyKey if not provided
    const idempotencyKey = providedKey || `ev-po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // 5. Get Eversend credentials
    const credential = await getCredential('eversend');
    if (!credential?.apiKey || !credential?.secretKey) {
      return NextResponse.json(
        { error: 'Eversend credentials not configured' },
        { status: 401 },
      );
    }

    // 6. Build callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/eversend/webhooks/payout`;

    // 7. Normalize payoutMethod for Eversend API (kebab-case)
    const eversendMethod = payoutMethod === 'mobile_money' ? 'mobile-money' : 'bank-transfer';

    // 8. Call Eversend
    const result = await createPayout({
      payoutMethod: eversendMethod,
      destination,
      amount,
      currency,
      country,
      callbackUrl,
      idempotencyKey,
      clientId: credential.apiKey,
      clientSecret: credential.secretKey,
      environment: credential.environment as 'sandbox' | 'production',
      ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
    });

    // 9. If senderId is provided, store a pending transaction record
    if (senderId) {
      try {
        await db.eversendTransaction.create({
          data: {
            eversendId: String((result as Record<string, unknown>).id ?? idempotencyKey),
            type: 'payout',
            status: 'pending',
            amount,
            currency,
            country,
            payoutMethod,
            reference: idempotencyKey,
            fees: Number((result as Record<string, unknown>).fees ?? 0),
            senderId,
          },
        });
      } catch (dbError) {
        console.error('[eversend:payouts] Failed to store transaction record', dbError);
        // Don't fail the request — the payout was already submitted upstream
      }
    }

    // 10. Return Eversend response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[eversend:payouts] Error creating payout', error);
    return NextResponse.json(
      { error: 'Upstream service error', details: (error as Error).message },
      { status: 502 },
    );
  }
}
