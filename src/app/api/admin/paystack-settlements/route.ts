import { NextRequest, NextResponse } from 'next/server';
import { getSecretKey } from '@/lib/paystack';
import { withAdminAuth } from '@/lib/admin-auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const secretKey = await getSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key not configured' }, { status: 400 });
    }

    // Support pagination via query params
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('perPage') || '50';

    const res = await fetch(
      `https://api.paystack.co/settlement?page=${page}&perPage=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Failed to fetch settlements' }, { status: 400 });
    }

    return NextResponse.json({
      settlements: data.data,
      meta: data.meta,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch settlements' }, { status: 500 });
  }
});