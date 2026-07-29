import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifySender } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const { senderId, idType, idNumber } = await req.json();
  if (!senderId) return NextResponse.json({ error: 'Missing senderId' }, { status: 400 });
  const sender = await db.sender.findUnique({ where: { id: senderId } });
  if (!sender) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Simulated Smile ID (90% approved, 10% pending)
  const result = Math.random() > 0.1 ? 'approved' : 'manual_review';
  await db.sender.update({ where: { id: senderId }, data: { kycStatus: result, kycIdType: idType, kycIdNumber: idNumber, kycCompletedAt: new Date() } });
  if (sender.email) notifySender(sender.email, `${sender.firstName} ${sender.lastName}`, result === 'approved' ? 'kyc_approved' : 'kyc_rejected', {});
  return NextResponse.json({ success: true, kycStatus: result });
}
