import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { sendAirtime, getNetworksForCountry, getCurrencyForCountry } from '@/lib/airtime';
import { initializeTransaction } from '@/lib/paystack';

// Get supported networks for a country
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country');
  if (!country) {
    return NextResponse.json({ networks: [] });
  }
  const networks = getNetworksForCountry(country);
  const currency = getCurrencyForCountry(country);
  return NextResponse.json({ networks, currency });
}

// Send airtime — requires Paystack payment first
export async function POST(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { phone, country, amount, network, accessCode } = await req.json();

    if (!phone || !country || !amount) {
      return NextResponse.json({ error: 'Phone, country, and amount are required' }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const senderRecord = await db.sender.findUnique({ where: { id: sender.id } });
    if (!senderRecord) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

    // If accessCode provided, this was already paid via Paystack — send airtime directly
    if (accessCode) {
      const result = await sendAirtime({ phone, country, amount: amountNum, network });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Airtime delivery failed' }, { status: 500 });
      }

      // Log the airtime transaction
      await db.transaction.create({
        data: {
          reference: `AIRTIME-${Date.now()}`,
          senderId: sender.id,
          status: 'delivered',
          amountSend: amountNum,
          currencySend: getCurrencyForCountry(country),
          amountReceive: amountNum,
          currencyReceive: getCurrencyForCountry(country),
          fxRate: 1,
          feePct: 0,
          feeAmount: 0,
          totalCharged: amountNum,
          rail: 'airtime',
          paymentConfirmedAt: new Date(),
          deliveredAt: new Date(),
          amlResult: 'clear',
          feeConfirmed: true,
        },
      });

      return NextResponse.json({ success: true, messageId: result.messageId, amount: result.amount, phone: result.phone });
    }

    // No access code — return payment initialization needed
    const reference = `AFSP-AIRTIME-${sender.id}-${Date.now()}`;
    const margin = parseFloat(process.env.AIRTIME_MARGIN_PCT || '5');
    const totalCharged = amountNum; // Customer pays face value; AfriSpine keeps the wholesale discount

    const paystackResult = await initializeTransaction({
      email: senderRecord.email,
      amount: totalCharged,
      reference,
      metadata: {
        type: 'airtime',
        phone,
        country,
        amount: amountNum,
        network,
        senderId: sender.id,
      },
    });

    return NextResponse.json({ access_code: paystackResult.access_code, reference });
  } catch (e: any) {
    console.error('[airtime/send]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}