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
 *   - Handle referral tracking (5% commission from platform share)
 *   - Upsert ContentViewer for buyer & referrer
 *
 * Daraja ALWAYS expects a 200 response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

const DEFAULT_CREATOR_SHARE_PCT = 0.6;   // 60% to creator (premiere window)
const DEFAULT_PLATFORM_SHARE_PCT = 0.4;  // 40% to platform
const REFERRAL_COMMISSION_PCT = 0.05; // 5% referral commission (deducted from platform share)
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

    // Fetch video to determine rev-share rate
    // For standard (VOD) content, use video.vodRevSharePct if set;
    // otherwise fall back to the default 60/40.
    const video = await db.video.findUnique({
      where: { id: pending.videoId },
      select: { vodRevSharePct: true },
    });

    const creatorSharePct =
      (video?.vodRevSharePct != null)
        ? video.vodRevSharePct
        : DEFAULT_CREATOR_SHARE_PCT;
    const platformSharePct = 1 - creatorSharePct;

    // Calculate shares using the video's rate
    const creatorShare = Math.round(amountPaid * creatorSharePct * 100) / 100;
    const platformShare = Math.round(amountPaid * platformSharePct * 100) / 100;
    const referralCommission = pending.referralCode
      ? Math.round(amountPaid * REFERRAL_COMMISSION_PCT * 100) / 100
      : 0;

    // ── Atomic transaction ──────────────────────────────────────
    try {
      await db.$transaction(async (tx) => {
        // a) Upsert ContentViewer for buyer
        const buyerViewer = await tx.contentViewer.upsert({
          where: { phone: pending.viewerPhone },
          update: {},
          create: { phone: pending.viewerPhone },
        });

        // b) Insert ContentTicket with viewerId
        const ticket = await tx.contentTicket.create({
          data: {
            videoId: pending.videoId,
            viewerPhone: pending.viewerPhone,
            viewerId: buyerViewer.id,
            mpesaReceiptNumber,
            amountPaid,
            creatorShare,
            platformShare,
            referralCode: pending.referralCode,
          },
        });

        // c) Handle referral commission (5% from platform share)
        if (pending.referralCode && referralCommission > 0) {
          // Find the ShareEvent that generated this referral code
          const shareEvent = await tx.shareEvent.findFirst({
            where: { referralCode: pending.referralCode },
            include: { viewer: { select: { id: true, phone: true } } },
          });

          if (shareEvent) {
            const referrerPhone = shareEvent.viewer?.phone;

            if (referrerPhone) {
              // Ensure referrer has a ContentViewer record
              await tx.contentViewer.upsert({
                where: { phone: referrerPhone },
                update: {},
                create: { phone: referrerPhone },
              });

              // Create the ReferralReward record
              await tx.referralReward.create({
                data: {
                  referrerPhone,
                  ticketId: ticket.id,
                  videoId: pending.videoId,
                  amountKes: referralCommission,
                  commissionPct: REFERRAL_COMMISSION_PCT,
                  paidOut: false,
                },
              });

              console.log(
                `[mpesa-content-callback] Referral commission: KES ${referralCommission} (${REFERRAL_COMMISSION_PCT * 100}%) credited to ${referrerPhone}`,
              );
            } else {
              console.warn(
                `[mpesa-content-callback] ShareEvent found for code=${pending.referralCode} but no viewer phone linked`,
              );
            }
          } else {
            console.warn(
              `[mpesa-content-callback] No ShareEvent found for referral code=${pending.referralCode}`,
            );
          }
        }

        // d) Increment Video.viewCount
        await tx.video.update({
          where: { id: pending.videoId },
          data: { viewCount: { increment: 1 } },
        });

        // e) Credit creator balance
        const updatedCreator = await tx.creatorProfile.update({
          where: { id: pending.creatorId },
          data: { balanceKes: { increment: creatorShare } },
        });

        // f) Auto-queue payout if balance >= threshold
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

        // g) Delete PendingContentCheckout
        await tx.pendingContentCheckout.delete({
          where: { merchantRequestId: MerchantRequestID },
        });
      });

      const commissionNote = referralCommission > 0
        ? ` (referral commission: KES ${referralCommission})`
        : '';

      console.log(
        `[mpesa-content-callback] SUCCESS: ticket created for ${pending.videoId}, KES ${amountPaid} (${creatorShare}/${platformShare} split)${commissionNote}`,
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
