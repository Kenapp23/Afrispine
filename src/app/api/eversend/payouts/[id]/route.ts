import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/lib/credential-store';
import { getPayoutStatus } from '@/lib/services/eversend';

// ---------------------------------------------------------------------------
// GET /api/eversend/payouts/[id]
// Check the status of a payout by its Eversend payout ID.
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 },
      );
    }

    // 1. Get Eversend credentials
    const credential = await getCredential('eversend');
    if (!credential?.apiKey || !credential?.secretKey) {
      return NextResponse.json(
        { error: 'Eversend credentials not configured' },
        { status: 401 },
      );
    }

    // 2. Call Eversend
    const result = await getPayoutStatus(
      id,
      credential.apiKey,
      credential.secretKey,
      credential.environment as 'sandbox' | 'production',
      credential.baseUrl ?? undefined,
    );

    // 3. Return Eversend response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[eversend:payouts] Error checking payout status', error);
    return NextResponse.json(
      { error: 'Upstream service error', details: (error as Error).message },
      { status: 502 },
    );
  }
}
