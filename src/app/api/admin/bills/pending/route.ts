/**
 * Admin — Pending Bill Payments
 *
 * Returns BillPayment records with status='payment_received'
 * (bills that have been paid by the customer but not yet
 * manually settled with the biller).
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, dbReady } from '@/lib/db';

export async function GET(req: Request) {
  // Auth check
  const { error, res, admin } = await requireAdmin(req);
  if (error || res) return res!;

  if (!dbReady) {
    return NextResponse.json({ bills: [] });
  }

  try {
    const bills = await db.billPayment.findMany({
      where: { status: 'payment_received' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      bills: bills.map((b) => ({
        id: b.id,
        billType: b.billType,
        accountNumber: b.accountNumber,
        amount: b.amount,
        currency: b.currency,
        status: b.status,
        reference: b.reference,
        eversendId: b.eversendId,
        settledBy: b.settledBy,
        settledAt: b.settledAt,
        createdAt: b.createdAt,
      })),
      admin: admin.email,
    });
  } catch (err) {
    console.error('[admin/bills/pending] DB error:', err);
    return NextResponse.json({ bills: [] });
  }
}
