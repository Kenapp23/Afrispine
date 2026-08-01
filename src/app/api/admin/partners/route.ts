import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

function maskValue(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '••••••••';
  return val.slice(0, 4) + '••••' + val.slice(-4);
}

function maskConfigJson(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      masked[k] = typeof v === 'string' ? maskValue(v) : v;
    }
    return JSON.stringify(masked);
  } catch {
    return jsonStr;
  }
}

export async function GET(req: NextRequest) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  try {
    const partners = await db.partnerConfig.findMany({ orderBy: { createdAt: 'asc' } });
    const masked = partners.map(p => ({
      ...p,
      configJson: maskConfigJson(p.configJson),
    }));
    return NextResponse.json({ success: true, partners: masked });
  } catch (e: any) {
    console.error('[partners GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
