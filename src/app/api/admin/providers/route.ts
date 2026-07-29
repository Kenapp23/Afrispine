import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const providers = await db.provider.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { transactions: true } } },
  });
  const total = await db.provider.count();

  return NextResponse.json({ providers, total });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const body = await req.json();
  const { name, displayName, slug, logoUrl, apiBaseUrl, apiKey, apiSecret, webhookSecret, supportedRails, supportedCorridors, weightSpeed, weightCost, weightReliability, billingModel, billingRate, billingEmail } = body;

  if (!displayName || !name) {
    return NextResponse.json({ error: 'displayName and name are required' }, { status: 400 });
  }

  const finalSlug = slug || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Parse supportedRails from comma-separated string
  const rails = typeof supportedRails === 'string' ? supportedRails : 'mobile_money';

  // Parse supportedCorridors from JSON array string or array
  let corridors: string[] = [];
  if (typeof supportedCorridors === 'string') {
    try { corridors = JSON.parse(supportedCorridors); } catch { corridors = []; }
  } else if (Array.isArray(supportedCorridors)) {
    corridors = supportedCorridors;
  }

  const provider = await db.provider.create({
    data: {
      name: name || displayName,
      displayName,
      slug: finalSlug,
      logoUrl: logoUrl || '',
      apiBaseUrl: apiBaseUrl || '',
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      webhookSecret: webhookSecret || '',
      supportedRails: rails,
      supportedCorridors: JSON.stringify(corridors),
      weightSpeed: Number(weightSpeed) || 70,
      weightCost: Number(weightCost) || 70,
      weightReliability: Number(weightReliability) || 70,
      billingModel: billingModel || 'per_transaction',
      billingRate: Number(billingRate) || 0.5,
      billingEmail: billingEmail || '',
    },
  });

  return NextResponse.json({ provider }, { status: 201 });
}