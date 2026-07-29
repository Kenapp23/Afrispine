import { NextRequest, NextResponse } from 'next/server';
import { handleDeliveryConfirmation } from '@/lib/transaction-lifecycle';

export async function POST(req: NextRequest) {
  try {
    const { transactionId, outcome, payload } = await req.json();

    if (!transactionId || !outcome) {
      return NextResponse.json({ error: 'transactionId and outcome are required' }, { status: 400 });
    }

    if (!['delivered', 'failed'].includes(outcome)) {
      return NextResponse.json({ error: 'outcome must be "delivered" or "failed"' }, { status: 400 });
    }

    const result = await handleDeliveryConfirmation(transactionId, outcome, payload);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error('[simulate-delivery]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}