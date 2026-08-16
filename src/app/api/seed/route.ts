import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await ensureDb();
    const admin = await db.adminUser.findUnique({ where: { email: 'admin@afri-spine.com' } });
    return NextResponse.json({ needsSeed: !admin, seeded: !!admin });
  } catch (error: any) {
    return NextResponse.json({ error: 'Check failed', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only allowed if no admin exists yet (bootstrap), or by an already-authenticated admin.
    // This closes the hole where anyone could POST here to (re)seed default credentials.
    const existingAdminCount = await db.adminUser.count().catch(() => 0);
    if (existingAdminCount > 0) {
      const { error, res } = await requireAdmin(req);
      if (error) return res;
    }

    await ensureDb();
    // 1. Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@afri-spine.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await db.adminUser.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        fullName: 'AfriSpine Admin',
        role: 'superadmin',
        isActive: true,
      },
    });

    // 2. Create providers
    await db.provider.upsert({
      where: { slug: 'lemfi' },
      update: {},
      create: {
        name: 'LemFi',
        displayName: 'LemFi',
        slug: 'lemfi',
        apiBaseUrl: 'https://api.lemfi.com/v1',
        apiKey: 'lemfi_sim_key',
        apiSecret: 'lemfi_sim_secret',
        webhookSecret: 'lemfi_wh_secret',
        supportedRails: 'mobile_money',
        supportedCorridors: '["GB-KE","US-KE"]',
        weightSpeed: 0.4,
        weightCost: 0.3,
        weightReliability: 0.3,
        billingModel: 'per_transaction',
        billingRate: 0.5,
        billingEmail: 'billing@lemfi.com',
        isActive: true,
        successRate30d: 96,
        avgDeliverySec30d: 900,
      },
    });

    await db.provider.upsert({
      where: { slug: 'at-pay' },
      update: {},
      create: {
        name: "Africa's Talking Pay",
        displayName: "Africa's Talking Pay",
        slug: 'at-pay',
        apiBaseUrl: 'https://api.africastalking.com/v1',
        apiKey: 'at_sim_key',
        apiSecret: 'at_sim_secret',
        webhookSecret: 'at_wh_secret',
        supportedRails: 'mobile_money',
        supportedCorridors: '["GB-KE","US-KE"]',
        weightSpeed: 0.3,
        weightCost: 0.4,
        weightReliability: 0.3,
        billingModel: 'per_transaction',
        billingRate: 0.6,
        billingEmail: 'billing@africastalking.com',
        isActive: true,
        successRate30d: 93,
        avgDeliverySec30d: 1200,
      },
    });

    // 3. Create notification templates
    const triggers = ['payment_confirmed', 'delivered', 'failed', 'refunded', 'kyc_approved', 'kyc_rejected'];
    const subjectMap: Record<string, string> = {
      payment_confirmed: 'Your payment has been confirmed',
      delivered: 'Your transfer has been delivered',
      failed: 'Your transfer could not be completed',
      refunded: 'Your payment has been refunded',
      kyc_approved: 'Your identity has been verified',
      kyc_rejected: 'Identity verification needs attention',
    };
    const bodyMap: Record<string, string> = {
      payment_confirmed: 'Hello {{senderName}}, your payment of {{amountSend}} {{currencySend}} (ref: {{reference}}) has been confirmed. We are now routing your transfer.',
      delivered: 'Hello {{senderName}}, your transfer of {{amountReceive}} {{currencyReceive}} (ref: {{reference}}) has been delivered to {{recipientName}}.',
      failed: 'Hello {{senderName}}, your transfer (ref: {{reference}}) could not be completed. Reason: {{reason}}. A refund has been initiated.',
      refunded: 'Hello {{senderName}}, your payment for transfer (ref: {{reference}}) has been refunded to your original payment method.',
      kyc_approved: 'Hello {{senderName}}, your identity verification has been approved. You can now send money.',
      kyc_rejected: 'Hello {{senderName}}, your identity verification was not successful. Please re-submit your documents.',
    };

    for (const trigger of triggers) {
      await db.notificationTemplate.upsert({
        where: { trigger },
        update: {},
        create: {
          trigger,
          channel: 'email',
          subject: subjectMap[trigger],
          body: bodyMap[trigger],
        },
      });
    }

    // 4. Create SettlementConfig
    const existingConfig = await db.settlementConfig.findFirst();
    if (!existingConfig) {
      await db.settlementConfig.create({
        data: {
          companyName: 'AfriSpine Ltd',
          registeredAddress: '{"line1":"123 Tech Lane","city":"London","country":"GB","postcode":"EC1A 1BB"}',
          companyRegNumber: 'AS-2024-001',
          vatNumber: 'GB123456789',
          settlementAccounts: '[{"currency":"USD","bank":"Chase","account":"12345678","routing":"021000021"}]',
          sweepCurrency: 'USD',
          sweepAccountId: 'acc_default_usd',
          sweepSchedule: 'daily',
          sweepMinimum: 50,
          sweepNotifyEmail: 'finance@afri-spine.com',
          flwAccountId: 'flw_merchant_001',
        },
      });
    }

    // 5. Create FxMarginOverride
    await db.fxMarginOverride.upsert({
      where: { corridor: 'GB-KE' },
      update: {},
      create: { corridor: 'GB-KE', marginPct: 1.5 },
    });

    await db.fxMarginOverride.upsert({
      where: { corridor: 'US-KE' },
      update: {},
      create: { corridor: 'US-KE', marginPct: 1.5 },
    });

    console.log('[SEED] Database seeded successfully via /api/seed');
    return NextResponse.json({ success: true, seeded: true });
  } catch (error: any) {
    console.error('[SEED]', error);
    return NextResponse.json({ error: 'Seed failed', details: error.message }, { status: 500 });
  }
}
