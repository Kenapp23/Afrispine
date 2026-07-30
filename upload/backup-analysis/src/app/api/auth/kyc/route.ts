import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSenderAuth(req);

    const body = await req.json();
    const { idType, idNumber, kycStatus } = body;

    const data: Record<string, any> = {};
    if (idType !== undefined) data.kycIdType = idType;
    if (idNumber !== undefined) data.kycIdNumber = idNumber;
    if (kycStatus !== undefined) {
      data.kycStatus = kycStatus;
      if (kycStatus === 'approved') data.kycCompletedAt = new Date();
    }

    const updated = await db.sender.update({
      where: { id: auth.id },
      data,
    });

    const { passwordHash: _, ...safe } = updated;
    return NextResponse.json({ sender: safe });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}