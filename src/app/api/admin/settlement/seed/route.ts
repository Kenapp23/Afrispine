import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

const PARTNER_SEEDS = [
  {
    partnerId: 'fincra',
    partnerName: 'Fincra',
    purpose: 'Payments & Collections',
    configJson: JSON.stringify({
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
      testPublicKey: '',
      testSecretKey: '',
      testWebhookSecret: '',
    }),
  },
  {
    partnerId: 'mystocks_africa',
    partnerName: 'MyStocks Africa',
    purpose: 'Wealth & Investment',
    configJson: JSON.stringify({
      apiKey: '',
      partnerId: '',
      settlementEndpoint: '',
      testApiKey: '',
      testPartnerId: '',
    }),
  },
  {
    partnerId: 'africas_talking',
    partnerName: "Africa's Talking",
    purpose: 'SMS & Notifications',
    configJson: JSON.stringify({
      username: '',
      apiKey: '',
      testUsername: '',
      testApiKey: '',
    }),
  },
  {
    partnerId: 'resend',
    partnerName: 'Resend',
    purpose: 'Email Delivery',
    configJson: JSON.stringify({
      apiKey: '',
      testApiKey: '',
    }),
  },
  {
    partnerId: 'ngx_broker_desk',
    partnerName: 'Lagos Broker Desk (NGX)',
    purpose: 'Equity Execution',
    configJson: JSON.stringify({
      brokerId: '',
      clearingAccountId: '',
      cscsAccountPrefix: '',
      testBrokerId: '',
    }),
  },
];

const RULE_SEED = {
  ruleName: 'equity_purchase_usd',
  assetType: 'equity',
  currency: 'USD',
  afriSpineFeeBps: 235,
  partnerFeeBps: 75,
  brokerFeeBps: 0,
  settlementWindowMin: 15,
};

const COMPANY_CONFIG_SEEDS = [
  {
    configKey: 'bank_details',
    configJson: JSON.stringify({
      bankName: '', accountNumber: '', sortCode: '', routingNumber: '',
      swiftCode: '', iban: '', accountName: '', currency: '',
    }),
  },
  {
    configKey: 'tax_details',
    configJson: JSON.stringify({
      taxId: '', vatNumber: '', taxRegistrationCountry: '',
      taxAuthority: '', filingFrequency: '', lastFiledDate: '',
    }),
  },
  {
    configKey: 'company_info',
    configJson: JSON.stringify({
      legalName: '', tradingName: '', companyRegNumber: '',
      registeredAddress: '', registeredCountry: '',
      operationalAddress: '', contactEmail: '',
      contactPhone: '', website: '',
    }),
  },
];

export async function POST(req: NextRequest) {
  await ensureDb();
  const { error, res, admin } = await requireAdmin(req);
  if (error) return res!;

  try {
    let partnersCreated = 0;
    let rulesCreated = 0;
    let configsCreated = 0;

    for (const p of PARTNER_SEEDS) {
      const existing = await db.partnerConfig.findUnique({ where: { partnerId: p.partnerId } });
      if (!existing) {
        await db.partnerConfig.create({ data: p });
        partnersCreated++;
      }
    }

    const existingRule = await db.settlementRule.findFirst({ where: { ruleName: RULE_SEED.ruleName } });
    if (!existingRule) {
      await db.settlementRule.create({ data: RULE_SEED });
      rulesCreated++;
    }

    for (const c of COMPANY_CONFIG_SEEDS) {
      const existing = await db.companyConfig.findUnique({ where: { configKey: c.configKey } });
      if (!existing) {
        await db.companyConfig.create({ data: c });
        configsCreated++;
      }
    }

    const allPartners = await db.partnerConfig.findMany();
    const allRules = await db.settlementRule.findMany();
    const allConfigs = await db.companyConfig.findMany();

    return NextResponse.json({
      success: true,
      seeded: { partners: partnersCreated, rules: rulesCreated, configs: configsCreated },
      totals: { partners: allPartners.length, rules: allRules.length, configs: allConfigs.length },
    });
  } catch (e: any) {
    console.error('[settlement/seed]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
