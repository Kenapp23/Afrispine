/**
 * M-Pesa Sponsor Callback — Webhook
 *
 * Daraja sends this POST when the STK Push completes (success or failure)
 * for a sponsor campaign payment.
 *
 * On success (ResultCode 0):
 *   - Update campaign: paymentStatus = 'paid', status = 'active'
 *   - Set mpesaReceiptNumber, paidAt, approvedAt
 *   - Activate all campaign slots
 *
 * Daraja ALWAYS expects a 200 response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

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
      console.error('[mpesa-sponsor-callback] Missing stkCallback in body');
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
      `[mpesa-sponsor-callback] MerchantRequestID=${MerchantRequestID}, ResultCode=${ResultCode}, Desc=${ResultDesc}`,
    );

    if (!dbReady) {
      console.error('[mpesa-sponsor-callback] Database not available');
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // ── Failure path ────────────────────────────────────────────
    if (ResultCode !== 0) {
      try {
        await db.sponsorCampaign.updateMany({
          where: { merchantRequestId: MerchantRequestID },
          data: { paymentStatus: 'failed' },
        });
      } catch (err) {
        console.error('[mpesa-sponsor-callback] Failed to update campaign on failure:', err);
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

    // a) Find SponsorCampaign by merchantRequestId
    const campaign = await db.sponsorCampaign.findFirst({
      where: { merchantRequestId: MerchantRequestID },
      include: { slots: true },
    });

    if (!campaign) {
      console.error(
        `[mpesa-sponsor-callback] No SponsorCampaign found for MerchantRequestID=${MerchantRequestID}`,
      );
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const now = new Date();

    // b) Update campaign: paymentStatus = 'paid', mpesaReceiptNumber, status = 'active', paidAt, approvedAt
    // c) Update all slots from 'pending' to 'active'
    try {
      await db.$transaction(async (tx) => {
        await tx.sponsorCampaign.update({
          where: { id: campaign.id },
          data: {
            paymentStatus: 'paid',
            mpesaReceiptNumber: mpesaReceiptNumber || null,
            status: 'active',
            paidAt: now,
            approvedAt: now,
          },
        });

        // Activate all slots that are still pending
        await tx.sponsorSlot.updateMany({
          where: {
            campaignId: campaign.id,
            status: 'pending',
          },
          data: { status: 'active' },
        });
      });

      console.log(
        `[mpesa-sponsor-callback] SUCCESS: campaign ${campaign.id} activated, KES ${amountPaid}, receipt=${mpesaReceiptNumber}`,
      );
    } catch (txErr) {
      console.error('[mpesa-sponsor-callback] Transaction error:', txErr);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[mpesa-sponsor-callback] Unexpected error:', err);
    // Always return 200 to Daraja
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
