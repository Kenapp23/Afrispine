import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  const { key } = await params;
  try {
    const config = await db.companyConfig.findUnique({ where: { configKey: key } });
    if (!config) {
      return NextResponse.json({ success: true, config: null, configKey: key });
    }
    return NextResponse.json({ success: true, config });
  } catch (e: any) {
    console.error('[company/[key] GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  await ensureDb();
  const { error, res, admin } = await requireAdmin(req);
  if (error) return res!;

  const { key } = await params;
  try {
    const { configJson } = await req.json();
    const jsonStr = typeof configJson === 'string' ? configJson : JSON.stringify(configJson);

    const upserted = await db.companyConfig.upsert({
      where: { configKey: key },
      create: { configKey: key, configJson: jsonStr },
      update: { configJson: jsonStr },
    });

    // Read-after-write verification
    const verified = await db.companyConfig.findUnique({ where: { configKey: key } });
    console.log(`[company/${key}] Config saved by ${admin?.email}. Verified in DB.`);

    return NextResponse.json({ success: true, config: verified });
  } catch (e: any) {
    console.error('[company/[key] PUT]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
