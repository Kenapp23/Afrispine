import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { provider: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id } = await params;
  const body = await req.json();

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const updateData: any = {};
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === 'paid') {
      updateData.paidAt = new Date();
      updateData.amountPaid = body.amountPaid ?? invoice.totalDue;
    }
    if (body.status === 'sent') {
      updateData.sentAt = new Date();
    }
  }
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.amountPaid !== undefined && body.status !== 'paid') {
    updateData.amountPaid = body.amountPaid;
  }

  const updated = await db.invoice.update({
    where: { id },
    data: updateData,
    include: { provider: true },
  });

  return NextResponse.json({ invoice: updated });
}