import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { MERCHANTS } from '@/lib/merchants';

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomHex40(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 40; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function POST() {
  try {
    await ensureDb();

    let upserted = 0;
    const timestamp = Date.now();

    for (const m of MERCHANTS) {
      const contractHash = await sha256(`${m.slug}-${timestamp}`);
      const contractAddr = `0x${randomHex40()}`;

      await db.giftCardBrand.upsert({
        where: { slug: m.slug },
        update: {},
        create: {
          brandName: m.name,
          slug: m.slug,
          logoUrl: m.logoUrl,
          country: m.country,
          countryCode: m.countryCode,
          category: m.category,
          description: m.description || null,
          kycStatus: 'verified',
          isVerified: true,
          isActive: true,
          smartContractHash: contractHash,
          smartContractAddress: contractAddr,
        },
      });
      upserted++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${upserted} gift card brands`,
      count: upserted,
    });
  } catch (error: any) {
    console.error('[seed-brands]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
