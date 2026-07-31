import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminFromRequest, hashPassword, verifyPassword } from '@/lib/auth';

// Ensure DB schema exists (idempotent)
import '@/lib/ensure-db';

/** Helper: get admin or return 401 */
async function requireAdmin(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), admin: null };
  }
  return { error: null, admin };
}

/** Helper: get a PlatformSetting value */
async function getSetting(key: string): Promise<string | null> {
  const row = await db.platformSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Helper: upsert a PlatformSetting */
async function setSetting(key: string, value: string) {
  await db.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Helper: get or create default SettlementConfig */
async function getOrCreateSettlementConfig() {
  let config = await db.settlementConfig.findFirst();
  if (!config) {
    config = await db.settlementConfig.create({
      data: {
        companyName: 'AfriSpine Ltd',
        sweepCurrency: 'USD',
        sweepSchedule: 'daily',
        sweepMinimum: 50,
      },
    });
  }
  return config;
}

/** Helper: check if payment processor keys are configured */
async function getPaymentKeysStatus() {
  const publicKey = await getSetting('fincra_public_key');
  const secretKey = await getSetting('fincra_secret_key');

  // Also check legacy paystack keys for backward compat
  const psPublicKey = await getSetting('paystack_public_key');
  const psSecretKey = await getSetting('paystack_secret_key');

  const hasKey = (k: string | null) => k && k.length > 5;
  const mask = (k: string) => k.slice(0, 6) + '••••••' + k.slice(-4);

  return {
    keys: {
      fincra_public_key: {
        isSet: !!hasKey(publicKey),
        masked: publicKey ? mask(publicKey) : undefined,
        value: publicKey || undefined,
        length: publicKey?.length || 0,
      },
      fincra_secret_key: {
        isSet: !!hasKey(secretKey),
        masked: secretKey ? mask(secretKey) : undefined,
        length: secretKey?.length || 0,
      },
      // Legacy paystack keys (still readable for migration)
      paystack_public_key: {
        isSet: !!hasKey(psPublicKey),
        masked: psPublicKey ? mask(psPublicKey) : undefined,
        value: psPublicKey || undefined,
        length: psPublicKey?.length || 0,
      },
      paystack_secret_key: {
        isSet: !!hasKey(psSecretKey),
        masked: psSecretKey ? mask(psSecretKey) : undefined,
        length: psSecretKey?.length || 0,
      },
    },
    connected: hasKey(secretKey) || hasKey(psSecretKey),
    provider: hasKey(secretKey) ? 'fincra' : hasKey(psSecretKey) ? 'paystack' : null,
  };
}

// ─── Route handler ─────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  // Auth check for all admin routes
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // ─── /api/admin/settlement ───
    if (path === 'settlement') {
      const config = await getOrCreateSettlementConfig();
      return NextResponse.json({
        config: {
          id: config.id,
          companyName: config.companyName || '',
          registeredAddress: config.registeredAddress || '',
          companyRegNumber: config.companyRegNumber || '',
          vatNumber: config.vatNumber || '',
          sweepNotifyEmail: config.sweepNotifyEmail || '',
          sweepCurrency: config.sweepCurrency || 'USD',
          sweepSchedule: config.sweepSchedule || 'daily',
          sweepMinimum: config.sweepMinimum || 50,
        },
      });
    }

    // ─── /api/admin/paystack-keys ───
    if (path === 'paystack-keys') {
      const status = await getPaymentKeysStatus();
      return NextResponse.json(status);
    }

    // ─── /api/admin/partner-status ───
    if (path === 'partner-status') {
      const fincraPub = await getSetting('fincra_public_key');
      const fincraSec = await getSetting('fincra_secret_key');
      const mystocksKey = await getSetting('mystocks_api_key');
      const mystocksId = await getSetting('mystocks_partner_id');
      const atKey = await getSetting('at_api_key');
      const atUser = await getSetting('at_username');
      const resendKey = await getSetting('resend_api_key');

      const hasKey = (k: string | null) => !!k && k.length > 5;

      const partners = [
        {
          id: 'fincra',
          name: 'Fincra',
          purpose: 'Payments & Collections',
          configured: hasKey(fincraSec) && hasKey(fincraPub),
          keysSet: [hasKey(fincraPub), hasKey(fincraSec)].filter(Boolean).length,
          keysTotal: 2,
          keyLabels: ['Public Key', 'Secret Key'],
          keyStatuses: [hasKey(fincraPub), hasKey(fincraSec)],
        },
        {
          id: 'mystocks_africa',
          name: 'MyStocks Africa',
          purpose: 'Wealth & Investment',
          configured: hasKey(mystocksKey) && hasKey(mystocksId),
          keysSet: [hasKey(mystocksKey), hasKey(mystocksId)].filter(Boolean).length,
          keysTotal: 2,
          keyLabels: ['API Key', 'Partner ID'],
          keyStatuses: [hasKey(mystocksKey), hasKey(mystocksId)],
        },
        {
          id: 'africas_talking',
          name: "Africa's Talking",
          purpose: 'SMS & Notifications',
          configured: hasKey(atKey) && hasKey(atUser),
          keysSet: [hasKey(atUser), hasKey(atKey)].filter(Boolean).length,
          keysTotal: 2,
          keyLabels: ['Username', 'API Key'],
          keyStatuses: [hasKey(atUser), hasKey(atKey)],
        },
        {
          id: 'resend',
          name: 'Resend',
          purpose: 'Email Delivery',
          configured: hasKey(resendKey),
          keysSet: [hasKey(resendKey)].filter(Boolean).length,
          keysTotal: 1,
          keyLabels: ['API Key'],
          keyStatuses: [hasKey(resendKey)],
        },
      ];

      return NextResponse.json({ partners });
    }

    // ─── /api/admin/paystack-integration ───
    if (path === 'paystack-integration') {
      const keys = await getPaymentKeysStatus();
      const provider = keys.provider;
      const connected = keys.connected;

      if (connected) {
        const companyName = (await getSetting('settlement_company_name')) || 'AfriSpine Ltd';
        return NextResponse.json({
          integration: {
            business_name: companyName,
            integration_type: provider === 'fincra' ? 'Fincra Collection' : 'Paystack',
            domain: 'afri-spine.com',
            provider,
          },
        });
      }
      return NextResponse.json({ integration: null });
    }

    // ─── /api/admin/paystack-settlements ───
    if (path === 'paystack-settlements') {
      // Return settlement records from the database if they exist
      // For now, return empty array — real settlement data comes from payment processor webhooks
      return NextResponse.json({ settlements: [] });
    }

    // ─── /api/admin/revenue-summary ───
    if (path === 'revenue-summary') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Sum all fee amounts from transactions this month (safe - returns 0 on error)
      let txResults = { _sum: { feeAmount: 0, sendAmount: 0, totalCharged: 0 }, _count: 0 } as any;
      try {
        txResults = await db.transaction.aggregate({
          where: { createdAt: { gte: monthStart } },
          _sum: { feeAmount: true, sendAmount: true, totalCharged: true },
          _count: true,
        });
      } catch (e: any) {
        console.error('[revenue-summary] transaction aggregate failed:', e.message);
      }

      // Sum settled (delivered) transactions
      let settledResults = { _sum: { feeAmount: 0 }, _count: 0 } as any;
      try {
        settledResults = await db.transaction.aggregate({
          where: { createdAt: { gte: monthStart }, status: 'delivered' },
          _sum: { feeAmount: true },
          _count: true,
        });
      } catch (e: any) {
        console.error('[revenue-summary] settled aggregate failed:', e.message);
      }

      // Also count bill payments
      let billResults = { _sum: { amount: 0 }, _count: 0 } as any;
      try {
        billResults = await db.billPayment.aggregate({
          where: { createdAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: true,
        });
      } catch (e: any) {
        console.error('[revenue-summary] billPayment aggregate failed:', e.message);
      }

      const totalFees = Number(txResults._sum.feeAmount || 0);
      const totalVolume = Number(txResults._sum.sendAmount || 0) + Number(billResults._sum.amount || 0);
      const transactionCount = txResults._count || 0;
      const totalCharged = Number(txResults._sum.totalCharged || 0);
      const settledFees = Number(settledResults._sum.feeAmount || 0);
      const settledCount = settledResults._count || 0;

      return NextResponse.json({
        totalFees,
        totalVolume,
        transactionCount,
        totalCharged,
        settledFees,
        settledCount,
      });
    }

    // ─── /api/admin/settings ───
    if (path === 'settings') {
      // Load all platform settings
      const allSettings = await db.platformSetting.findMany();
      const settingsMap: Record<string, string> = {};
      for (const s of allSettings) {
        if (s.value) settingsMap[s.key] = s.value;
      }

      // Load FX margin overrides
      const margins = await db.fxMarginOverride.findMany({
        orderBy: { corridor: 'asc' },
      });

      // Load notification templates
      const templates = await db.notificationTemplate.findMany({
        orderBy: { trigger: 'asc' },
      });

      return NextResponse.json({
        settings: settingsMap,
        margins,
        templates: templates.map((t: { id: string; trigger: string; channel: string; subject: string | null; body: string | null }) => ({
          id: t.id,
          trigger: t.trigger,
          channel: t.channel,
          subject: t.subject || '',
          body: t.body || '',
          smsBody: '', // No smsBody column in schema
        })),
      });
    }

    // ─── /api/admin/settings/admins ───
    if (path === 'settings/admins') {
      const admins = await db.adminUser.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ admins });
    }

    // ─── /api/admin/settings/admins/[id] ───
    if (path.startsWith('settings/admins/')) {
      const adminId = path.replace('settings/admins/', '');
      const adminUser = await db.adminUser.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      });
      if (!adminUser) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }
      return NextResponse.json({ admin: adminUser });
    }

    // ─── /api/admin/revenue ───
    if (path === 'revenue') {
      const searchParams = req.nextUrl.searchParams;
      const period = searchParams.get('period') || '30d';
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const since = new Date(Date.now() - days * 86400000);

      // Aggregate from transactions
      const txAgg = await db.transaction.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { feeAmount: true, sendAmount: true, totalCharged: true },
        _count: true,
      });

      const billAgg = await db.billPayment.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      });

      const bfxAgg = await db.businessTransaction.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { sellAmount: true },
        _count: true,
      });

      const grossFees = Number(txAgg._sum.feeAmount || 0) + Number(billAgg._sum.amount || 0) * 0.015 + Number(bfxAgg._sum.sellAmount || 0) * 0.001;
      const totalVolume = Number(txAgg._sum.sendAmount || 0) + Number(billAgg._sum.amount || 0) + Number(bfxAgg._sum.sellAmount || 0);
      const txCount = (txAgg._count || 0) + (billAgg._count || 0) + (bfxAgg._count || 0);
      const providerCosts = grossFees * 0.3;
      const netMargin = grossFees - providerCosts;

      // Build daily data
      const dailyFees: { date: string; fees: number; volume: number; count: number; remitFees: number; billFees: number; bfxFees: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(Date.now() - i * 86400000);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const dayTx = await db.transaction.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { feeAmount: true, sendAmount: true },
          _count: true,
        });
        const dayBill = await db.billPayment.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { amount: true },
          _count: true,
        });
        const dayBfx = await db.businessTransaction.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { sellAmount: true },
          _count: true,
        });
        const remitFees = Number(dayTx._sum.feeAmount || 0);
        const billFees = Number(dayBill._sum.amount || 0) * 0.015;
        const bfxFees = Number(dayBfx._sum.sellAmount || 0) * 0.001;
        dailyFees.push({
          date: dayStart.toISOString().split('T')[0],
          fees: remitFees + billFees + bfxFees,
          volume: Number(dayTx._sum.sendAmount || 0) + Number(dayBill._sum.amount || 0) + Number(dayBfx._sum.sellAmount || 0),
          count: (dayTx._count || 0) + (dayBill._count || 0) + (dayBfx._count || 0),
          remitFees,
          billFees,
          bfxFees,
        });
      }

      return NextResponse.json({
        grossFees,
        totalVolume,
        transactionCount: txCount,
        providerCosts,
        netMargin,
        marginPct: totalVolume > 0 ? (netMargin / totalVolume) * 100 : 0,
        remit: {
          grossFees: Number(txAgg._sum.feeAmount || 0),
          totalVolume: Number(txAgg._sum.sendAmount || 0),
          txCount: txAgg._count || 0,
          providerCost: Number(txAgg._sum.feeAmount || 0) * 0.3,
          netRevenue: Number(txAgg._sum.feeAmount || 0) * 0.7,
          marginPct: 0,
        },
        bills: {
          grossFees: Number(billAgg._sum.amount || 0) * 0.015,
          totalVolume: Number(billAgg._sum.amount || 0),
          txCount: billAgg._count || 0,
          providerCost: Number(billAgg._sum.amount || 0) * 0.015 * 0.3,
          netRevenue: Number(billAgg._sum.amount || 0) * 0.015 * 0.7,
          marginPct: 0,
          byType: [],
        },
        bfx: {
          grossFees: Number(bfxAgg._sum.sellAmount || 0) * 0.001,
          totalVolume: Number(bfxAgg._sum.sellAmount || 0),
          txCount: bfxAgg._count || 0,
          providerCost: Number(bfxAgg._sum.sellAmount || 0) * 0.001 * 0.3,
          netRevenue: Number(bfxAgg._sum.sellAmount || 0) * 0.001 * 0.7,
          marginPct: 0,
        },
        byCorridor: [],
        byRail: [],
        byProvider: [],
        dailyFees,
      });
    }

    // ─── /api/admin/revenue/export ───
    if (path === 'revenue/export') {
      const csv = 'Corridor,Fees,Volume,Count,Provider Cost,Net Revenue\n';
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=revenue-by-corridor.csv' },
      });
    }

    // ─── /api/admin/fee-structure ───
    if (path === 'fee-structure') {
      const corridors = [
        'GB_KE', 'GB_NG', 'GB_GH', 'GB_UG', 'GB_TZ', 'GB_ZA',
        'US_NG', 'US_KE', 'US_GH', 'CA_GH', 'CA_KE', 'EU_KE', 'EU_NG',
      ];
      const DEFAULT_FLAT = '3.50';
      const DEFAULT_PCT = '1.5';
      const DEFAULT_MIN = '2.00';

      // Fetch all fee_ prefixed settings
      const allFeeSettings = await db.platformSetting.findMany({
        where: { key: { startsWith: 'fee_' } },
      });
      const feeMap: Record<string, string> = {};
      for (const s of allFeeSettings) {
        if (s.value) feeMap[s.key] = s.value;
      }

      const fees = corridors.map((c) => ({
        corridor: c,
        display: c.replace('_', ' → '),
        flatFee: feeMap[`fee_${c}_flat`] ?? DEFAULT_FLAT,
        pctFee: feeMap[`fee_${c}_pct`] ?? DEFAULT_PCT,
        minFee: feeMap[`fee_${c}_min`] ?? DEFAULT_MIN,
      }));

      return NextResponse.json({ fees });
    }

    // ─── /api/admin/providers ───
    if (path === 'providers') {
      const providers = await db.provider.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, displayName: true, slug: true, isActive: true, successRate30d: true, avgDeliverySec30d: true },
      });
      return NextResponse.json({ providers });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[admin-api GET] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // ─── /api/admin/settlement ───
    if (path === 'settlement') {
      const body = await req.json();
      const config = await getOrCreateSettlementConfig();

      const updates: Record<string, any> = {};
      if (body.companyName !== undefined) updates.companyName = String(body.companyName);
      if (body.registeredAddress !== undefined) updates.registeredAddress = String(body.registeredAddress);
      if (body.companyRegNumber !== undefined) updates.companyRegNumber = String(body.companyRegNumber);
      if (body.vatNumber !== undefined) updates.vatNumber = String(body.vatNumber);
      if (body.invoiceEmail !== undefined) updates.sweepNotifyEmail = String(body.invoiceEmail);
      if (body.sweepCurrency !== undefined) updates.sweepCurrency = String(body.sweepCurrency);
      if (body.sweepSchedule !== undefined) updates.sweepSchedule = String(body.sweepSchedule);
      if (body.sweepMinimum !== undefined) updates.sweepMinimum = Number(body.sweepMinimum);
      if (body.sweepNotifyEmail !== undefined) updates.sweepNotifyEmail = String(body.sweepNotifyEmail);

      await db.settlementConfig.update({ where: { id: config.id }, data: updates });

      return NextResponse.json({ success: true });
    }

    // ─── /api/admin/fee-structure ───
    if (path === 'fee-structure') {
      const body = await req.json();
      const fees: { corridor: string; flatFee?: string; pctFee?: string; minFee?: string }[] = body.fees;

      if (!Array.isArray(fees)) {
        return NextResponse.json({ error: 'fees array is required' }, { status: 400 });
      }

      for (const f of fees) {
        const c = String(f.corridor).toUpperCase();
        if (f.flatFee !== undefined && f.flatFee !== '') {
          await setSetting(`fee_${c}_flat`, String(f.flatFee));
        }
        if (f.pctFee !== undefined && f.pctFee !== '') {
          await setSetting(`fee_${c}_pct`, String(f.pctFee));
        }
        if (f.minFee !== undefined && f.minFee !== '') {
          await setSetting(`fee_${c}_min`, String(f.minFee));
        }
      }

      return NextResponse.json({ success: true });
    }

    // ─── /api/admin/settings ───
    if (path === 'settings') {
      const body = await req.json();

      // Save platform settings
      if (body.settings) {
        for (const [key, value] of Object.entries(body.settings)) {
          if (typeof value === 'string' && value.length > 0) {
            await setSetting(key, value);
          }
        }
      }

      // Save FX margin overrides
      if (body.margins && Array.isArray(body.margins)) {
        for (const m of body.margins) {
          if (m.corridor) {
            await db.fxMarginOverride.upsert({
              where: { corridor: String(m.corridor).toUpperCase() },
              update: { marginPct: Number(m.marginPct) },
              create: { corridor: String(m.corridor).toUpperCase(), marginPct: Number(m.marginPct) },
            });
          }
        }
      }

      // Save notification templates
      if (body.templates && Array.isArray(body.templates)) {
        for (const t of body.templates) {
          if (t.trigger) {
            await db.notificationTemplate.upsert({
              where: { trigger: t.trigger },
              update: { subject: t.subject || null, body: t.body || null, channel: t.channel || 'email' },
              create: { trigger: t.trigger, subject: t.subject || null, body: t.body || null, channel: t.channel || 'email' },
            });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[admin-api PUT] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // ─── /api/admin/paystack-keys ───
    if (path === 'paystack-keys') {
      const body = await req.json();

      // Save Fincra keys (primary payment processor)
      if (body.fincraPublicKey) {
        await setSetting('fincra_public_key', body.fincraPublicKey);
      }
      if (body.fincraSecretKey) {
        await setSetting('fincra_secret_key', body.fincraSecretKey);
      }

      // Save legacy paystack keys if provided
      if (body.publicKey) {
        await setSetting('paystack_public_key', body.publicKey);
      }
      if (body.secretKey) {
        await setSetting('paystack_secret_key', body.secretKey);
      }

      // Also support direct key names
      if (body.fincra_public_key) {
        await setSetting('fincra_public_key', body.fincra_public_key);
      }
      if (body.fincra_secret_key) {
        await setSetting('fincra_secret_key', body.fincra_secret_key);
      }
      if (body.paystack_public_key) {
        await setSetting('paystack_public_key', body.paystack_public_key);
      }
      if (body.paystack_secret_key) {
        await setSetting('paystack_secret_key', body.paystack_secret_key);
      }

      // Save partner keys
      if (body.mystocks_api_key) {
        await setSetting('mystocks_api_key', body.mystocks_api_key);
      }
      if (body.mystocks_partner_id) {
        await setSetting('mystocks_partner_id', body.mystocks_partner_id);
      }
      if (body.smile_id_api_key) {
        await setSetting('smile_id_api_key', body.smile_id_api_key);
      }
      if (body.smile_id_partner_id) {
        await setSetting('smile_id_partner_id', body.smile_id_partner_id);
      }
      if (body.pepchecker_api_key) {
        await setSetting('pepchecker_api_key', body.pepchecker_api_key);
      }
      if (body.at_api_key) {
        await setSetting('at_api_key', body.at_api_key);
      }
      if (body.at_username) {
        await setSetting('at_username', body.at_username);
      }
      if (body.resend_api_key) {
        await setSetting('resend_api_key', body.resend_api_key);
      }

      return NextResponse.json({ success: true, message: 'Keys saved successfully' });
    }

    // ─── /api/admin/settings/admins ───
    if (path === 'settings/admins') {
      const body = await req.json();
      const { email, password, fullName, role } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      // Check if email exists
      const existing = await db.adminUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const admin = await db.adminUser.create({
        data: {
          email,
          passwordHash,
          fullName: fullName || email.split('@')[0],
          role: role || 'ops',
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role } });
    }

    // ─── /api/admin/settings/admins/[id] (change password) ───
    if (path.startsWith('settings/admins/')) {
      const adminId = path.replace('settings/admins/', '');
      const body = await req.json();

      if (body.currentPassword && body.newPassword) {
        // Change password flow
        const adminUser = await db.adminUser.findUnique({ where: { id: adminId } });
        if (!adminUser) {
          return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        const valid = await verifyPassword(body.currentPassword, adminUser.passwordHash);
        if (!valid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
        }

        const newHash = await hashPassword(body.newPassword);
        await db.adminUser.update({ where: { id: adminId }, data: { passwordHash: newHash } });
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[admin-api POST] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // ─── /api/admin/settings/admins/[id] ───
    if (path.startsWith('settings/admins/')) {
      const adminId = path.replace('settings/admins/', '');
      const body = await req.json();

      const updates: Record<string, any> = {};
      if (body.role !== undefined) updates.role = body.role;
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.fullName !== undefined) updates.fullName = body.fullName;

      await db.adminUser.update({ where: { id: adminId }, data: updates });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[admin-api PATCH] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // ─── /api/admin/paystack-keys ───
    if (path === 'paystack-keys') {
      const body = await req.json();
      const { key } = body;

      if (key) {
        await db.platformSetting.deleteMany({ where: { key } });
      }

      return NextResponse.json({ success: true, message: `${key} removed` });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[admin-api DELETE] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
