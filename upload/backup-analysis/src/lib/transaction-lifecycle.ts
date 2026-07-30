import { db } from '@/lib/db';
import { selectBestProvider, instructProvider } from '@/lib/providers';
import { notifySender, notifyRecipient } from '@/lib/notifications';

/**
 * Full transaction lifecycle states:
 * quote → payment_pending → payment_confirmed → (aml_screen) → processing → delivered
 *                                                                              → failed (with refund)
 *                                                                              → flagged (AML hold)
 */

export async function processTransactionAsync(transactionId: string) {
  const txn = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { sender: true, recipient: true, provider: true },
  });

  if (!txn) throw new Error(`Transaction ${transactionId} not found`);
  if (txn.status !== 'payment_pending' && txn.status !== 'payment_confirmed') {
    throw new Error(`Transaction ${transactionId} is in status ${txn.status}, cannot process`);
  }

  try {
    // Step 1: Mark as payment confirmed
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'payment_confirmed', paymentConfirmedAt: new Date() },
    });
    await logEvent(transactionId, 'payment_confirmed', { amount: txn.totalCharged }, 'system');

    // Step 2: AML Screen
    const amlResult = await performAmlScreen(txn);
    await db.transaction.update({
      where: { id: transactionId },
      data: { amlResult: amlResult.result },
    });

    if (amlResult.result === 'flagged') {
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: 'flagged' },
      });
      await db.amlFlag.create({
        data: {
          transactionId,
          senderId: txn.senderId,
          screenType: amlResult.details?.screenType || 'transaction',
          flagReason: amlResult.reason,
          result: 'flagged',
          rawResponse: JSON.stringify(amlResult),
        },
      });
      await logEvent(transactionId, 'aml_flagged', amlResult, 'system');

      // Only auto-refund for non-sanctioned flags
      // Sanctioned country flags are HELD for manual compliance review (POCAMLA)
      const isSanctionedCountry = amlResult.details?.screenType === 'sanctioned_country';
      if (!isSanctionedCountry) {
        await attemptRefund(txn);
      }
      
      return { status: 'flagged', reason: amlResult.reason };
    }

    await logEvent(transactionId, 'aml_clear', amlResult, 'system');

    // Step 3: Route to best provider
    const corridor = `${txn.currencySend.substring(0, 2).toUpperCase()}-${txn.currencyReceive.substring(0, 2).toUpperCase()}`;
    const provider = await selectBestProvider(corridor, txn.rail);

    if (!provider) {
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed', failureReason: 'No provider available for this corridor and rail', failedAt: new Date() },
      });
      await logEvent(transactionId, 'no_provider_available', { corridor, rail: txn.rail }, 'system');
      // Auto-refund
      await attemptRefund(txn);
      return { status: 'failed', reason: 'No provider available' };
    }

    // Step 4: Instruct provider (PRINCIPAL ONLY — non-custodial)
    // We only send the receive amount to the provider, never the full charged amount
    const providerPayload = {
      ...txn,
      amountReceive: txn.amountReceive,
      currencyReceive: txn.currencyReceive,
      recipient: {
        fullName: txn.recipient?.fullName,
        phone: txn.recipient?.phone,
        country: txn.recipient?.country,
        deliveryMethod: txn.recipient?.deliveryMethod,
        mobileNetwork: txn.recipient?.mobileNetwork,
        bankName: txn.recipient?.bankName,
        accountNumber: txn.recipient?.accountNumber,
        bankCode: txn.recipient?.bankCode,
        rippleAddress: txn.recipient?.rippleAddress,
        papssIban: txn.recipient?.papssIban,
      },
    };

    const providerResult = await instructProvider(provider, providerPayload);

    // Step 5: Update transaction to processing
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'processing',
        providerId: provider.id,
        providerRef: providerResult.reference,
        providerInstructedAt: new Date(),
      },
    });
    await logEvent(transactionId, 'provider_instructed', {
      provider: provider.name,
      providerId: provider.id,
      ref: providerResult.reference,
      amount: txn.amountReceive,
      currency: txn.currencyReceive,
    }, 'system');

    // Log provider call
    await db.providerLog.create({
      data: {
        providerId: provider.id,
        transactionId,
        eventType: 'payout_instructed',
        direction: 'outbound',
        payload: JSON.stringify(providerPayload),
        statusCode: providerResult.success ? 200 : 500,
      },
    });

    // Step 6: Notify sender
    if (txn.sender?.email) {
      await notifySender(
        txn.sender.email,
        `${txn.sender.firstName} ${txn.sender.lastName}`,
        'payment_confirmed',
        {
          reference: txn.reference,
          amount: String(txn.amountSend),
          currency: txn.currencySend,
          recipientName: txn.recipient?.fullName || '',
          receiveAmount: String(txn.amountReceive),
          receiveCurrency: txn.currencyReceive,
        }
      );
    }

    // Step 7: Notify recipient
    if (txn.recipient?.phone) {
      await notifyRecipient(
        txn.recipient.phone,
        txn.recipient.fullName,
        'processing',
        {
          senderName: `${txn.sender?.firstName || 'Someone'} ${txn.sender?.lastName || ''}`.trim(),
          amount: `${txn.amountReceive} ${txn.currencyReceive}`,
          currency: txn.currencyReceive,
          eta: getEstimatedDelivery(txn.rail),
          reference: txn.reference,
        }
      );
    }

    return { status: 'processing', providerId: provider.id, providerRef: providerResult.reference };
  } catch (error: any) {
    console.error(`[processTransaction] Error for ${transactionId}:`, error);
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'failed', failureReason: error.message || 'Processing error', failedAt: new Date() },
    });
    await logEvent(transactionId, 'processing_error', { error: error.message }, 'system');
    await attemptRefund(txn);
    return { status: 'failed', reason: error.message };
  }
}

