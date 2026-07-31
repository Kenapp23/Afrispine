import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { MERCHANTS, MERCH_COUNTRIES } from '@/lib/merchants';
import type { Merchant } from '@/lib/merchants';

// Ensure DB schema exists
import '@/lib/ensure-db';

type MerchantStatus = 'active' | 'disabled' | 'deleted';

interface MerchantWithStatus extends Merchant {
  status: MerchantStatus;
}

/** Batch-fetch PlatformConfig values for merchant status keys */
async function getMerchantStatuses(): Promise<Record<string, { disabled: boolean; deleted: boolean }>> {
  await ensureDb();
  const configs = await db.platformConfig.findMany({
    where: {
      OR: [
        { key: { startsWith: 'merchant_disabled_' } },
        { key: { startsWith: 'merchant_deleted_' } },
      ],
    },
  });

  const result: Record<string, { disabled: boolean; deleted: boolean }> = {};
  for (const m of MERCHANTS) {
    result[m.id] = { disabled: false, deleted: false };
  }

  for (const c of configs) {
    if (c.key.startsWith('merchant_disabled_')) {
      const id = c.key.replace('merchant_disabled_', '');
      if (result[id]) result[id].disabled = c.value === 'true';
    } else if (c.key.startsWith('merchant_deleted_')) {
      const id = c.key.replace('merchant_deleted_', '');
      if (result[id]) result[id].deleted = c.value === 'true';
    }
  }

  return result;
}

/** Derive effective status from static isActive + DB overrides */
function deriveStatus(merchant: Merchant, overrides: { disabled: boolean; deleted: boolean }): MerchantStatus {
  if (overrides.deleted) return 'deleted';
  if (overrides.disabled) return 'disabled';
  return 'active';
}

// ─── GET: List all merchants with admin status ──────────────────────

export async function GET(req: NextRequest) {
  const { error, res } = await requireAdmin(req);
  if (error || res) return res!;

  const statuses = await getMerchantStatuses();

  const merchants: MerchantWithStatus[] = MERCHANTS.map((m) => ({
    ...m,
    status: deriveStatus(m, statuses[m.id] ?? { disabled: false, deleted: false }),
  }));

  return NextResponse.json({ merchants, countries: MERCH_COUNTRIES });
}

// ─── PATCH: Enable or disable a merchant ────────────────────────────

export async function PATCH(req: NextRequest) {
  const { error, res, admin } = await requireAdmin(req);
  if (error || res) return res!;

  let body: { merchantId?: string; action?: 'enable' | 'disable' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { merchantId, action } = body;

  if (!merchantId || !action) {
    return NextResponse.json(
      { error: 'Missing merchantId or action' },
      { status: 400 },
    );
  }

  if (action !== 'enable' && action !== 'disable') {
    return NextResponse.json(
      { error: 'action must be "enable" or "disable"' },
      { status: 400 },
    );
  }

  // Verify merchant exists in static data
  const merchant = MERCHANTS.find((m) => m.id === merchantId);
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  await ensureDb();

  const key = `merchant_disabled_${merchantId}`;

  if (action === 'enable') {
    // Remove the disabled flag
    await db.platformConfig.deleteMany({ where: { key } });
  } else {
    // Set the disabled flag
    await db.platformConfig.upsert({
      where: { key },
      update: { value: 'true' },
      create: { key, value: 'true' },
    });
  }

  return NextResponse.json({
    ok: true,
    message: `${merchant.name} ${action === 'enable' ? 'enabled' : 'disabled'}`,
  });
}

// ─── DELETE: Soft-delete a merchant ──────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { error, res, admin } = await requireAdmin(req);
  if (error || res) return res!;

  let body: { merchantId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { merchantId } = body;

  if (!merchantId) {
    return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 });
  }

  // Verify merchant exists in static data
  const merchant = MERCHANTS.find((m) => m.id === merchantId);
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  await ensureDb();

  // Also remove any disabled flag when deleting
  await db.platformConfig.deleteMany({
    where: { key: `merchant_disabled_${merchantId}` },
  });

  // Set the deleted flag
  await db.platformConfig.upsert({
    where: { key: `merchant_deleted_${merchantId}` },
    update: { value: 'true' },
    create: { key: `merchant_deleted_${merchantId}`, value: 'true' },
  });

  return NextResponse.json({
    ok: true,
    message: `${merchant.name} has been deleted`,
  });
}
