import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

/**
 * PUT /api/admin/gift-cards/brands/[id]/logo
 * 
 * Accepts two content types:
 * 1. application/json  → { logoUrl: string }   (URL upload)
 * 2. multipart/form-data → file field (device upload, stored as base64 data URL)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { error, res } = await requireAdmin(request);
    if (error) return res!;

    const { id } = await params;

    const brand = await db.giftCardBrand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let logoUrl = '';

    if (contentType.includes('multipart/form-data')) {
      /* ── Device upload: convert file to base64 data URL ── */
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      /* Validate file type */
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: PNG, JPG, WebP, SVG, GIF' },
          { status: 400 }
        );
      }

      /* Validate file size (max 2MB for a logo) */
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 2MB.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      logoUrl = `data:${file.type};base64,${base64}`;
    } else {
      /* ── URL upload ── */
      const body = await request.json();
      logoUrl = body.logoUrl?.trim();

      if (!logoUrl) {
        return NextResponse.json({ error: 'logoUrl is required' }, { status: 400 });
      }

      /* Basic URL validation */
      try {
        const parsed = new URL(logoUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    const updated = await db.giftCardBrand.update({
      where: { id },
      data: { logoUrl },
    });

    return NextResponse.json({
      message: 'Logo updated successfully',
      brand: {
        id: updated.id,
        brandName: updated.brandName,
        logoUrl: updated.logoUrl,
      },
    });
  } catch (error: any) {
    console.error('[admin/gift-cards/brands/logo]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
