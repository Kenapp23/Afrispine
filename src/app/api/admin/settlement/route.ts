import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  // Get or create settlement config
  let config = await db.settlementConfig.findFirst();
  if (!config) {
    config = await db.settlementConfig.create({ data: {} });
  }

  // Check Paystack connection — key existence = connected
  let paystack: { connected: boolean; businessName?: string; merchantId?: string; mode?: string } = {
    connected: false,
  };

  try {
    const secretKey = await db.platformSetting.findUnique({ where: { key: 'paystack_secret_key' } });
    const publicKey = await db.platformSetting.findUnique({ where: { key: 'paystack_public_key' } });

    if (secretKey?.value) {
      // Keys exist in DB = connected (works for both test and live keys)
      const isTest = secretKey.value.includes('_test_') || publicKey?.value?.includes('_test_');
      paystack = {
        connected: true,
        mode: isTest ? 'Test' : 'Live',
      };

      // Try to fetch live business details from Paystack API
      try {
        const res = await fetch('https://api.paystack.co/integration', {
          headers: { Authorization: 'Bearer ' + secretKey.value },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.status === true && body.data) {
            paystack.businessName = body.data.business_name || body.data.name;
            paystack.merchantId = body.data.merchant_id || body.data.key;
          }
        }
      } catch {
        // Paystack API unreachable (network issue, test env, etc.) — still connected
      }
    }
  } catch {
    // DB error
  }

  return NextResponse.json({ config, paystack });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const data = await req.json();
  const allowed = [
    'companyName', 'addressLine1', 'addressLine2', 'city', 'country',
    'companyRegNumber', 'vatNumber', 'invoiceEmail', 'logoUrl',
    'sweepCurrency', 'sweepAccountId', 'sweepSchedule', 'sweepMinimum', 'sweepNotifyEmail',
  ];
  const filtered: Record<string, any> = {};
  for (const k of allowed) {
    if (data[k] !== undefined) filtered[k] = data[k];
  }

  // Upsert: use first existing or create
  const existing = await db.settlementConfig.findFirst();
  let config;
  if (existing) {
    config = await db.settlementConfig.update({ where: { id: existing.id }, data: filtered });
  } else {
    config = await db.settlementConfig.create({ data: filtered });
  }

  return NextResponse.json({ config });
}