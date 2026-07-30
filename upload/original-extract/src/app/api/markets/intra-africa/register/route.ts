import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  country: z.string().optional().default(''),
  preferredCorridor: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    await db.ipoRegistration.upsert({
      where: { email_source: { email: data.email, source: 'intra-africa' } },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
      },
      create: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        ipoSlug: 'intra-africa',
        ipoName: 'Intra-Africa Corridors (PAPSS)',
        exchange: 'PAPSS',
        source: 'intra-africa',
      },
    });

    return NextResponse.json({ success: true, message: 'Registration confirmed' });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error('Intra-Africa registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}