import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  country: z.string().optional().default(''),
  intendedAmountUsd: z.string().optional().default(''),
  currency: z.string().optional().default('USD'),
  utmSource: z.string().optional().default(''),
  utmMedium: z.string().optional().default(''),
  utmCampaign: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    await db.ipoRegistration.upsert({
      where: { email_source: { email: data.email, source: 'dangote-ipo' } },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        intendedAmountUsd: data.intendedAmountUsd,
        currency: data.currency,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
      },
      create: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        intendedAmountUsd: data.intendedAmountUsd,
        currency: data.currency,
        ipoSlug: 'dangote',
        ipoName: 'Dangote Refinery IPO',
        exchange: 'NGX',
        source: 'dangote-ipo',
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
      },
    });

    return NextResponse.json({ success: true, message: 'Registration confirmed' });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('IPO registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// GET — list registrations (for admin)
export async function GET() {
  const registrations = await db.ipoRegistration.findMany({
    where: { source: 'dangote-ipo' },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return NextResponse.json({ count: registrations.length, registrations });
}