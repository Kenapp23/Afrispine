/**
 * Content Checkout — Initiate STK Push
 *
 * Accepts a videoId + phone number, validates, creates a PendingContentCheckout,
 * and fires an M-Pesa STK Push. The user completes payment on their phone;
 * Daraja calls our webhook asynchronously.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { initiateStkPush } from '@/lib/daraja';

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, phone, referralCode } = body as {
      videoId?: string;
      phone?: string;
      referralCode?: string;
    };

    // ── Validation ──────────────────────────────────────────────
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || !phone.startsWith('254')) {
      return NextResponse.json(
        { error: 'Phone must start with 254 (e.g. 254712345678)' },
        { status: 400 },
      );
    }

    // ── Idempotency — reuse videoId+phone combo ────────────────
    const idempotencyKey = `content-checkout-${videoId}-${phone}`;
    try {
      const existing = await db.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });
      if (existing) {
        if (existing.status === 'completed' && existing.responseRef) {
          return NextResponse.json({
            merchantRequestId: existing.responseRef,
            message: 'Checkout already initiated',
          });
        }
        if (existing.status === 'processing') {
          return NextResponse.json(
            { error: 'Checkout is being processed' },
            { status: 409 },
          );
        }
      }

      try {
        await db.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            endpoint: 'content/checkout/initiate',
            requestHash: '',
            status: 'processing',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (createErr: unknown) {
        const prismaErr = createErr as { code?: string };
        if (prismaErr.code === 'P2002') {
          return NextResponse.json(
            { error: 'Checkout is being processed' },
            { status: 409 },
          );
        }
        console.error('[content/checkout/initiate] Idempotency create error:', createErr);
      }
    } catch (err) {
      console.error('[content/checkout/initiate] Idempotency DB error:', err);
    }

    // ── Look up video ──────────────────────────────────────────
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { id: true, ticketPriceKes: true, creatorId: true, status: true },
    });

    if (!video || video.status !== 'live') {
      return NextResponse.json({ error: 'Video not found or not available' }, { status: 404 });
    }

    // ── Generate unique merchant request ID ──────────────────────
    const merchantRequestId = `MRC_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // ── Create PendingContentCheckout ────────────────────────────
    try {
      await db.pendingContentCheckout.create({
        data: {
          merchantRequestId,
          videoId,
          creatorId: video.creatorId,
          viewerPhone: phone,
          referralCode: referralCode ?? null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        },
      });
    } catch (createErr: unknown) {
      console.error('[content/checkout/initiate] PendingCheckout create error:', createErr);
    }

    // ── Initiate STK Push ──────────────────────────────────────
    const callbackUrl =
      `${process.env.APP_URL ?? 'https://www.afri-spine.com'}/api/webhooks/mpesa-content-callback`;

    const stkResult = await initiateStkPush(
      phone,
      video.ticketPriceKes,
      merchantRequestId,
      callbackUrl,
    );

    if (!stkResult.success) {
      // Clean up pending checkout on STK failure
      try {
        await db.pendingContentCheckout.delete({
          where: { merchantRequestId },
        });
      } catch { /* ignore */ }

      // Mark idempotency as failed
      try {
        await db.idempotencyRecord.update({
          where: { key: idempotencyKey },
          data: { status: 'failed' },
        });
      } catch { /* ignore */ }

      return NextResponse.json(
        { error: stkResult.error ?? 'Failed to initiate M-Pesa payment' },
        { status: 500 },
      );
    }

    // ── Mark idempotency as completed ───────────────────────────
    try {
      await db.idempotencyRecord.update({
        where: { key: idempotencyKey },
        data: { status: 'completed', responseRef: merchantRequestId },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
    });
  } catch (err) {
    console.error('[content/checkout/initiate] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
