/**
 * Bill Pay — Initialize Collection
 *
 * Creates a BillPayment record + audit Transaction,
 * initializes a payment collection, returns checkout URL.
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
      currency,
      billType,
      accountReference,
      billerPaybill,
      billerName,
      accountHolderName,
      dstvPackage,
      billAmountKes,
      usdTotal,
      reference,
      senderEmail,
    } = body;

    const numAmount = Number(amount || billAmountKes);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!billType) {
      return NextResponse.json({ error: 'Bill type is required' }, { status: 400 });
    }

    // Generate reference
    const ref = reference || `AB-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const idempotencyKey = body.idempotencyKey || `idem-bill-${ref}`;

    // ── Idempotency check ─────────────────────────────────────────────
    if (dbReady) {
      try {
        const existing = await db.idempotencyRecord.findUnique({
          where: { key: idempotencyKey },
        });
        if (existing) {
          if (existing.status === 'completed' && existing.responseRef) {
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
              endpoint: 'bills/initialize',
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
          console.error('[bills/initialize] Idempotency create error:', createErr);
        }
      } catch (err) {
        console.error('[bills/initialize] Idempotency DB error:', err);
      }
    }

    // ── Get sender from auth ──────────────────────────────────────────
    const sender = getSenderFromRequest(req);
    const senderId = sender?.id || null;

    // ── Create BillPayment record ─────────────────────────────────────
    let billId: string | undefined;
    let txId: string | undefined;

    if (dbReady) {
      try {
        const bill = await db.billPayment.create({
          data: {
            senderId,
            provider: 'mock', // will be updated below
            billType,
            accountNumber: accountReference || null,
            amount: numAmount,
            currency: currency || 'KES',
            status: 'pending',
            reference: ref,
          },
        });
        billId = bill.id;

        // Also create a Transaction record for audit trail
        const tx = await db.transaction.create({
          data: {
            reference: ref,
            senderId: senderId || 'anonymous',
            status: 'pending',
            sendCurrency: 'USD',
            sendAmount: Number(usdTotal) || numAmount,
            receiveCurrency: currency || 'KES',
            receiveAmount: numAmount,
            providerSlug: 'mock',
            purpose: 'bill_payment',
            billType,
            billAccountRef: accountReference || null,
          },
        });
        txId = tx.id;
      } catch (err) {
        console.error('[bills/initialize] DB create error:', err);
      }
    }

    // ── Initialize collection ─────────────────────────────────────────
    let provider;
    try {
      provider = await getProvider();
    } catch (err) {
      if (err instanceof ProviderInitializationError) {
        console.error('[bills/initialize] Provider init error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      throw err;
    }
    if (!provider) {
      if (dbReady && idempotencyKey) {
        try {
          await db.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'failed' },
          });
        } catch { /* ignore */ }
      }
      return NextResponse.json(
        { error: 'Payment processor not available.' },
        { status: 503 }
      );
    }

    try {
      const collection = await provider.initializeCollection({
        amount: Number(usdTotal) || numAmount,
        currency: 'USD',
        method: 'card',
        email: senderEmail,
        country: 'GB',
        metadata: {
          reference: ref,
          bill_type: billType,
          bill_account_ref: accountReference || '',
          purpose: 'bill_payment',
        },
        idempotencyKey,
      });

      // Update records with provider ID
      if (dbReady) {
        if (billId) {
          try {
            await db.billPayment.update({
              where: { id: billId },
              data: { eversendId: collection.providerId, provider: provider.name },
            });
          } catch { /* ignore */ }
        }
        if (txId) {
          try {
            await db.transaction.update({
              where: { id: txId },
              data: { eversendId: collection.providerId, providerSlug: provider.name },
            });
          } catch { /* ignore */ }
        }
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
      console.error('[bills/initialize] Collection error:', err);

      if (dbReady && idempotencyKey) {
        try {
          await db.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'failed' },
          });
        } catch { /* ignore */ }
      }

      const msg = err instanceof Error ? err.message : 'Failed to initialize bill payment.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err) {
    console.error('[bills/initialize] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
