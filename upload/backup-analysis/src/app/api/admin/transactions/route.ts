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
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

  const where: Record<string, unknown> = {};

  // Status filter
  if (status) {
    where.status = status;
  }

  // Corridor filter — parse "GBP-KES" into currencySend + currencyReceive
  if (corridor && corridor.includes('-')) {
    const parts = corridor.split('-');
    where.currencySend = parts[0].toUpperCase();
    where.currencyReceive = parts[1].toUpperCase();
  }

  // Rail filter
  if (rail) {
    where.rail = rail;
  }

  // Date range filter
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

  // Search filter
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

  const total = await db.transaction.count({ where });
  const pages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const transactions = await db.transaction.findMany({
    where,
    include: {
      sender: true,
      recipient: true,
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  return NextResponse.json({ transactions, total, page, pages });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const body = await req.json();
  const {
    amountSend,
    currencySend,
    currencyReceive,
    recipientName,
    recipientPhone,
    recipientCountry,
    rail,
    recipientEmail,
    senderId,
  } = body;

  // Generate a unique reference
  const reference = 'TXN-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);

  // Get FX rate from stored rates or use a default
  const fxRate = currencyReceive === 'KES' ? 169.3 : 1.0;
  const feePct = 1.5;
  const feeAmount = Math.round(amountSend * (feePct / 100) * 100) / 100;
  const totalCharged = Math.round((amountSend + feeAmount) * 100) / 100;
  const amountReceive = Math.round(amountSend * fxRate * 100) / 100;

  // Create or find recipient
  let recipientId: string | undefined;
  if (recipientName) {
    // Find existing recipient or create new one
    const existingRecipient = await db.recipient.findFirst({
      where: {
        fullName: recipientName,
        phone: recipientPhone || '',
        country: recipientCountry || 'KE',
      },
    });

    if (existingRecipient) {
      recipientId = existingRecipient.id;
    } else {
      // Need a senderId for recipient creation — use the admin's session sender or create a dummy
      const defaultSenderId = senderId || (await db.sender.findFirst({ select: { id: true } }))?.id;
      if (defaultSenderId) {
        const newRecipient = await db.recipient.create({
          data: {
            senderId: defaultSenderId,
            fullName: recipientName,
            phone: recipientPhone || '',
            country: recipientCountry || 'KE',
            deliveryMethod: rail === 'bank_transfer' ? 'bank_transfer' : 'mobile_money',
          },
        });
        recipientId = newRecipient.id;
      }
    }
  }

  const now = new Date();
  const transaction = await db.transaction.create({
    data: {
      reference,
      senderId: senderId || null,
      recipientId: recipientId || null,
      status: 'delivered',
      amountSend,
      currencySend: currencySend || 'GBP',
      amountReceive,
      currencyReceive: currencyReceive || 'KES',
      fxRate,
      feePct,
      feeAmount,
      totalCharged,
      rail: rail || 'mobile_money',
      feeConfirmed: true,
      deliveredAt: now,
      createdAt: now,
    },
    include: {
      sender: true,
      recipient: true,
      provider: true,
    },
  });

  // Create a transaction event for the creation
  await db.transactionEvent.create({
    data: {
      transactionId: transaction.id,
      eventType: 'created',
      payload: JSON.stringify({ source: 'admin_test' }),
      actor: auth.admin?.email || 'admin',
    },
  });

  await db.transactionEvent.create({
    data: {
      transactionId: transaction.id,
      eventType: 'delivered',
      payload: JSON.stringify({ source: 'admin_test' }),
      actor: auth.admin?.email || 'admin',
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}