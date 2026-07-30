import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/paystack';
import { processTransactionAsync } from '@/lib/transaction-lifecycle';

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[paystackWebhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    // Handle charge.success
    if (eventType === 'charge.success') {
      // Handle Pro subscription payment
      if (data.metadata?.type === 'pro_subscription') {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await db.senderSubscription.upsert({
          where: { senderId: data.metadata.senderId },
          create: {
            senderId: data.metadata.senderId,
            plan: 'pro',
            status: 'active',
            currentPeriodEnd: periodEnd,
          },
          update: {
            plan: 'pro',
            status: 'active',
            currentPeriodEnd: periodEnd,
          },
        });

        console.log(`[paystackWebhook] Pro subscription activated for sender ${data.metadata.senderId}`);
        return NextResponse.json({ received: true });
      }

      // Check metadata type for airtime
      if (data.metadata?.type === 'airtime') {
        const { sendAirtime } = await import('@/lib/airtime');
        const result = await sendAirtime({
          phone: data.metadata.phone,
          country: data.metadata.country,
          amount: parseFloat(data.metadata.amount),
          network: data.metadata.network,
        });

        if (result.success) {
          await db.transaction.create({
            data: {
              reference: `AIRTIME-${Date.now()}`,
              senderId: data.metadata.senderId,
              status: 'delivered',
              amountSend: parseFloat(data.metadata.amount),
              currencySend: result.amount ? 'KES' : data.metadata.currency || 'KES',
              amountReceive: parseFloat(data.metadata.amount),
              currencyReceive: 'KES',
              fxRate: 1,
              feePct: 0,
              feeAmount: 0,
              totalCharged: parseFloat(data.metadata.amount),
              rail: 'airtime',
              paystackRef: data.reference,
              paystackTxId: String(data.id),
              paymentConfirmedAt: new Date(),
              deliveredAt: new Date(),
              amlResult: 'clear',
              feeConfirmed: true,
            },
          });
        }

        return NextResponse.json({ received: true });
      }

      // Check metadata type for bill payment
      if (data.metadata?.type === 'bill_payment') {
        const { payBill } = await import('@/lib/bill-payments');
        const result = await payBill({
          provider: data.metadata.provider,
          accountReference: data.metadata.accountReference,
          amount: parseFloat(data.metadata.amount),
          country: data.metadata.country || 'KE',
          metadata: data.metadata,
        });

        await db.transaction.create({
          data: {
            reference: `BILL-${Date.now()}`,
            senderId: data.metadata.senderId,
            status: result.success ? 'delivered' : 'failed',
            amountSend: parseFloat(data.metadata.amount) + parseFloat(data.metadata.fee || '0'),
            currencySend: 'GBP',
            amountReceive: parseFloat(data.metadata.amount),
            currencyReceive: 'KES',
            fxRate: 1,
            feePct: 0,
            feeAmount: parseFloat(data.metadata.fee || '0'),
            totalCharged: parseFloat(data.metadata.amount) + parseFloat(data.metadata.fee || '0'),
            rail: 'bill_payment',
            paystackRef: data.reference,
            paystackTxId: String(data.id),
            paymentConfirmedAt: new Date(),
            deliveredAt: result.success ? new Date() : null,
            failedAt: result.success ? null : new Date(),
            failureReason: result.error,
            amlResult: 'clear',
            feeConfirmed: result.success,
          },
        });

        return NextResponse.json({ received: true });
      }

      // Check metadata type for group contribution
      if (data.metadata?.type === 'group_contribution') {
        const contribution = await db.groupSendContribution.findFirst({
          where: { paystackRef: data.reference },
        });
        if (contribution && contribution.status === 'pending') {
          await db.groupSendContribution.update({
            where: { id: contribution.id },
            data: { status: 'paid', paidAt: new Date() },
          });

          // Check if total contributions meet target
          const groupSend = await db.groupSend.findUnique({
            where: { id: contribution.groupSendId },
            include: { contributions: true },
          });
          if (groupSend) {
            const totalPaid = groupSend.contributions
              .filter(c => c.status === 'paid')
              .reduce((sum, c) => sum + c.amount, 0);
            if (totalPaid >= groupSend.targetAmount) {
              await db.groupSend.update({
                where: { id: groupSend.id },
                data: { status: 'completed' },
              });
            }
          }
        }
        return NextResponse.json({ received: true });
      }

      // Handle China Corridor payment
      if (data.metadata?.type === 'china_corridor') {
        const reference = data.metadata.reference || data.reference;
        const payment = await db.chinaCorridorPayment.findUnique({
          where: { reference },
        });
        if (payment) {
          await db.chinaCorridorPayment.update({
            where: { reference },
            data: {
              status: 'completed',
              paystackTxId: String(data.id),
              paymentConfirmedAt: new Date(data.paid_at || Date.now()),
              completedAt: new Date(),
            },
          });
        }
        console.log(`[ChinaCorridor] Payment ${data.reference} verified. Amount: ${data.amount / 100}`);
        return NextResponse.json({ received: true });
      }

      // Handle gift voucher payment
      if (data.metadata?.type === 'gift_voucher') {
        const voucherRef = data.metadata?.voucherRef;
        if (voucherRef) {
          await db.giftVoucher.update({
            where: { reference: voucherRef },
            data: {
              status: 'sent',
              issuedAt: new Date(),
              expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            },
          });
        }
        console.log(`[paystackWebhook] Gift voucher ${voucherRef} issued`);
        return NextResponse.json({ received: true });
      }

      const reference = data.reference;
      const txn = await db.transaction.findFirst({
        where: { paystackRef: reference },
        include: { sender: true, recipient: true, provider: true },
      });

      if (!txn) {
        console.warn('[paystackWebhook] Transaction not found for ref:', reference);
        return NextResponse.json({ received: true });
      }

      // Skip if already processed
      if (txn.status === 'processing' || txn.status === 'delivered') {
        return NextResponse.json({ received: true });
      }

      const paystackTxId = String(data.id);
      const authorizationCode = data.authorization?.authorization_code;

      // Save Paystack transaction ID before lifecycle runs (needed for refund)
      await db.transaction.update({
        where: { id: txn.id },
        data: { paystackTxId },
      });

      // Run full lifecycle: AML → provider routing → instruct → notify
      const result = await processTransactionAsync(txn.id);
      console.log('[paystackWebhook] Lifecycle result:', result);

      // Save authorization if user opted in
      if (authorizationCode && data.metadata?.saveCard && txn.senderId) {
        try {
          await db.senderPaystackAuth.upsert({
            where: { senderId: txn.senderId },
            create: {
              senderId: txn.senderId,
              authorizationCode,
              email: data.customer?.email || txn.sender?.email || '',
              signature: data.authorization?.signature || '',
              bin: data.authorization?.bin || '',
              last4: data.authorization?.last4 || '',
              expiryMonth: parseInt(data.authorization?.exp_month) || 0,
              expiryYear: parseInt(data.authorization?.exp_year) || 0,
              cardType: data.authorization?.card_type || '',
              bank: data.authorization?.bank || '',
            },
            update: {
              authorizationCode,
              email: data.customer?.email || txn.sender?.email || '',
              signature: data.authorization?.signature || '',
              bin: data.authorization?.bin || '',
              last4: data.authorization?.last4 || '',
              expiryMonth: parseInt(data.authorization?.exp_month) || 0,
              expiryYear: parseInt(data.authorization?.exp_year) || 0,
              cardType: data.authorization?.card_type || '',
              bank: data.authorization?.bank || '',
              isActive: true,
            },
          });
        } catch (e) {
          console.error('[paystackWebhook] Failed to save auth:', e);
        }
      }
    }

    // Handle charge.failed
    if (eventType === 'charge.failed') {
      const reference = data.reference;
      const txn = await db.transaction.findFirst({ where: { paystackRef: reference } });
      if (txn) {
        await db.transaction.update({
          where: { id: txn.id },
          data: { status: 'failed', failureReason: 'Payment failed at processor', failedAt: new Date() },
        });
        await db.transactionEvent.create({
          data: { transactionId: txn.id, eventType: 'payment_failed', payload: JSON.stringify({ reason: data.gateway_response }), actor: 'system' },
        });
      }
    }

    // Handle refund.processed
    if (eventType === 'refund.processed') {
      const refundRef = data.transaction_reference;
      const txn = await db.transaction.findFirst({
        where: { paystackRef: refundRef },
        include: { sender: true },
      });
      if (txn) {
        await db.transaction.update({
          where: { id: txn.id },
          data: { status: 'refunded' },
        });
        await db.transactionEvent.create({
          data: {
            transactionId: txn.id,
            eventType: 'refund_processed',
            payload: JSON.stringify({
              refundReference: refundRef,
              paystackRef: data.reference,
              amount: data.amount,
              fees: data.fees,
            }),
            actor: 'paystack',
          },
        });
        // Notify sender about refund
        if (txn.sender?.email) {
          const { notifySender } = await import('@/lib/notifications');
          await notifySender(
            txn.sender.email,
            `${txn.sender.firstName || ''} ${txn.sender.lastName || ''}`.trim(),
            'refund_processed',
            {
              reference: txn.reference,
              amount: `${(data.amount / 100).toFixed(2)} ${txn.currencySend}`,
            }
          );
        }
        console.log(`[paystackWebhook] Refund processed for txn ${txn.id}`);
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[paystackWebhook]', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Disable body parsing for this route — we need raw body for signature verification
export async function GET() {
  return NextResponse.json({ status: 'Paystack webhook endpoint' });
}