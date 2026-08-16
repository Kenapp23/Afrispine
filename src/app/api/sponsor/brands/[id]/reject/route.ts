import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

// POST /api/sponsor/brands/[id]/reject — reject a brand
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!dbReady) {
      return NextResponse.json(
        { error: 'Database is not available.' },
        { status: 503 },
      );
    }

    const { id } = await params;

    const brand = await db.sponsorBrand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found.' }, { status: 404 });
    }

    const updated = await db.sponsorBrand.update({
      where: { id },
      data: { kybStatus: 'rejected' },
    });

    return NextResponse.json({ success: true, brand: updated });
  } catch (error: any) {
    console.error('[sponsor/brands/reject] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to reject brand.' },
      { status: 500 },
    );
  }
}
