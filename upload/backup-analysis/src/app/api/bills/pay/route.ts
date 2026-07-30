import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { payBill, getBillProvidersForCountry, BILL_PAY_FEE_GBP } from '@/lib/bill-payments';
import { initializeTransaction } from '@/lib/paystack';

// Get available bill providers
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || 'KE';
  const providers = getBillProvidersForCountry(country);
  return NextResponse.json({ providers, fee: BILL_PAY_FEE_GBP });
}

// Pay a bill
export async function POST(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { provider, accountReference, amount, country, metadata } = await req.json();

    if (!provider || !accountReference || !amount) {
      return NextResponse.json({ error: 'Provider, account reference, and amount are required' }, { status: 400 });
    }

    const senderRecord = await db.sender.findUnique({ where: { id: sender.id } });
    if (!senderRecord) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    // Total charge = bill amount + flat fee
    const totalCharged = amountNum + BILL_PAY_FEE_GBP;

    // Initialize Paystack
    const reference = `AFSP-BILL-${sender.id}-${Date.now()}`;
    const paystackResult = await initializeTransaction({
      email: senderRecord.email,
      amount: totalCharged,
      reference,
      metadata: {
        type: 'bill_payment',
        provider,
        accountReference,
        amount: amountNum,
        fee: BILL_PAY_FEE_GBP,
        country: country || 'KE',
        senderId: sender.id,
        ...metadata,
      },
    });

    return NextResponse.json({ access_code: paystackResult.access_code, reference });
  } catch (e: any) {
    console.error('[bills/pay]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}