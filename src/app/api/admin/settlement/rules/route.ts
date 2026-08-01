import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(req: NextRequest) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  try {
    const rules = await db.settlementRule.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, rules });
  } catch (e: any) {
    console.error('[settlement/rules GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  try {
    const body = await req.json();
    const rule = await db.settlementRule.create({ data: body });
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (e: any) {
    console.error('[settlement/rules POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
