import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';
import { generateReference } from '@/lib/providers';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      transactionId,
      recipientName,
      recipientPhone,
      recipientCountry,
      bankName,
      accountNumber,
      bankCode,
      rippleAddress,
      papssIban,
      network,
      saveCard,
    } = body;

    if (!transactionId || !recipientName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const txn = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { sender: true, recipient: true },
    });

    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (txn.senderId !== senderPayload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (txn.status !== 'quote') {
      return NextResponse.json({ error: 'Transaction is no longer a quote' }, { status: 400 });
    }

    // Check quote expiry
    if (txn.quoteExpiresAt && new Date(txn.quoteExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Quote has expired. Please create a new quote.' }, { status: 400 });
    }

    // KYC status check
    const sender = await db.sender.findUnique({ where: { id: senderPayload.id } });
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    if (sender.kycStatus !== 'approved') {
      return NextResponse.json({
        error: 'KYC_REQUIRED',
        message: 'Please complete identity verification before sending money.'
      }, { status: 403 });
    }

    // Amount validation
    const amountGbp = txn.amountSend;
    if (amountGbp < 10 || amountGbp > 10000) {
      return NextResponse.json({
        error: 'AMOUNT_INVALID',
        message: 'Amount must be between £10 and £10,000.'
      }, { status: 400 });
    }

    // Create or find recipient
    let recipient = txn.recipient;
    if (!recipient && recipientName) {
      recipient = await db.recipient.create({
        data: {
          senderId: senderPayload.id,
          fullName: recipientName,
          phone: recipientPhone || '',
          country: recipientCountry || txn.currencyReceive.substring(0, 2).toUpperCase(),
          deliveryMethod: txn.rail,
          mobileNetwork: network || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          bankCode: bankCode || null,
          rippleAddress: rippleAddress || null,
          papssIban: papssIban || null,
        },
      });
      await db.transaction.update({ where: { id: txn.id }, data: { recipientId: recipient.id } });
    }

    // Generate unique Paystack reference
    const paystackRef = `AFSP-${txn.id}-${Date.now()}`;

    // Initialize Paystack
    const result = await initializeTransaction({
      email: txn.sender?.email || senderPayload.email,
      amount: txn.totalCharged,
      reference: paystackRef,
      metadata: {
        transactionId: txn.id,
        senderId: senderPayload.id,
        recipientId: recipient?.id,
        saveCard: saveCard || false,
        custom_fields: [
          { display_name: 'Reference', variable_name: 'reference', value: txn.reference },
          { display_name: 'Amount', variable_name: 'amount', value: String(txn.amountSend) },
          { display_name: 'Currency', variable_name: 'currency', value: txn.currencySend },
        ],
      },
    });

    // Update transaction
    await db.transaction.update({
      where: { id: txn.id },
      data: {
        status: 'payment_pending',
        paystackRef: paystackRef,
        recipientId: recipient?.id,
      },
    });

    await db.transactionEvent.create({
      data: {
        transactionId: txn.id,
        eventType: 'payment_initiated',
        payload: JSON.stringify({ paystackRef, accessCode: result.access_code }),
        actor: 'sender',
      },
    });

    return NextResponse.json({
      access_code: result.access_code,
      reference: paystackRef,
    });
  } catch (e: any) {
    console.error('[payments/initialize]', e);
    return NextResponse.json({ error: e.message || 'Payment initialization failed' }, { status: 500 });
  }
}