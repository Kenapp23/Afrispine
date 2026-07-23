import { NextRequest, NextResponse } from 'next/server';
import { getCredential, saveCredential, listCredentials } from '@/lib/credential-store';

export async function GET() {
  try {
    const configured = await listCredentials();
    return NextResponse.json({ configured });
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

    const result = await saveCredential({
      provider,
      apiKey: String(apiKey),
      secretKey: secretKey ? String(secretKey) : undefined,
      environment: String(environment || 'sandbox'),
      baseUrl: baseUrl ? String(baseUrl) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
