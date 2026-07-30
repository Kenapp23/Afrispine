import { NextRequest, NextResponse } from 'next/server';
import { processTransactionAsync } from '@/lib/transaction-lifecycle';
import { getSenderFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    // Run async processing
    const result = await processTransactionAsync(transactionId);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[route-tx]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}