/**
 * Handle delivery confirmation from provider webhook.
 */
export async function handleDeliveryConfirmation(transactionId: string, outcome: 'delivered' | 'failed', providerPayload?: any) {
  const txn = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { sender: true, recipient: true },
  });

  if (!txn) throw new Error(`Transaction ${transactionId} not found`);

  if (outcome === 'delivered') {
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
        feeConfirmed: true,
      },
    });
    await logEvent(transactionId, 'delivered', providerPayload || {}, 'provider');

    // Notify sender — delivered
    if (txn.sender?.email) {
      await notifySender(
        txn.sender.email,
        `${txn.sender.firstName} ${txn.sender.lastName}`,
        'delivered',
        {
          reference: txn.reference,
          amount: String(txn.amountSend),
          currency: txn.currencySend,
          recipientName: txn.recipient?.fullName || '',
        }
      );
    }

    // Notify recipient — delivered
    if (txn.recipient?.phone) {
      await notifyRecipient(
        txn.recipient.phone,
        txn.recipient.fullName,
        'delivered',
        {
          senderName: `${txn.sender?.firstName || 'Someone'} ${txn.sender?.lastName || ''}`.trim(),
          amount: `${txn.amountReceive} ${txn.currencyReceive}`,
          currency: txn.currencyReceive,
          reference: txn.reference,
        }
      );
    }

    return { status: 'delivered' };
  }

  if (outcome === 'failed') {
    const reason = providerPayload?.reason || 'Delivery failed at provider';
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'failed', failureReason: reason, failedAt: new Date() },
    });
    await logEvent(transactionId, 'delivery_failed', { ...providerPayload, reason }, 'provider');

    // Auto-refund on delivery failure
    await attemptRefund(txn);

    // Notify sender — failed
    if (txn.sender?.email) {
      await notifySender(
        txn.sender.email,
        `${txn.sender.firstName} ${txn.sender.lastName}`,
        'failed',
        {
          reference: txn.reference,
          amount: String(txn.amountSend),
          currency: txn.currencySend,
          reason,
        }
      );
    }

    return { status: 'failed', reason };
  }

  throw new Error(`Invalid outcome: ${outcome}`);
}

// ─── Internal helpers ────────────────────────────────────────────

async function performAmlScreen(txn: any): Promise<{ result: string; reason: string; details: any }> {
  // Sanctioned countries check (POCAMLA / OFAC / EU / HM Treasury)
  const SANCTIONED_COUNTRIES = (process.env.SANCTIONED_COUNTRIES || 'IR,KP,SY,CU,RU,BY,MM,SD,LY,SO').split(',').map(c => c.trim().toUpperCase());

  const recipientCountry = txn.recipient?.country?.toUpperCase() || '';
  if (SANCTIONED_COUNTRIES.includes(recipientCountry)) {
    return {
      result: 'flagged',
      reason: `Recipient country (${recipientCountry}) is on sanctioned countries list`,
      details: { screenType: 'sanctioned_country', country: recipientCountry },
    };
  }

  // In production, this would call a real AML provider (e.g., ComplyAdvantage, SumSub)
  // For now: 95% clear, 5% flagged based on amount thresholds
  const highAmountThreshold = 5000; // GBP

  if (txn.amountSend > highAmountThreshold) {
    return {
      result: 'review',
      reason: `High-value transaction: ${txn.amountSend} ${txn.currencySend} exceeds threshold`,
      details: { amount: txn.amountSend, threshold: highAmountThreshold },
    };
  }

  const flagged = Math.random() > 0.95;
  if (flagged) {
    return {
      result: 'flagged',
      reason: 'Potential match on sanctions watchlist',
      details: { screenType: 'automated' },
    };
  }

  return { result: 'clear', reason: '', details: { screenType: 'automated' } };
}

async function attemptRefund(txn: any) {
  if (txn.paystackTxId) {
    try {
      const { refundTransaction } = await import('@/lib/paystack');
      const result = await refundTransaction(parseInt(txn.paystackTxId));
      await logEvent(txn.id, 'refund_initiated', result, 'system');
      console.log(`[refund] Initiated refund for txn ${txn.id}:`, result.message);
    } catch (e: any) {
      console.error(`[refund] Failed for txn ${txn.id}:`, e);
      await logEvent(txn.id, 'refund_failed', { error: e.message }, 'system');
    }
  }
}

function getEstimatedDelivery(rail: string): string {
  switch (rail) {
    case 'mobile_money': return '~1-5 minutes';
    case 'bank': return '~1-2 hours';
    case 'ripple': return '~3-5 minutes';
    case 'papss': return '~10-30 minutes';
    default: return '~30 minutes';
  }
}

async function logEvent(transactionId: string, eventType: string, payload: any, actor: string) {
  try {
    await db.transactionEvent.create({
      data: {
        transactionId,
        eventType,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        actor,
      },
    });
  } catch (e) {
    console.error(`[logEvent] Failed to log ${eventType}:`, e);
  }
}