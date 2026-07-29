import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  try {
    const accounts = await db.investmentAccount.findMany({
      include: {
        sender: {
          select: { email: true, firstName: true, lastName: true },
        },
        orders: { where: { status: 'filled' } },
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[Admin Wealth Portfolios] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment accounts' },
      { status: 500 },
    );
  }
}