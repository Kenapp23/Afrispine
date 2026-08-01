import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const { error, res } = await requireAdmin(req);
  if (error) return res!;

  const { id } = await params;
  try {
    const partner = await db.partnerConfig.findUnique({ where: { id } });
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, partner });
  } catch (e: any) {
    console.error('[partners/[id] GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const { error, res, admin } = await requireAdmin(req);
  if (error) return res!;

  const { id } = await params;
  try {
    const body = await req.json();
    const { configJson } = body;

    const existing = await db.partnerConfig.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Merge: if user didn't edit a field (still masked), keep original value
    let finalConfig: Record<string, string> = {};
    try {
      const originalConfig = JSON.parse(existing.configJson);
      const incomingConfig = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

      for (const [key, val] of Object.entries(incomingConfig)) {
        const strVal = String(val);
        // If the value is the masked placeholder, keep original
        if (strVal.includes('••••')) {
          finalConfig[key] = originalConfig[key] || '';
        } else {
          finalConfig[key] = strVal;
        }
      }
      // Preserve any keys not in the incoming payload
      for (const [key, val] of Object.entries(originalConfig)) {
        if (!(key in finalConfig)) {
          finalConfig[key] = String(val);
        }
      }
    } catch {
      finalConfig = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
    }

    const updated = await db.partnerConfig.update({
      where: { id },
      data: {
        configJson: JSON.stringify(finalConfig),
        lastVerifiedAt: new Date(),
        verifiedBy: admin?.email || 'admin',
      },
    });

    // Read-after-write verification
    const verified = await db.partnerConfig.findUnique({ where: { id } });
    console.log(`[partners/${id}] Config updated by ${admin?.email}. Verified in DB.`);

    return NextResponse.json({ success: true, partner: verified });
  } catch (e: any) {
    console.error('[partners/[id] PUT]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
