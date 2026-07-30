import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  try {
    const orders = await db.investmentOrder.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[Admin Wealth Orders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment orders' },
      { status: 500 },
    );
  }
}