import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled (boolean) is required' }, { status: 400 });
    }

    // Verify account exists
    const account = await db.investmentAccount.findUnique({
      where: { senderId: sender.id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Investment account not found' }, { status: 404 });
    }

    await db.investmentAccount.update({
      where: { id: account.id },
      data: { autoReinvestDividends: enabled },
    });

    return NextResponse.json({ success: true, autoReinvestDividends: enabled });
  } catch (e: any) {
    console.error('[auto-reinvest]', e);
    return NextResponse.json({ error: e.message || 'Failed to update auto-reinvest setting' }, { status: 500 });
  }
}