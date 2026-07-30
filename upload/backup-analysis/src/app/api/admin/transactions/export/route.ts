import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') || '';
  const corridor = searchParams.get('corridor') || '';
  const rail = searchParams.get('rail') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (corridor && corridor.includes('-')) {
    const parts = corridor.split('-');
    where.currencySend = parts[0].toUpperCase();
    where.currencyReceive = parts[1].toUpperCase();
  }

  if (rail) {
    where.rail = rail;
  }

  if (from || to) {
    where.createdAt = {} as Record<string, unknown>;
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  if (search) {
    where.OR = [
      { reference: { contains: search } },
      { sender: { firstName: { contains: search } } },
      { sender: { lastName: { contains: search } } },
      { sender: { email: { contains: search } } },
      { recipient: { fullName: { contains: search } } },
      { recipient: { phone: { contains: search } } },
    ];
  }

  const transactions = await db.transaction.findMany({
    where,
    include: {
      sender: true,
      recipient: true,
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV content
  const header = 'Reference,Date,Sender,Sender Email,Corridor,Send Amount,Receive Amount,Rail,Provider,Status,Fee';
  const rows = transactions.map((t) => {
    const date = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '';
    const senderName = t.sender
      ? [t.sender.firstName, t.sender.lastName].filter(Boolean).join(' ')
      : 'Unknown';
    const senderEmail = t.sender?.email || '';
    const corridor = (t.currencySend || '') + ' -> ' + (t.currencyReceive || '');
    const provider = t.provider?.displayName || t.provider?.name || '';

    // Escape CSV fields that contain commas or quotes
    const esc = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    };

    return [
      esc(t.reference),
      esc(date),
      esc(senderName),
      esc(senderEmail),
      esc(corridor),
      esc(String(t.amountSend)),
      esc(String(t.amountReceive)),
      esc(t.rail),
      esc(provider),
      esc(t.status),
      esc(String(t.feeAmount)),
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = 'afri-spine-transactions-' + dateStr + '.csv';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
  });
}