import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const { id } = await params;
  const provider = await db.provider.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  });

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  return NextResponse.json({ provider });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const { id } = await params;
  const body = await req.json();

  // Parse supportedCorridors if sent as JSON string
  if (body.supportedCorridors && typeof body.supportedCorridors === 'string') {
    try { body.supportedCorridors = JSON.parse(body.supportedCorridors); } catch { /* keep as-is */ }
  }
  if (Array.isArray(body.supportedCorridors)) {
    body.supportedCorridors = JSON.stringify(body.supportedCorridors);
  }

  // Numeric fields
  if (body.weightSpeed !== undefined) body.weightSpeed = Number(body.weightSpeed);
  if (body.weightCost !== undefined) body.weightCost = Number(body.weightCost);
  if (body.weightReliability !== undefined) body.weightReliability = Number(body.weightReliability);
  if (body.billingRate !== undefined) body.billingRate = Number(body.billingRate);

  try {
    const provider = await db.provider.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ provider });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const { id } = await params;

  try {
    const provider = await db.provider.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ provider });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}