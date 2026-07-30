import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      billType,
      accountReference,
      accountHolderName,
      billAmountKes,
      billerPaybill,
      billerName,
      dstvPackage,
    } = await req.json();

    if (
      !billType ||
      !accountReference ||
      !billAmountKes ||
      !billerPaybill ||
      !billerName
    ) {
      return NextResponse.json(
        { error: 'billType, accountReference, billAmountKes, billerPaybill, and billerName are required' },
        { status: 400 },
      );
    }

    const amountNum = parseFloat(billAmountKes);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid bill amount' }, { status: 400 });
    }

    // Generate reference
    const count = await db.billPayment.count();
    const reference = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Calculate amounts
    const fxRate = 129;
    const billAmountUsd = amountNum / fxRate;
    const convenienceFeeUsd = 1.5;
    const totalChargedUsd = billAmountUsd + convenienceFeeUsd;

    // Create BillPayment record
    const billPayment = await db.billPayment.create({
      data: {
        reference,
        senderId: sender.id,
        status: 'payment_pending',
        billType,
        billerName,
        billerPaybill,
        accountReference,
        accountHolderName: accountHolderName || '',
        billAmountKes: amountNum,
        billAmountUsd,
        convenienceFeeUsd,
        totalChargedUsd,
        fxRate,
      },
    });

    // Call Paystack
    const paystackRes = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sender.email,
          amount: Math.round(totalChargedUsd * 100),
          reference,
          metadata: {
            billPaymentId: billPayment.id,
            billType,
            ...(dstvPackage ? { dstvPackage } : {}),
          },
        }),
      },
    );

    const paystackData = await paystackRes.json();

    if (paystackData.status && paystackData.data?.access_code) {
      // Update bill payment with Paystack reference
      await db.billPayment.update({
        where: { id: billPayment.id },
        data: { paystackRef: reference },
      });

      return NextResponse.json({
        access_code: paystackData.data.access_code,
        reference,
        totalChargedUsd,
      });
    }

    // Paystack initialization failed
    console.error('[bills/initialize] Paystack error:', paystackData);
    return NextResponse.json(
      { error: paystackData.message || 'Payment initialization failed' },
      { status: 502 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('[bills/initialize]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}