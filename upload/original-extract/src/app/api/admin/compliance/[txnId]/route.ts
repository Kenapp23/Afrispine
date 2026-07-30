import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ txnId: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { txnId } = await params;
  const [flags, transaction] = await Promise.all([
    db.amlFlag.findMany({ where: { transactionId: txnId }, orderBy: { createdAt: 'desc' } }),
    db.transaction.findUnique({
      where: { id: txnId },
      include: { sender: true, recipient: true, provider: true, events: { orderBy: { createdAt: 'asc' } } },
    }),
  ]);
  return NextResponse.json({ flags, transaction });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ txnId: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;
  const { txnId } = await params;
  const { action, adminName, notes: newNotes } = await req.json();
  if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 });

  const flag = await db.amlFlag.findFirst({ where: { transactionId: txnId } });
  if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });

  const data: any = { reviewedByName: adminName || 'Admin', reviewedAt: new Date() };

  if (action === 'clear') {
    data.outcome = 'cleared';
    await db.transaction.update({ where: { id: txnId }, data: { status: 'processing' } });
  } else if (action === 'block') {
    data.outcome = 'blocked';
    if (newNotes) data.notes = (flag.notes ? flag.notes + '\n' : '') + newNotes;
  } else if (action === 'refund') {
    data.outcome = 'refunded';
    await db.transaction.update({ where: { id: txnId }, data: { status: 'refunded' } });
  } else if (action === 'note') {
    data.notes = (flag.notes ? flag.notes + '\n' : '') + '[' + (adminName || 'Admin') + '] ' + new Date().toISOString() + ': ' + (newNotes || '');
  }

  const updated = await db.amlFlag.update({ where: { id: flag.id }, data });
  return NextResponse.json({ flag: updated });
}