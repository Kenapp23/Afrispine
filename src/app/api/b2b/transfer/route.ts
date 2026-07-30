import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Shared Config ───────────────────────────────────────────────────────

type RailOption = {
  id: string;
  rail: string;
  network: string;
  token: string;
  feeMultiplier: number;
  speed: string;
  matchType: string;
};

const RAIL_OPTIONS: RailOption[] = [
  { id: "ripple_odl", rail: "RippleNet ODL", network: "XRP Ledger", token: "XRP/RLUSD", feeMultiplier: 0.012, speed: "Instant", matchType: "ripple_odl" },
  { id: "stablecoin_stellar", rail: "Stellar", network: "Stellar Mainnet", token: "USDC", feeMultiplier: 0.016, speed: "Instant", matchType: "stablecoin_atomic" },
  { id: "stablecoin_polygon", rail: "Polygon", network: "Polygon PoS", token: "USDC", feeMultiplier: 0.014, speed: "< 2 min", matchType: "stablecoin_atomic" },
  { id: "papss", rail: "PAPSS", network: "AfCFTA Settlement", token: "Local Currency", feeMultiplier: 0.010, speed: "< 5 min", matchType: "papss_settle" },
  { id: "direct_mno", rail: "Direct API", network: "MNO/Bank Network", token: "Fiat", feeMultiplier: 0.022, speed: "< 2 min", matchType: "direct" },
  { id: "smart_netting", rail: "Netted Transfer", network: "AfriSpine Netting", token: "Offset", feeMultiplier: 0.008, speed: "Instant", matchType: "smart_match" },
];

const PARTNERS: Record<string, { name: string; type: string }> = {
  KE: { name: "Safaricom M-Pesa", type: "mno" },
  NG: { name: "MTN MoMo", type: "mno" },
  GH: { name: "Airtel Money", type: "mno" },
  ET: { name: "Ethio Telecom Telebirr", type: "mno" },
  TZ: { name: "Vodacom M-Pesa", type: "mno" },
  UG: { name: "MTN MoMo", type: "mno" },
  SN: { name: "Orange Money", type: "mno" },
  RW: { name: "MTN MoMo", type: "mno" },
  CM: { name: "MTN MoMo", type: "mno" },
  ZA: { name: "Standard Bank", type: "bank" },
  EG: { name: "CBE Mobile", type: "mno" },
};

const RATES: Record<string, { fx: number; fee: number; speed: string; recvCurrency: string }> = {
  KE: { fx: 153.5, fee: 0.018, speed: "Instant", recvCurrency: "KES" },
  NG: { fx: 1580, fee: 0.021, speed: "< 2 min", recvCurrency: "NGN" },
  GH: { fx: 15.1, fee: 0.017, speed: "Instant", recvCurrency: "GHS" },
  ET: { fx: 57.3, fee: 0.023, speed: "< 5 min", recvCurrency: "ETB" },
  TZ: { fx: 2650, fee: 0.019, speed: "< 2 min", recvCurrency: "TZS" },
  UG: { fx: 3820, fee: 0.020, speed: "< 2 min", recvCurrency: "UGX" },
  SN: { fx: 620, fee: 0.016, speed: "Instant", recvCurrency: "XOF" },
  RW: { fx: 1300, fee: 0.017, speed: "Instant", recvCurrency: "RWF" },
  CM: { fx: 610, fee: 0.018, speed: "< 2 min", recvCurrency: "XAF" },
  ZA: { fx: 18.5, fee: 0.015, speed: "Instant", recvCurrency: "ZAR" },
  EG: { fx: 50.0, fee: 0.016, speed: "< 2 min", recvCurrency: "EGP" },
};

