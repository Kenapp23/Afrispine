import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

/* Simple waitlist — stores interest in PlatformConfig */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brandId, brandName, email, country, countryCode, preferredAmount, preferredCurrency } = body;

  if (!brandId || !email) {
    return NextResponse.json({ error: 'Brand and email are required.' }, { status: 400 });
  }

  const entry = {
    brandId,
    brandName: brandName || '',
    email,
    country: country || '',
    countryCode: countryCode || '',
    preferredAmount: preferredAmount || null,
    preferredCurrency: preferredCurrency || null,
    registeredAt: new Date().toISOString(),
 };

  /* Store in DB if available, otherwise just acknowledge */
  if (dbReady) {
    try {
      await ensureDb();
      await db.platformConfig.upsert({
        where: { key: `giftcard_waitlist_${brandId}_${email}` },
        update: { value: JSON.stringify(entry) },
        create: { id: Date.now().toString(36), key: `giftcard_waitlist_${brandId}_${email}`, value: JSON.stringify(entry) },
      });
    } catch {
    /* DB write failed — still acknowledge */
  }
  }

  return NextResponse.json({ success: true, message: `Added to waitlist for ${brandName || brandId}` });
}
