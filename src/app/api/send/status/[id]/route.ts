import { NextRequest, NextResponse } from 'next/server';
import { EversendClient, EversendError } from '@/lib/eversend';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const client = await EversendClient.fromSettings();
    if (!client) {
      return NextResponse.json({ error: 'Payment processor not configured.' }, { status: 503 });
    }

    // Try both collection and payout endpoints
    try {
      const payout = await client.getPayout(id);
      return NextResponse.json({ type: 'payout', ...payout });
    } catch {
      // Not a payout, try collection
    }

    try {
      const collection = await client.getCollection(id);
      return NextResponse.json({ type: 'collection', ...collection });
    } catch {
      // Not a collection either
    }

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  } catch (err) {
    if (err instanceof EversendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[send/status] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to check status.' }, { status: 500 });
  }
}