function selectOptimalRail(destination: string, amount: number): RailOption {
  const scored = RAIL_OPTIONS.map((r) => {
    let score = 0;
    score += Math.max(0, (0.025 - r.feeMultiplier) / 0.025) * 40;
    if (r.speed === "Instant") score += 30;
    else if (r.speed.includes("2 min")) score += 20;
    else score += 10;
    if (r.id === "ripple_odl" && amount > 100) score += 15;
    if (r.id === "papss") score += 5;
    if (r.id === "smart_netting" && amount < 500) score += 12;
    score += Math.random() * 8;
    return { rail: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].rail;
}

function generateTxRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AS-${ts}-${rand}`;
}

// ── API Key Validation ──────────────────────────────────────────────────

async function validateApiKey(apiKey: string) {
  if (!apiKey || (!apiKey.startsWith("as_live_") && !apiKey.startsWith("as_test_"))) {
    return { valid: false, error: "Invalid API key. Keys must start with as_live_ or as_test_" };
  }

  const prefix = apiKey.substring(0, 12);
  let credential = null;
  try {
    credential = await db.b2BApiCredential.findFirst({
      where: { apiKeyPrefix: prefix, isActive: true },
      include: { participant: true },
    });
  } catch {
    // Allow simulated key if table not populated
  }

  if (credential) {
    await db.b2BApiCredential.update({
      where: { id: credential.id },
      data: { totalCalls: { increment: 1 }, lastUsedAt: new Date() },
    });
  }

  return {
    valid: true,
    credential,
    partnerFeeAgreement: credential?.participant?.feeAgreement ?? null,
    partnerId: credential?.participantId ?? null,
  };
}

// ── POST Handler ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, quoteId, sendAmount, destination, recipientPhone, recipientName, sourceCountry, railPreference } = body;

    // Validate API key
    const auth = await validateApiKey(apiKey);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Validate required fields
    if (!sendAmount || sendAmount < 1) {
      return NextResponse.json({ error: "Minimum send amount is $1.00" }, { status: 400 });
    }
    if (!destination) {
      return NextResponse.json({ error: "Destination country code is required" }, { status: 400 });
    }
    if (!recipientName || recipientName.trim().length < 2) {
      return NextResponse.json({ error: "Recipient name is required" }, { status: 400 });
    }
    if (!recipientPhone || recipientPhone.replace(/[^0-9]/g, "").length < 8) {
      return NextResponse.json({ error: "Valid recipient phone number is required" }, { status: 400 });
    }

    const route = RATES[destination];
    if (!route) {
      return NextResponse.json(
        { error: `Invalid destination. Supported: ${Object.keys(RATES).join(", ")}` },
        { status: 400 }
      );
    }

    const partner = PARTNERS[destination];
    const digitsOnly = recipientPhone.replace(/[^0-9]/g, "");

    // Select rail — use preference if provided and valid, otherwise auto-select
    let selectedRail: RailOption;
    if (railPreference) {
      const prefRail = RAIL_OPTIONS.find((r) => r.id === railPreference);
      if (prefRail) {
        selectedRail = prefRail;
      } else {
        selectedRail = selectOptimalRail(destination, sendAmount);
      }
    } else {
      selectedRail = selectOptimalRail(destination, sendAmount);
    }

    // Calculate amounts
    const jitter = 0.997 + Math.random() * 0.006;
    const effectiveFx = Math.round(route.fx * jitter * 100) / 100;
    const feeMultiplier = auth.partnerFeeAgreement
      ? auth.partnerFeeAgreement / 100
      : selectedRail.feeMultiplier;
    const fee = Math.round(sendAmount * feeMultiplier * 100) / 100;
    const recvAmount = Math.round((sendAmount - fee) * effectiveFx * 100) / 100;

    // Generate transaction reference
    const txRef = generateTxRef();

    // Find or create corridor record
    let corridor = null;
    try {
      corridor = await db.corridor.findFirst({
        where: { source: sourceCountry || "US", destination },
      });
      if (!corridor) {
        corridor = await db.corridor.create({
          data: {
            source: sourceCountry || "US",
            destination,
            sendCurrency: "USD",
            recvCurrency: route.recvCurrency,
            avgFee: feeMultiplier * 100,
            speed: selectedRail.speed,
            active: true,
          },
        });
      }
    } catch {
      // Continue without corridor if table issue
    }

    // Create transaction in DB
    const transaction = await db.transaction.create({
      data: {
        txRef,
        corridorId: corridor?.id ?? null,
        participantId: auth.partnerId ?? undefined,
        senderCountry: sourceCountry || "US",
        recvCountry: destination,
        sendCurrency: "USD",
        recvCurrency: route.recvCurrency,
        sendAmount,
        recvAmount,
        fee,
        feeCurrency: "USD",
        fxRate: effectiveFx,
        status: "matched",
        matchType: selectedRail.matchType,
        railName: selectedRail.rail,
        railNetwork: selectedRail.network,
        railToken: selectedRail.token,
        provider: partner.name,
        providerType: partner.type,
        recipientName: recipientName.trim(),
        recipientPhone: digitsOnly,
        recipientPhoneRaw: recipientPhone,
        speed: selectedRail.speed,
        savingsBps: Math.round((0.07 - feeMultiplier) * 10000),
        complianceScore: 85 + Math.random() * 15,
        metadata: JSON.stringify({
          quoteId: quoteId || null,
          source: "b2b_api",
          apiKeyPrefix: apiKey.substring(0, 12),
        }),
      },
    });

    // Create a fee revenue record for this transaction
    try {
      await db.revenueRecord.create({
        data: {
          transactionId: transaction.id,
          participantId: auth.partnerId ?? undefined,
          revenueType: "fee",
          amount: fee,
          currency: "USD",
          settledTo: "operational_pool",
          status: "collected",
        },
      });
    } catch {
      // Revenue record creation is non-blocking
    }

    // Calculate estimated settlement time based on rail
    const settlementDelay: Record<string, number> = {
      Instant: 30,
      "< 2 min": 120,
      "< 5 min": 300,
    };
    const estimatedSettlementSeconds = settlementDelay[selectedRail.speed] || 120;
    const estimatedSettlement = new Date(
      Date.now() + estimatedSettlementSeconds * 1000
    ).toISOString();

    return NextResponse.json({
      transferId: transaction.id,
      txRef,
      status: "matched",
      estimatedSettlement,
      railUsed: {
        id: selectedRail.id,
        rail: selectedRail.rail,
        network: selectedRail.network,
        token: selectedRail.token,
        speed: selectedRail.speed,
      },
      amounts: {
        sendAmount,
        sendCurrency: "USD",
        recvAmount,
        recvCurrency: route.recvCurrency,
        fxRate: effectiveFx,
        fee,
      },
      recipient: {
        name: recipientName.trim(),
        phone: digitsOnly,
        destination,
        provider: partner.name,
      },
      createdAt: transaction.createdAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}