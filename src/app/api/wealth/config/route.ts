'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const creds = await db.apiCredential.findMany({
      select: { provider: true, environment: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ configured: creds });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, secretKey, environment, baseUrl } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'provider and apiKey are required' }, { status: 400 });
    }

    const cred = await db.apiCredential.upsert({
      where: { provider },
      update: {
        apiKey: String(apiKey),
        secretKey: secretKey ? String(secretKey) : null,
        environment: String(environment || 'sandbox'),
        baseUrl: baseUrl ? String(baseUrl) : null,
      },
      create: {
        provider,
        apiKey: String(apiKey),
        secretKey: secretKey ? String(secretKey) : null,
        environment: String(environment || 'sandbox'),
        baseUrl: baseUrl ? String(baseUrl) : null,
      },
    });

    return NextResponse.json({ success: true, provider: cred.provider });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
