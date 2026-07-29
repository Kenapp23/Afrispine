import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      sender: true,
      recipient: true,
      provider: true,
      events: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const previousStatus = existing.status;

  const updateData: Record<string, unknown> = {};

  if (status && status !== previousStatus) {
    updateData.status = status;

    // Set appropriate timestamp fields based on new status
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.feeConfirmed = true;
    }
    if (status === 'failed') {
      updateData.failedAt = new Date();
      if (notes) {
        updateData.failureReason = notes;
      }
    }
  }

  const transaction = await db.transaction.update({
    where: { id },
    data: updateData,
    include: {
      sender: true,
      recipient: true,
      provider: true,
      events: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Create a transaction event for the status change
  if (status && status !== previousStatus) {
    await db.transactionEvent.create({
      data: {
        transactionId: id,
        eventType: 'status_change',
        payload: JSON.stringify({
          from: previousStatus,
          to: status,
          notes: notes || '',
        }),
        actor: auth.admin?.email || 'admin',
      },
    });
  }

  return NextResponse.json({ transaction });
}