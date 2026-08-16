/**
 * M-Pesa Content Callback — Webhook
 *
 * Daraja sends this POST when the STK Push completes (success or failure).
 *
 * On success (ResultCode 0):
 *   - Insert ContentTicket (60/40 split)
 *   - Increment Video.viewCount
 *   - Credit creator balance
 *   - Auto-queue payout if balance >= KES 1000
 *   - Handle referral tracking
 *
 * Daraja ALWAYS expects a 200 response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

const CREATOR_SHARE_PCT = 0.6;  // 60% to creator
const PLATFORM_SHARE_PCT = 0.4; // 40% to platform
const PAYOUT_THRESHOLD_KES = 1000;

interface StkCallbackItem {
  Name: string;
  Value: string | number;
}

export async function POST(req: NextRequest) {
  try {
    // Always return 200 to Daraja, even on errors
    const body = await req.json();
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error('[mpesa-content-callback] Missing stkCallback in body');
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback as {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: StkCallbackItem[] };
    };

    console.log(
      `[mpesa-content-callback] MerchantRequestID=${MerchantRequestID}, ResultCode=${ResultCode}, Desc=${ResultDesc}`,
    );

    if (!dbReady) {
      console.error('[mpesa-content-callback] Database not available');
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // ── Failure path — delete pending checkout ──────────────────
    if (ResultCode !== 0) {
      try {
        await db.pendingContentCheckout.delete({
          where: { merchantRequestId: MerchantRequestID },
        });
      } catch (err) {
        // Pending checkout may not exist; ignore
        console.error('[mpesa-content-callback] Failed to delete pending checkout:', err);
      }

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // ── Success path ────────────────────────────────────────────

    // Extract metadata fields
    let mpesaReceiptNumber = '';
    let amountPaid = 0;

    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = String(item.Value);
        }
        if (item.Name === 'Amount') {
          amountPaid = Number(item.Value) || 0;
        }
      }
    }

    // Look up pending checkout
    const pending = await db.pendingContentCheckout.findUnique({
      where: { merchantRequestId: MerchantRequestID },
    });

    if (!pending) {
      console.error(
        `[mpesa-content-callback] No PendingContentCheckout found for MerchantRequestID=${MerchantRequestID}`,
      );
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // Calculate shares
    const creatorShare = Math.round(amountPaid * CREATOR_SHARE_PCT * 100) / 100;
    const platformShare = Math.round(amountPaid * PLATFORM_SHARE_PCT * 100) / 100;

    // ── Atomic transaction ──────────────────────────────────────
    try {
      await db.$transaction(async (tx) => {
        // a) Insert ContentTicket
        await tx.contentTicket.create({
          data: {
            videoId: pending.videoId,
            viewerPhone: pending.viewerPhone,
            mpesaReceiptNumber,
            amountPaid,
            creatorShare,
            platformShare,
            referralCode: pending.referralCode,
          },
        });

        // b) Increment Video.viewCount
        await tx.video.update({
          where: { id: pending.videoId },
          data: { viewCount: { increment: 1 } },
        });

        // c) Credit creator balance
        const updatedCreator = await tx.creatorProfile.update({
          where: { id: pending.creatorId },
          data: { balanceKes: { increment: creatorShare } },
        });

        // d) Auto-queue payout if balance >= threshold
        if (updatedCreator.balanceKes >= PAYOUT_THRESHOLD_KES) {
          // Fetch payout phone from creator profile
          const creator = await tx.creatorProfile.findUnique({
            where: { id: pending.creatorId },
            select: { mpesaPayoutNumber: true },
          });

          if (creator) {
            await tx.outboundCreatorPayout.create({
              data: {
                creatorId: pending.creatorId,
                amountToPay: updatedCreator.balanceKes,
                phoneTarget: creator.mpesaPayoutNumber,
                status: 'queued',
                meta: JSON.stringify({
                  merchantRequestId: MerchantRequestID,
                  checkoutRequestId: CheckoutRequestID,
                }),
              },
            });

            // Zero out the creator balance in the same transaction
            await tx.creatorProfile.update({
              where: { id: pending.creatorId },
              data: { balanceKes: 0 },
            });
          }
        }

        // e) Delete PendingContentCheckout
        await tx.pendingContentCheckout.delete({
          where: { merchantRequestId: MerchantRequestID },
        });
      });

      // ── Referral handling ──────────────────────────────────────
      if (pending.referralCode) {
        try {
          // Check if this is a first purchase from this phone (simple record)
          const existingRef = await db.contentTicket.findFirst({
            where: {
              viewerPhone: pending.viewerPhone,
              referralCode: pending.referralCode,
            },
            select: { id: true },
          });

          if (!existingRef) {
            // First purchase via this referral code — credit the referrer.
            // TODO: Actual reward mechanic is pending kennedy-decision.
            // For now, just ensure the referral code is tracked on the ticket
            // (already done above via referralCode on ContentTicket).
            console.log(
              `[mpesa-content-callback] Referral tracked: code=${pending.referralCode}, phone=${pending.viewerPhone}`,
            );
          }
        } catch (refErr) {
          console.error('[mpesa-content-callback] Referral handling error:', refErr);
        }
      }

      console.log(
        `[mpesa-content-callback] SUCCESS: ticket created for ${pending.videoId}, KES ${amountPaid} (${creatorShare}/${platformShare} split)`,
      );
    } catch (txErr) {
      console.error('[mpesa-content-callback] Transaction error:', txErr);
      // Don't retry — Daraja doesn't retry on 200
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[mpesa-content-callback] Unexpected error:', err);
    // Always return 200 to Daraja
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
