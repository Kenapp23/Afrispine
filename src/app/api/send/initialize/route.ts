/**
 * Send Money — Initialize Collection
 *
 * Creates a Transaction record, initializes a payment collection,
 * and returns the checkout URL for the user to complete payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db, dbReady } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { getProvider, ProviderInitializationError } from '@/lib/payments/adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      sendCurrency,
      sendAmount,
      receiveCurrency,
      receiveAmount,
      fxRate,
      feeAmount,
      totalCharged,
      recipientPhone,
      recipientName,
      recipientCountry,
      rail,
      corridor,
      senderEmail,
      reference,
    } = body;

    // Validate required fields
    const numAmount = Number(amount || sendAmount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!sendCurrency) {
      return NextResponse.json({ error: 'Send currency is required' }, { status: 400 });
    }

    // Generate reference if not provided
    const ref = reference || `AS-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const idempotencyKey = body.idempotencyKey || `idem-${ref}`;

    // ── Idempotency check (only if DB is ready) ───────────────────────
    if (dbReady) {
      try {
        const existing = await db.idempotencyRecord.findUnique({
          where: { key: idempotencyKey },
        });
        if (existing) {
          if (existing.status === 'completed' && existing.responseRef) {
            // Return cached result
            return NextResponse.json({
              reference: existing.responseRef,
              status: 'completed',
              message: 'Already processed',
            });
          }
          if (existing.status === 'processing') {
            return NextResponse.json(
              { error: 'Request is being processed' },
              { status: 409 }
            );
          }
        }

        // Create idempotency record — catch P2002 (unique constraint) for
        // the race where two near-simultaneous requests both see "not found"
        // and both try to insert. Treat it as "another request is already
        // handling this" — the same as the 'processing' case above.
        try {
          await db.idempotencyRecord.create({
            data: {
              key: idempotencyKey,
              endpoint: 'send/initialize',
              requestHash: randomBytes(16).toString('hex'),
              status: 'processing',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        } catch (createErr: unknown) {
          const prismaErr = createErr as { code?: string };
          if (prismaErr.code === 'P2002') {
            // Unique constraint violation — another request won the race.
            // Re-fetch to give the most helpful response.
            const retry = await db.idempotencyRecord.findUnique({
              where: { key: idempotencyKey },
            });
            if (retry?.status === 'completed' && retry.responseRef) {
              return NextResponse.json({
                reference: retry.responseRef,
                status: 'completed',
                message: 'Already processed',
              });
            }
            return NextResponse.json(
              { error: 'Request is being processed' },
              { status: 409 }
            );
          }
          // Some other DB error — log and let the request proceed
          // (degraded mode: idempotency is a safety net, not a hard gate)
          console.error('[send/initialize] Idempotency create error:', createErr);
        }
      } catch (err) {
        console.error('[send/initialize] Idempotency DB error:', err);
      }
    }

    // ── Get sender from auth ──────────────────────────────────────────
    const sender = getSenderFromRequest(req);
    const senderId = sender?.id || 'anonymous';

    // ── Create Transaction record ─────────────────────────────────────
    let txId: string | undefined;
    if (dbReady) {
      try {
        const tx = await db.transaction.create({
          data: {
            reference: ref,
            senderId,
            status: 'pending',
            sendCurrency: sendCurrency || 'USD',
            sendAmount: numAmount,
            receiveCurrency: receiveCurrency || '',
            receiveAmount: receiveAmount ? Number(receiveAmount) : null,
            fxRate: fxRate ? Number(fxRate) : null,
            feeAmount: feeAmount ? Number(feeAmount) : 0,
            totalCharged: totalCharged ? Number(totalCharged) : numAmount,
            corridor: corridor || '',
            rail: rail || '',
            recipientName: recipientName || null,
            recipientPhone: recipientPhone || null,
            providerSlug: 'mock', // will be updated below
            purpose: 'send',
          },
        });
        txId = tx.id;
      } catch (err) {
        console.error('[send/initialize] Transaction create error:', err);
      }
    }

    // ── Initialize collection via provider ────────────────────────────
    let provider;
    try {
      provider = await getProvider();
    } catch (err) {
      if (err instanceof ProviderInitializationError) {
        console.error('[send/initialize] Provider init error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      throw err;
    }
    if (!provider) {
      // Fail the idempotency record
      if (dbReady && idempotencyKey) {
        try {
          await db.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'failed' },
          });
        } catch { /* ignore */ }
      }
      return NextResponse.json(
        { error: 'Payment processor not available. Please try again later.' },
        { status: 503 }
      );
    }

    try {
      const collection = await provider.initializeCollection({
        amount: numAmount,
        currency: sendCurrency || 'USD',
        method: 'card',
        email: senderEmail,
        country: 'GB',
        metadata: {
          reference: ref,
          recipient_country: recipientCountry || '',
          receive_currency: receiveCurrency || '',
          purpose: 'send',
        },
        idempotencyKey,
      });

      // Update Transaction with provider ID and slug
      if (dbReady && txId) {
        try {
          await db.transaction.update({
            where: { id: txId },
            data: {
              eversendId: collection.providerId,
              providerSlug: provider.name,
            },
          });
        } catch { /* ignore */ }
      }

      // Mark idempotency as completed
      if (dbReady && idempotencyKey) {
        try {
          await db.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'completed', responseRef: ref },
          });
        } catch { /* ignore */ }
      }

      return NextResponse.json({
        reference: ref,
        collectionId: collection.providerId,
        checkoutUrl: collection.checkoutUrl,
        status: collection.status,
      });
    } catch (err) {
      console.error('[send/initialize] Collection error:', err);

      // Fail the idempotency record
      if (dbReady && idempotencyKey) {
        try {
          await db.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'failed' },
          });
        } catch { /* ignore */ }
      }

      const msg = err instanceof Error ? err.message : 'Failed to initialize transfer. Please try again.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err) {
    console.error('[send/initialize] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
