import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing required field: orderId' }, { status: 400 });
    }

    // Fetch the pending order
    const order = await db.investmentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.senderId !== senderPayload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is no longer pending' }, { status: 400 });
    }

    // Check quote expiry
    if (order.quoteExpiresAt && new Date(order.quoteExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Quote has expired. Please create a new quote.' }, { status: 400 });
    }

    // Get sender email for Paystack
    const sender = await db.sender.findUnique({
      where: { id: senderPayload.id },
      select: { email: true },
    });

    // Generate unique Paystack reference
    const paystackRef = `AFSP-INV-${order.id.slice(0, 8)}-${Date.now()}`;

    // Initialize Paystack transaction
    // The totalChargedUsd is passed in USD; initializeTransaction converts to cents internally
    const result = await initializeTransaction({
      email: sender?.email || senderPayload.email,
      amount: order.totalChargedUsd,
      reference: paystackRef,
      metadata: {
        type: 'investment',
        orderId: order.id,
        ticker: order.ticker,
        exchange: order.exchange,
      },
    });

    // Update order with Paystack reference
    await db.investmentOrder.update({
      where: { id: order.id },
      data: {
        paystackRef,
        status: 'payment_pending',
      },
    });

    return NextResponse.json({
      accessCode: result.access_code,
      reference: paystackRef,
    });
  } catch (e: any) {
    console.error('[wealth/order/pay]', e);
    return NextResponse.json({ error: e.message || 'Payment initialization failed' }, { status: 500 });
  }
}