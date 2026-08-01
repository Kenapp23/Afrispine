import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  const { id } = await params;
  try {
    const body = await req.json();
    const rule = await db.settlementRule.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ success: true, rule });
  } catch (e: any) {
    console.error('[settlement/rules/[id] PUT]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
