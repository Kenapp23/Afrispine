/**
 * Shared Webhook Processing Logic
 *
 * Both the Eversend webhook and the Mock webhook complete route
 * use this same logic to update Transaction/BillPayment records.
 */

import { db, dbReady } from '@/lib/db';
import type { WebhookPayload } from './adapter';

const HANDLED_EVENTS = [
  'collection.completed',
  'collection.failed',
  'payout.completed',
  'payout.failed',
];

export function isHandledEvent(event: string): boolean {
  return HANDLED_EVENTS.includes(event);
}

export interface WebhookProcessResult {
  ok: boolean;
  event: string;
  id: string;
  message?: string;
}

/**
 * Process a verified webhook payload.
 * Updates Transaction and BillPayment records, creates TransactionEvents.
 */
export async function processWebhookPayload(payload: WebhookPayload): Promise<WebhookProcessResult> {
  const { event, data } = payload;
  const result: WebhookProcessResult = { ok: true, event, id: data.id };

  if (!isHandledEvent(event)) {
    return result;
  }

  console.log(`[webhook] Processing ${event} for ${data.id}`);

  if (!dbReady) {
    console.warn('[webhook] DB not ready — skipping processing');
    return { ok: true, event, id: data.id, message: 'DB not ready' };
  }

  try {
    // Determine target status
    let targetStatus: string | null = null;
    if (event === 'collection.completed' || event === 'payout.completed') {
      targetStatus = 'completed';
    } else if (event === 'collection.failed' || event === 'payout.failed') {
      targetStatus = 'failed';
    }

    if (!targetStatus) {
      return result;
    }

    // Terminal state guard — if collection event, look for Transaction first
    if (event.startsWith('collection.')) {
      // Try Transaction by eversendId
      const tx = await db.transaction.findUnique({ where: { eversendId: data.id } });
      if (tx) {
        // Idempotent: if already in terminal state, do nothing
        if (tx.status === 'completed' || tx.status === 'failed') {
          console.log(`[webhook] Transaction ${tx.id} already in terminal state '${tx.status}' — skipping`);
          return result;
        }
        await db.transaction.update({
          where: { id: tx.id },
          data: { status: targetStatus },
        });
        // Log TransactionEvent
        await db.transactionEvent.create({
          data: {
            transactionId: tx.id,
            type: event,
            status: targetStatus,
            provider: 'eversend',
            payload: JSON.stringify(data),
          },
        });
        console.log(`[webhook] Transaction ${tx.id} → ${targetStatus}`);
        return result;
      }

      // Try BillPayment by eversendId
      const bill = await db.billPayment.findFirst({ where: { eversendId: data.id } });
      if (bill) {
        const billStatus = targetStatus === 'completed' ? 'payment_received' : 'failed';
        // Idempotent
        if (bill.status === billStatus) {
          console.log(`[webhook] BillPayment ${bill.id} already '${billStatus}' — skipping`);
          return result;
        }
        await db.billPayment.update({
          where: { id: bill.id },
          data: { status: billStatus },
        });
        console.log(`[webhook] BillPayment ${bill.id} → ${billStatus}`);
        return result;
      }

      // Neither found — log and return 200
      console.log(`[webhook] No Transaction or BillPayment found for ${data.id}`);
      return result;
    }

    // Payout events
    if (event.startsWith('payout.')) {
      const tx = await db.transaction.findUnique({ where: { eversendId: data.id } });
      if (tx) {
        if (tx.status === 'completed' || tx.status === 'failed') {
          console.log(`[webhook] Transaction ${tx.id} already in terminal state '${tx.status}' — skipping`);
          return result;
        }
        await db.transaction.update({
          where: { id: tx.id },
          data: { status: targetStatus },
        });
        await db.transactionEvent.create({
          data: {
            transactionId: tx.id,
            type: event,
            status: targetStatus,
            provider: 'eversend',
            payload: JSON.stringify(data),
          },
        });
        console.log(`[webhook] Transaction ${tx.id} (payout) → ${targetStatus}`);
        return result;
      }

      console.log(`[webhook] No Transaction found for payout ${data.id}`);
      return result;
    }
  } catch (dbErr) {
    console.error('[webhook] DB error:', dbErr);
    // Still return ok to prevent retries
  }

  return result;
}
