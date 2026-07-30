import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const senderId = req.nextUrl.searchParams.get('senderId');
  if (!senderId) return NextResponse.json({ error: 'Missing senderId' }, { status: 400 });
  const recipients = await db.recipient.findMany({ where: { senderId, isActive: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ recipients });
}

export async function POST(req: NextRequest) {
  const { senderId, fullName, phone, country, deliveryMethod, mobileNetwork, bankName, accountNumber, bankCode, nickname, saveRecipient } = await req.json();
  if (!senderId || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const recipient = await db.recipient.create({ data: { senderId, fullName, phone: phone || '', country: country || 'KE', deliveryMethod: deliveryMethod || 'mobile_money', mobileNetwork, bankName, accountNumber, bankCode, nickname } });
  return NextResponse.json({ recipient });
}
