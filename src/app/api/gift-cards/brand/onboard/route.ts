import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function POST(request: Request) {
  try {
    await ensureDb();

    const body = await request.json();
    const { brandName, country, countryCode, category, website, contactEmail, contactPhone, logoUrl, kycDocuments } = body;

    if (!brandName || !country || !countryCode) {
      return NextResponse.json({ error: 'brandName, country, and countryCode are required' }, { status: 400 });
    }

    const slug = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existing = await db.giftCardBrand.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A brand with a similar name already exists' }, { status: 409 });
    }

    const brand = await db.giftCardBrand.create({
      data: {
        brandName,
        slug,
        logoUrl: logoUrl || '',
        country,
        countryCode: countryCode.toUpperCase(),
        category: category || 'General',
        website: website || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        kycStatus: 'submitted',
        kycDocuments: kycDocuments ? JSON.stringify(kycDocuments) : null,
        isVerified: false,
        isActive: true,
      },
    });

    return NextResponse.json({
      brand,
      message: 'Brand application submitted successfully. Your brand is pending admin verification.',
    });
  } catch (error: any) {
    console.error('[gift-cards/brand/onboard]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
