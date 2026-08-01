import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { error, res, admin } = await requireAdmin(request);
    if (error) return res!;

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "verify" or "reject"' }, { status: 400 });
    }

    const brand = await db.giftCardBrand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (action === 'verify') {
      const contractHash = await sha256(`${brand.slug}-contract-${Date.now()}`);
      const contractAddr = `0x${randomHex40()}`;

      const updated = await db.giftCardBrand.update({
        where: { id },
        data: {
          kycStatus: 'verified',
          isVerified: true,
          smartContractHash: contractHash,
          smartContractAddress: contractAddr,
        },
      });

      return NextResponse.json({ brand: updated, message: 'Brand verified successfully' });
    } else {
      const updated = await db.giftCardBrand.update({
        where: { id },
        data: {
          kycStatus: 'rejected',
          isVerified: false,
        },
      });

      return NextResponse.json({ brand: updated, message: `Brand rejected. Reason: ${reason || 'Not specified'}` });
    }
  } catch (error: any) {
    console.error('[admin/gift-cards/brands/verify]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
