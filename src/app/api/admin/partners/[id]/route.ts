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

    // Sync key values to PlatformSetting for unified reads across the platform
    try {
      const syncMap: Record<string, string> = {
        fincra: 'fincra',
        mystocks_africa: 'mystocks_africa',
        africas_talking: 'africas_talking',
        resend: 'resend',
      };
      const fieldToSetting: Record<string, Record<string, string>> = {
        fincra: { publicKey: 'fincra_public_key', secretKey: 'fincra_secret_key' },
        mystocks_africa: { apiKey: 'mystocks_api_key', partnerId: 'mystocks_partner_id' },
        africas_talking: { apiKey: 'at_api_key', username: 'at_username' },
        resend: { apiKey: 'resend_api_key' },
      };
      const partner = await db.partnerConfig.findUnique({ where: { id } });
      if (partner) {
        const config = JSON.parse(partner.configJson || '{}');
        const mappings = fieldToSetting[partner.partnerId];
        if (mappings) {
          for (const [field, settingKey] of Object.entries(mappings)) {
            const val = config[field];
            if (val && typeof val === 'string' && val.length > 0 && !val.includes('••••')) {
              await db.platformSetting.upsert({
                where: { key: settingKey },
                update: { value: val },
                create: { key: settingKey, value: val },
              });
            }
          }
        }
      }
      console.log(`[partners/${id}] Config synced to PlatformSetting`);
    } catch (syncErr: any) {
      console.warn(`[partners/${id}] PlatformSetting sync failed:`, syncErr.message);
    }

    // Read-after-write verification
    const verified = await db.partnerConfig.findUnique({ where: { id } });
    console.log(`[partners/${id}] Config updated by ${admin?.email}. Verified in DB.`);

    return NextResponse.json({ success: true, partner: verified });
  } catch (e: any) {
    console.error('[partners/[id] PUT]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
