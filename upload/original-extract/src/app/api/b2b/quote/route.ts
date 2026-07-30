import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Multi-Rail Settlement System (shared logic) ─────────────────────────

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

// ── API Key Validation ──────────────────────────────────────────────────

async function validateApiKey(apiKey: string) {
  // Simulated validation: accept any key starting with "as_live_" or "as_test_"
  if (!apiKey || (!apiKey.startsWith("as_live_") && !apiKey.startsWith("as_test_"))) {
    return { valid: false, error: "Invalid API key. Keys must start with as_live_ or as_test_" };
  }

  // Try to look up in DB for partner-specific details
  const prefix = apiKey.substring(0, 12);
  let credential = null;
  try {
    credential = await db.b2BApiCredential.findFirst({
      where: { apiKeyPrefix: prefix, isActive: true },
      include: { participant: true },
    });
  } catch {
    // If table not yet populated, still allow the simulated key
  }

  // Update usage count if credential found
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
    const { apiKey, sendAmount, sendCurrency, destination, recipientPhone, recipientName, sourceCountry, partnerId } = body;

    // Validate API key
    const auth = await validateApiKey(apiKey);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Validate destination
    const route = RATES[destination];
    if (!route) {
      return NextResponse.json(
        { error: `Invalid destination. Supported: ${Object.keys(RATES).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate amount
    if (!sendAmount || sendAmount < 1) {
      return NextResponse.json({ error: "Minimum send amount is $1.00" }, { status: 400 });
    }
    if (sendAmount > 99999) {
      return NextResponse.json({ error: "Maximum send amount per transaction is $99,999.00" }, { status: 400 });
    }

    // Validate recipient
    if (!recipientName || recipientName.trim().length < 2) {
      return NextResponse.json({ error: "Recipient name is required (minimum 2 characters)" }, { status: 400 });
    }
    if (!recipientPhone || recipientPhone.replace(/[^0-9]/g, "").length < 8) {
      return NextResponse.json({ error: "Valid recipient phone number is required" }, { status: 400 });
    }

    // Select optimal rail
    const selectedRail = selectOptimalRail(destination, sendAmount);

    // Calculate quote with partner fee agreement if available
    const jitter = 0.997 + Math.random() * 0.006;
    const effectiveFx = Math.round(route.fx * jitter * 100) / 100;

    // Use partner's custom fee if they have a fee agreement, otherwise use rail fee
    const feeMultiplier = auth.partnerFeeAgreement
      ? auth.partnerFeeAgreement / 100
      : selectedRail.feeMultiplier;

    const fee = Math.round(sendAmount * feeMultiplier * 100) / 100;
    const recvAmount = Math.round((sendAmount - fee) * effectiveFx * 100) / 100;

    const partner = PARTNERS[destination];

    // Generate quote ID
    const quoteId = `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build B2B response
    const quoteData = {
      sendAmount,
      sendCurrency: sendCurrency || "USD",
      destination,
      recipientName: recipientName.trim(),
      recipientPhone,
      provider: partner.name,
      providerType: partner.type,
      recvCurrency: route.recvCurrency,
      fxRate: effectiveFx,
      fee,
      feePct: parseFloat((fee / sendAmount * 100).toFixed(2)),
      recvAmount,
      speed: selectedRail.speed,
      matchType: selectedRail.matchType,
    };

    return NextResponse.json({
      quoteId,
      quote: quoteData,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      partnerRate: auth.partnerFeeAgreement
        ? {
            agreedFeePct: auth.partnerFeeAgreement,
            effectiveFee: fee,
            customRate: true,
          }
        : {
            agreedFeePct: parseFloat((selectedRail.feeMultiplier * 100).toFixed(2)),
            effectiveFee: fee,
            customRate: false,
          },
      railRecommendation: {
        id: selectedRail.id,
        rail: selectedRail.rail,
        network: selectedRail.network,
        token: selectedRail.token,
        speed: selectedRail.speed,
        reason:
          selectedRail.id === "ripple_odl"
            ? "Best FX rate and instant settlement for this corridor"
            : selectedRail.id === "smart_netting"
              ? "Offsetting flows found — lowest cost route"
              : selectedRail.id === "papss"
                ? "Local currency settlement available via PAPSS"
                : "Optimized digital settlement for speed and cost",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}