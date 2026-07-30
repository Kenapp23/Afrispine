import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';
import { isConfigured, depositFunds, placeOrder } from '@/lib/mystocks';

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Missing required field: reference' }, { status: 400 });
    }

    // Verify the Paystack payment
    const payment = await verifyTransaction(reference);

    if (payment.status !== 'success') {
      return NextResponse.json({
        error: 'Payment not successful',
        paystackStatus: payment.status,
      }, { status: 400 });
    }

    // Find the order by paystackRef
    const order = await db.investmentOrder.findUnique({
      where: { paystackRef: reference },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for this reference' }, { status: 404 });
    }

    if (order.senderId !== senderPayload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'payment_pending') {
      return NextResponse.json({ error: `Order is in "${order.status}" status, expected payment_pending` }, { status: 400 });
    }

    // Fetch investment account for mystocks operations
    const invAccount = await db.investmentAccount.findUnique({
      where: { id: order.investmentAccountId },
    });
    if (!invAccount) {
      return NextResponse.json({ error: 'Investment account not found' }, { status: 404 });
    }

    // Update order with Paystack confirmation
    const now = new Date();
    const updateData: Record<string, any> = {
      paystackTxId: String(payment.id),
      paymentConfirmedAt: now,
      status: 'depositing',
    };

    let mystocksDepositId: string | null = null;
    let mystocksOrderId: string | null = null;
    let settlementDate: Date | null = null;

    if (isConfigured()) {
      // ── Production: deposit funds to mystocks ───────────────
      try {
        const depositResult = await depositFunds(
          invAccount.mystocksAccountId,
          {
            amount: order.investmentAmountUsd,
            currency: 'USD',
            reference: order.reference,
          }
        );
        mystocksDepositId = depositResult.depositId;
      } catch (depositErr: any) {
        console.error('[wealth/order/verify] deposit failed:', depositErr);
        // Don't fail the whole flow — the order is still confirmed
      }

      // ── Place the order with mystocks ──────────────────────
      try {
        const orderResult = await placeOrder(
          invAccount.mystocksAccountId,
          {
            type: 'BUY',
            symbol: `${order.exchange}.${order.ticker}`,
            quantity: order.sharesRequested,
            orderType: order.orderType.toUpperCase(),
            limitPrice: order.limitPriceUsd ?? null,
            reference: order.reference,
          }
        );
        mystocksOrderId = orderResult.orderId;
      } catch (orderErr: any) {
        console.error('[wealth/order/verify] placeOrder failed:', orderErr);
        // Mark as submitted — we'll retry settlement later
      }
    } else {
      // ── Sandbox / development mode ──────────────────────────
      console.warn('[wealth/order/verify] mystocks not configured — using sandbox mode');
    }

    // Estimate settlement date (T+2 for most African exchanges)
    settlementDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Final update
    await db.investmentOrder.update({
      where: { id: order.id },
      data: {
        ...updateData,
        mystocksDepositId,
        mystocksOrderId,
        status: 'submitted',
        submittedAt: now,
        settlementDate,
      },
    });

    return NextResponse.json({
      success: true,
      status: 'submitted',
      orderId: order.id,
      reference: order.reference,
      submittedAt: now.toISOString(),
      settlementDate: settlementDate?.toISOString(),
    });
  } catch (e: any) {
    console.error('[wealth/order/verify]', e);
    return NextResponse.json({ error: e.message || 'Payment verification failed' }, { status: 500 });
  }
}