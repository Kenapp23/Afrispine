const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = new PrismaClient();
  try {
    // Admin user
    const hash = await bcrypt.hash('Admin@123', 12);
    await db.adminUser.upsert({
      where: { email: 'admin@afrispine.com' },
      update: {},
      create: { email: 'admin@afrispine.com', passwordHash: hash, fullName: 'AfriSpine Admin', role: 'superadmin' },
    });

    // Providers
    await db.provider.upsert({ where: { slug: 'lemfi' }, update: {}, create: {
      name: 'LemFi', displayName: 'LemFi', slug: 'lemfi',
      apiBaseUrl: 'https://api.lemfi.com/v1', apiKey: 'sk_lemfi_sim', apiSecret: 'sec_lemfi_sim',
      webhookSecret: 'whsec_lemfi', supportedRails: 'mobile_money,bank',
      supportedCorridors: JSON.stringify(['GB-KE', 'US-KE', 'GB-NG', 'GB-GH']),
      weightSpeed: 0.4, weightCost: 0.3, weightReliability: 0.3,
      billingModel: 'volume_pct', billingRate: 0.5, billingEmail: 'billing@lemfi.com',
      successRate30d: 96, avgDeliverySec30d: 900,
    }});

    await db.provider.upsert({ where: { slug: 'at-pay' }, update: {}, create: {
      name: 'Africa\'s Talking Pay', displayName: 'AT Pay', slug: 'at-pay',
      apiBaseUrl: 'https://payments.africastalking.com/v1', apiKey: 'sk_at_sim', apiSecret: 'sec_at_sim',
      webhookSecret: 'whsec_at', supportedRails: 'mobile_money',
      supportedCorridors: JSON.stringify(['GB-KE', 'US-KE']),
      weightSpeed: 0.3, weightCost: 0.4, weightReliability: 0.3,
      billingModel: 'per_transaction', billingRate: 0.5, billingEmail: 'billing@africastalking.com',
      successRate30d: 93, avgDeliverySec30d: 1200,
    }});

    // Notification templates
    const triggers = ['payment_confirmed', 'delivered', 'failed', 'refunded', 'kyc_approved', 'kyc_rejected', 'settlement_received', 'aml_flag'];
    for (const t of triggers) {
      await db.notificationTemplate.upsert({ where: { trigger: t }, update: {}, create: {
        trigger: t, channel: 'email', subject: `AfriSpine: ${t}`, body: `Template for ${t}` } });
    }

    // Settlement config
    await db.settlementConfig.upsert({ where: { id: 'default' }, update: {}, create: {
      id: 'default', companyName: 'AfriSpine Ltd',
      sweepCurrency: 'GBP', sweepSchedule: 'daily', sweepMinimum: 50, sweepNotifyEmail: 'finance@afrispine.com',
    }});

    // FX margin overrides
    await db.fxMarginOverride.upsert({ where: { corridor: 'GB-KE' }, update: {}, create: { corridor: 'GB-KE', marginPct: 1.5 } });
    await db.fxMarginOverride.upsert({ where: { corridor: 'US-KE' }, update: {}, create: { corridor: 'US-KE', marginPct: 1.5 } });

    // ── Provider Architecture: Seed 6 providers (idempotent by slug) ──
    const providerSeeds = [
      {
        slug: 'lemfi',
        name: 'LemFi',
        displayName: 'LemFi',
        apiBaseUrl: 'https://api.lemfi.com/v1',
        supportedRails: 'mobile_money,bank',
        supportedCorridors: JSON.stringify([
          {"from":"GBP","to":"KES"},{"from":"GBP","to":"NGN"},{"from":"GBP","to":"GHS"},
          {"from":"USD","to":"KES"},{"from":"USD","to":"NGN"},{"from":"USD","to":"GHS"},
          {"from":"CAD","to":"KES"},{"from":"CAD","to":"NGN"},
        ]),
        weightSpeed: 85, weightCost: 75, weightReliability: 90,
        billingModel: 'per_transaction', billingRate: 0.50,
        billingEmail: 'partnerships@lemfi.com',
        isActive: true,
      },
      {
        slug: 'africas-talking',
        name: "Africa's Talking",
        displayName: "Africa's Talking",
        apiBaseUrl: 'https://payments.africastalking.com',
        supportedRails: 'mobile_money,airtime',
        supportedCorridors: JSON.stringify([
          {"from":"GBP","to":"KES"},{"from":"USD","to":"KES"},
          {"from":"GBP","to":"UGX"},{"from":"USD","to":"UGX"},
          {"from":"GBP","to":"TZS"},{"from":"GBP","to":"GHS"},
          {"from":"USD","to":"GHS"},{"from":"USD","to":"RWF"},
        ]),
        weightSpeed: 80, weightCost: 80, weightReliability: 85,
        billingModel: 'per_transaction', billingRate: 0.30,
        billingEmail: 'payments@africastalking.com',
        isActive: true,
      },
      {
        slug: 'mfs-africa',
        name: 'MFS Africa',
        displayName: 'MFS Africa',
        apiBaseUrl: 'https://api.mfsafrica.com/v1',
        supportedRails: 'mobile_money,ripple',
        supportedCorridors: JSON.stringify([
          {"from":"GBP","to":"KES"},{"from":"GBP","to":"NGN"},{"from":"GBP","to":"GHS"},
          {"from":"GBP","to":"UGX"},{"from":"GBP","to":"TZS"},{"from":"GBP","to":"ZAR"},
          {"from":"USD","to":"KES"},{"from":"USD","to":"NGN"},{"from":"USD","to":"GHS"},
          {"from":"USD","to":"ZAR"},
        ]),
        weightSpeed: 90, weightCost: 70, weightReliability: 92,
        billingModel: 'per_transaction', billingRate: 0.45,
        billingEmail: 'integrations@mfsafrica.com',
        isActive: true,
      },
      {
        slug: 'yellow-card',
        name: 'Yellow Card',
        displayName: 'Yellow Card',
        apiBaseUrl: 'https://api.yellowcard.io/v1',
        supportedRails: 'ripple,stablecoin,bank',
        supportedCorridors: JSON.stringify([
          {"from":"USD","to":"KES"},{"from":"USD","to":"NGN"},{"from":"USD","to":"GHS"},
          {"from":"USD","to":"ZAR"},{"from":"USD","to":"UGX"},{"from":"USD","to":"TZS"},
          {"from":"USD","to":"RWF"},{"from":"USD","to":"ZMW"},
          {"from":"GBP","to":"KES"},{"from":"GBP","to":"NGN"},
        ]),
        weightSpeed: 88, weightCost: 72, weightReliability: 89,
        billingModel: 'per_transaction', billingRate: 0.40,
        billingEmail: 'api@yellowcard.io',
        isActive: true,
      },
      {
        slug: 'ecobank',
        name: 'Ecobank',
        displayName: 'Ecobank (PAPSS)',
        apiBaseUrl: 'https://developer.ecobank.com/api/v1',
        supportedRails: 'papss,bank',
        supportedCorridors: JSON.stringify([
          {"from":"KES","to":"UGX"},{"from":"KES","to":"TZS"},{"from":"KES","to":"RWF"},
          {"from":"NGN","to":"GHS"},{"from":"GHS","to":"NGN"},{"from":"KES","to":"ZMW"},
          {"from":"NGN","to":"KES"},{"from":"GHS","to":"KES"},
          {"from":"ZAR","to":"KES"},{"from":"ZAR","to":"NGN"},
        ]),
        weightSpeed: 75, weightCost: 65, weightReliability: 88,
        billingModel: 'per_transaction', billingRate: 0.80,
        billingEmail: 'api@ecobank.com',
        isActive: true,
      },
      {
        slug: 'verto-fx',
        name: 'Verto FX',
        displayName: 'Verto FX',
        apiBaseUrl: 'https://api.useverto.com/v1',
        supportedRails: 'bank,corporate_fx',
        supportedCorridors: JSON.stringify([
          {"from":"GBP","to":"KES"},{"from":"GBP","to":"NGN"},
          {"from":"USD","to":"KES"},{"from":"USD","to":"NGN"},{"from":"USD","to":"GHS"},
          {"from":"EUR","to":"KES"},
          {"from":"KES","to":"USD"},{"from":"NGN","to":"USD"},{"from":"GHS","to":"USD"},
        ]),
        weightSpeed: 70, weightCost: 60, weightReliability: 95,
        billingModel: 'volume_pct', billingRate: 0.25,
        billingEmail: 'integrations@useverto.com',
        isActive: true,
      },
    ];

    for (const p of providerSeeds) {
      await db.provider.upsert({
        where: { slug: p.slug },
        update: {},
        create: p,
      });
      console.log(`  ✓ Provider "${p.displayName}" ensured (slug: ${p.slug})`);
    }

    console.log('Seed complete!');
  } finally { await db.$disconnect(); }
}
seed();
