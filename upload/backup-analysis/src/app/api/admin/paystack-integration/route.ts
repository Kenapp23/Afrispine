import { NextRequest, NextResponse } from 'next/server';
import { getSecretKey } from '@/lib/paystack';
import { withAdminAuth } from '@/lib/admin-auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const secretKey = await getSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key not configured' }, { status: 400 });
    }

    const res = await fetch('https://api.paystack.co/integration', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Failed to fetch integration info' }, { status: 400 });
    }

    return NextResponse.json({ integration: data.data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch Paystack integration info' }, { status: 500 });
  }
});