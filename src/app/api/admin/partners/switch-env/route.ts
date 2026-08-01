import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function POST(req: NextRequest) {
  await ensureDb();
  const { error, res, admin } = await requireAdmin(req);
  if (error) return res!;

  try {
    const { partnerId, environment } = await req.json();
    if (!partnerId || !['production', 'test'].includes(environment)) {
      return NextResponse.json({ error: 'Invalid partnerId or environment' }, { status: 400 });
    }

    const partner = await db.partnerConfig.findUnique({ where: { partnerId } });
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const updated = await db.partnerConfig.update({
      where: { partnerId },
      data: { environment },
    });

    console.log(`[partners/switch-env] ${partnerId} → ${environment} by ${admin?.email}`);
    return NextResponse.json({ success: true, partner: updated });
  } catch (e: any) {
    console.error('[partners/switch-env]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
