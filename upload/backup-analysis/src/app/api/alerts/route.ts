import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// List sender's rate alerts
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const alerts = await db.rateAlert.findMany({
    where: { senderId: sender.id },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ alerts });
}

// Create a new rate alert
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { fromCurrency, toCurrency, targetRate, direction, notifyEmail, notifySms } = await req.json();

  if (!fromCurrency || !toCurrency || !targetRate || !direction) {
    return NextResponse.json({ error: 'Missing required fields: fromCurrency, toCurrency, targetRate, direction' }, { status: 400 });
  }

  if (!['above', 'below'].includes(direction)) {
    return NextResponse.json({ error: 'direction must be "above" or "below"' }, { status: 400 });
  }

  const alert = await db.rateAlert.create({
    data: {
      senderId: sender.id,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      targetRate: parseFloat(targetRate),
      direction,
      notifyEmail: notifyEmail !== false,
      notifySms: notifySms === true,
      isActive: true,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}