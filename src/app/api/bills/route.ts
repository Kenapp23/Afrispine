import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await db.billPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: { email: true },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('[bills] admin list', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}