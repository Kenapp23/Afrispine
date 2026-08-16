/**
 * Content Payout Processor — Drain Function
 *
 * Queries OutboundCreatorPayout rows with status='queued' and processes
 * them via B2C M-Pesa payout. Meant to be called by a cron or interval.
 *
 * Usage:
 *   import { processCreatorPayouts } from '@/lib/payments/content-payout-processor';
 *   setInterval(() => processCreatorPayouts(), 60_000);
 */

import { db, dbReady } from '@/lib/db';
import { initiateB2CPayout } from '@/lib/daraja';

const BATCH_SIZE = 10;

export async function processCreatorPayouts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const result = { processed: 0, succeeded: 0, failed: 0 };

  if (!dbReady) {
    console.warn('[content-payout-processor] Database not available, skipping');
    return result;
  }

  try {
    // Fetch queued payouts (limit to prevent runaway processing)
    const queued = await db.outboundCreatorPayout.findMany({
      where: { status: 'queued' },
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (queued.length === 0) {
      return result;
    }

    const callbackUrl =
      `${process.env.APP_URL ?? 'https://www.afri-spine.com'}/api/webhooks/mpesa-b2c-callback`;

    for (const payout of queued) {
      result.processed++;

      try {
        // Update status to processing first
        await db.outboundCreatorPayout.update({
          where: { id: payout.id },
          data: { status: 'processing' },
        });

        // Initiate B2C payout
        const b2cResult = await initiateB2CPayout(
          payout.phoneTarget,
          payout.amountToPay,
          `AfriSpine creator payout for ${payout.id}`,
          callbackUrl,
        );

        if (b2cResult.success) {
          await db.outboundCreatorPayout.update({
            where: { id: payout.id },
            data: {
              status: 'completed',
              meta: JSON.stringify({
                ...(payout.meta ? JSON.parse(payout.meta) : {}),
                conversationId: b2cResult.conversationId,
                originatorConversationId: b2cResult.originatorConversationId,
                completedAt: new Date().toISOString(),
              }),
            },
          });
          result.succeeded++;
        } else {
          await db.outboundCreatorPayout.update({
            where: { id: payout.id },
            data: {
              status: 'failed',
              errorLog: b2cResult.error ?? 'B2C payout returned failure',
              meta: JSON.stringify({
                ...(payout.meta ? JSON.parse(payout.meta) : {}),
                responseCode: b2cResult.responseCode,
                responseDescription: b2cResult.responseDescription,
                failedAt: new Date().toISOString(),
              }),
            },
          });
          result.failed++;
        }
      } catch (err) {
        console.error(
          `[content-payout-processor] Error processing payout ${payout.id}:`,
          err,
        );
        await db.outboundCreatorPayout.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
            errorLog: err instanceof Error ? err.message : 'Unknown processing error',
          },
        }).catch(() => {
          // If update also fails, just log
          console.error(
            `[content-payout-processor] Failed to update payout ${payout.id} status`,
          );
        });
        result.failed++;
      }
    }

    console.log(
      `[content-payout-processor] Batch complete: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.processed}`,
    );
  } catch (err) {
    console.error('[content-payout-processor] Fatal error:', err);
  }

  return result;
}
