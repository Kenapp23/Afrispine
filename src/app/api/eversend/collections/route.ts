import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/lib/credential-store';
import {
  createMobileMoneyCollection,
  createBankTransferCollection,
} from '@/lib/services/eversend';

// ---------------------------------------------------------------------------
// POST /api/eversend/collections
// Initiate a mobile-money or bank-transfer collection via Eversend.
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
    const { type, phone, accountNumber, bankCode, accountName, amount, currency, country } = body;

    // 3. Validate required top-level fields
    if (!type || !amount || !currency || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, currency, country' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }

    // 4. Validate fields based on type
    if (type === 'mobile_money') {
      if (!phone) {
        return NextResponse.json(
          { error: 'phone is required for mobile_money collections' },
          { status: 400 },
        );
      }
    } else if (type === 'bank_transfer') {
      if (!accountNumber || !bankCode || !accountName) {
        return NextResponse.json(
          { error: 'accountNumber, bankCode, and accountName are required for bank_transfer collections' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "type must be 'mobile_money' or 'bank_transfer'" },
        { status: 400 },
      );
    }

    // 5. Get Eversend credentials
    const credential = await getCredential('eversend');
    if (!credential?.apiKey || !credential?.secretKey) {
      return NextResponse.json(
        { error: 'Eversend credentials not configured' },
        { status: 401 },
      );
    }

    // 6. Build callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/eversend/webhooks/collection`;

    // 7. Call the appropriate Eversend function
    let result: Record<string, unknown>;

    if (type === 'mobile_money') {
      result = await createMobileMoneyCollection({
        phone, amount, currency, country, callbackUrl,
        clientId: credential.apiKey,
        clientSecret: credential.secretKey,
        environment: credential.environment as 'sandbox' | 'production',
        ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
      });
    } else {
      result = await createBankTransferCollection({
        accountNumber, bankCode, amount, currency, country, callbackUrl, accountName,
        clientId: credential.apiKey,
        clientSecret: credential.secretKey,
        environment: credential.environment as 'sandbox' | 'production',
        ...(credential.baseUrl ? { baseUrl: credential.baseUrl } : {}),
      });
    }

    // 9. Return Eversend response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[eversend:collections] Error initiating collection', error);
    return NextResponse.json(
      { error: 'Upstream service error', details: (error as Error).message },
      { status: 502 },
    );
  }
}
