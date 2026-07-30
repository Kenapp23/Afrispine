import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'reference is required' },
        { status: 400 },
      );
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ''}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error('[bills/verify] Paystack verify error:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Payment verification failed' },
        { status: 502 },
      );
    }

    const txStatus = paystackData.data?.status;

    if (txStatus === 'success') {
      // Find the BillPayment by reference
      const billPayment = await db.billPayment.findUnique({
        where: { reference },
      });

      if (!billPayment) {
        return NextResponse.json(
          { error: 'Bill payment not found' },
          { status: 404 },
        );
      }

      // For KPLC bills, generate a mock token
      let token: string | undefined;
      if (billPayment.billType === 'kplc_prepaid') {
        token = '1234-5678-9012-3456';
      }

      // Update the bill payment
      await db.billPayment.update({
        where: { id: billPayment.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
          paystackTxId: paystackData.data?.id?.toString() || null,
          tokenGenerated: token || null,
        },
      });

      return NextResponse.json({
        status: 'delivered',
        ...(token ? { token } : {}),
      });
    }

    // Payment not successful
    return NextResponse.json({ status: txStatus });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('[bills/verify]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}