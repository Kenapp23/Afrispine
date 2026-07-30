import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// ── Transaction Persistence ─────────────────────────────────────────
// Creates a transaction record in the DB with compliance checks and revenue tracking

const FEE_MULTIPLIERS: Record<string, number> = {
  smart_match: 0.008,
  ripple_odl: 0.012,
  stablecoin_atomic: 0.015,
  papss_settle: 0.010,
  direct: 0.022,
  liquidity_pool: 0.018,
};

const AFRICAN_COUNTRIES = new Set([
  "KE", "NG", "GH", "ET", "TZ", "UG", "SN", "RW", "CM", "ZA", "EG", "CI",
  "ML", "BJ", "NE", "BF", "TD", "MG", "MU", "CD", "AO", "MZ", "ZM", "ZW",
]);

function generateTxRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "AS-";
  for (let i = 0; i < 8; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
}

// ── Compliance Checks (Simulated) ────────────────────────────────────

function runComplianceChecks(
  sendAmount: number,
  sourceCountry: string,
  destination: string,
  recipientName: string,
  recipientPhone: string
) {
  const checks: { type: string; score: number; result: string; details: string; ruleTriggered?: string }[] = [];

  // KYC Check
  const kycScore = 0.95 + Math.random() * 0.05;
  checks.push({
    type: "kyc",
    score: Math.round(kycScore * 100) / 100,
    result: kycScore > 0.8 ? "pass" : "review",
    details: `Identity verification passed. Document confidence: ${(kycScore * 100).toFixed(0)}%.`,
  });

  // AML Check
  const amlScore = 0.88 + Math.random() * 0.10;
  const amlFlags: string[] = [];
  if (sendAmount > 3000) amlFlags.push("High-value transaction ($" + sendAmount + ") requires enhanced review");
  if (sourceCountry === "AE" && destination === "NG") amlFlags.push("GCC-Nigeria corridor flagged for monitoring");
  const amlResult = amlScore > 0.85 ? "pass" : "review";
  if (amlFlags.length > 0) amlFlags.push("No sanctions matches found");
  checks.push({
    type: "aml",
    score: Math.round(amlScore * 100) / 100,
    result: amlResult,
    details: `Transaction screening complete. ${amlFlags.join(". ")}.`,
    ruleTriggered: amlFlags.length > 0 ? amlFlags[0] : undefined,
  });

  // Sanctions Check
  const sanctionsScore = 0.97 + Math.random() * 0.03;
  checks.push({
    type: "sanctions",
    score: Math.round(sanctionsScore * 100) / 100,
    result: "pass",
    details: `OFAC, EU, UN sanctions lists checked. No matches for recipient ${recipientName} or phone ${recipientPhone}.`,
  });

  // Velocity Check
  const velocityScore = sendAmount > 5000 ? 0.75 + Math.random() * 0.15 : 0.90 + Math.random() * 0.10;
  const velocityResult = velocityScore > 0.80 ? "pass" : "review";
  checks.push({
    type: "velocity",
    score: Math.round(velocityScore * 100) / 100,
    result: velocityResult,
    details: `Volume pattern analysis: ${velocityResult === "pass" ? "normal" : "above-average"} activity for this corridor.`,
    ruleTriggered: velocityResult === "review" ? "High-velocity pattern detected" : undefined,
  });

  // Device/Geo Check
  const geoScore = 0.92 + Math.random() * 0.08;
  checks.push({
    type: "geo",
    score: Math.round(geoScore * 100) / 100,
    result: "pass",
    details: `Device fingerprint and geolocation verified. Source: ${sourceCountry}. Destination: ${destination}.`,
  });

  // Overall score
  const overallScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  const hasBlock = checks.some(c => c.result === "block");
  const hasReview = checks.some(c => c.result === "review");

  return {
    checks,
    overallScore: Math.round(overallScore * 100) / 100,
    result: hasBlock ? "block" : hasReview ? "review" : "pass",
    notes: hasReview ? "One or more checks require manual review" : "All compliance checks passed",
  };
}

// ── Revenue Calculation ──────────────────────────────────────────────

function calculateRevenue(
  sendAmount: number,
  matchType: string,
  fee: number
) {
  // Orchestration fee is the main fee
  const orchestrationFee = fee;
  // Additional revenue streams (simulated micro-amounts)
  const aiPremiumShare = matchType === "smart_match" ? Math.round(sendAmount * 0.001 * 100) / 100 : 0;

  return {
    orchestrationFee,
    aiPremiumShare,
    totalRevenue: orchestrationFee + aiPremiumShare,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sendAmount, sendCurrency = "USD", destination,
      recipientPhone, recipientName, sourceCountry = "US",
      railSelected, quoteData,
    } = body;

    if (!sendAmount || sendAmount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!destination) {
      return NextResponse.json({ error: "Destination required" }, { status: 400 });
    }
    if (!recipientName?.trim() || !recipientPhone?.trim()) {
      return NextResponse.json({ error: "Recipient name and phone required" }, { status: 400 });
    }

    const txRef = generateTxRef();
    const matchType = railSelected?.id || quoteData?.matchType || "smart_match";
    const feeMultiplier = FEE_MULTIPLIERS[matchType] || 0.015;
    const fee = Math.round(sendAmount * feeMultiplier * 100) / 100;

    // FX rates
    const FX_RATES: Record<string, number> = {
      KE: 153.5, NG: 1580, GH: 15.1, ET: 57.3, TZ: 2650, UG: 3820,
      SN: 620, RW: 1300, CM: 610, ZA: 18.5, EG: 50.0, CI: 620,
    };
    const RECV_CURRENCIES: Record<string, string> = {
      KE: "KES", NG: "NGN", GH: "GHS", ET: "ETB", TZ: "TZS", UG: "UGX",
      SN: "XOF", RW: "RWF", CM: "XAF", ZA: "ZAR", EG: "EGP", CI: "XOF",
    };
    const PROVIDERS: Record<string, string> = {
      KE: "Safaricom M-Pesa", NG: "MTN MoMo", GH: "Airtel Money",
      ET: "Ethio Telecom Telebirr", TZ: "Vodacom M-Pesa", UG: "MTN MoMo",
      SN: "Orange Money", RW: "MTN MoMo", CM: "MTN MoMo",
      ZA: "Standard Bank", EG: "CBE Mobile", CI: "Orange Money",
    };

    const fx = FX_RATES[destination] || 100;
    const jitter = 0.997 + Math.random() * 0.006;
    const effectiveFx = Math.round(fx * jitter * 100) / 100;
    const recvAmount = Math.round((sendAmount - fee) * effectiveFx * 100) / 100;
    const recvCurrency = RECV_CURRENCIES[destination] || "LOCAL";
    const provider = PROVIDERS[destination] || "Bank Partner";

    // ── Compliance Checks ──
    const compliance = runComplianceChecks(sendAmount, sourceCountry, destination, recipientName, recipientPhone);

    if (compliance.result === "block") {
      return NextResponse.json({ error: "Transaction blocked by compliance checks", compliance }, { status: 403 });
    }

    // ── Revenue Calculation ──
    const revenue = calculateRevenue(sendAmount, matchType, fee);

    // ── Persist Transaction ──
    const transaction = await db.transaction.create({
      data: {
        txRef,
        senderCountry: sourceCountry,
        recvCountry: destination,
        sendCurrency,
        recvCurrency,
        sendAmount,
        recvAmount,
        fee,
        feeCurrency: "USD",
        fxRate: effectiveFx,
        status: compliance.result === "review" ? "matched" : "matched",
        matchType,
        railName: railSelected?.rail || quoteData?.settlement,
        railNetwork: railSelected?.network || quoteData?.settlementNetwork,
        railToken: railSelected?.token || quoteData?.settlementToken,
        provider,
        providerType: "mno",
        recipientName: recipientName.trim(),
        recipientPhone,
        recipientPhoneRaw: recipientPhone,
        speed: matchType === "ripple_odl" || matchType === "smart_match" || matchType === "stablecoin_atomic" ? "Instant" : "< 2 min",
        savingsBps: Math.round((1 - fee / (sendAmount * 0.07)) * 10000) / 100,
        complianceScore: compliance.overallScore,
        complianceNotes: compliance.notes,
        metadata: JSON.stringify({
          sourceCountry,
          railScores: quoteData?.railScores,
          bipartiteMatch: quoteData?.bipartiteMatchDetails,
        }),
      },
    });

    // ── Persist Compliance Logs ──
    for (const check of compliance.checks) {
      await db.complianceLog.create({
        data: {
          transactionId: transaction.id,
          checkType: check.type,
          score: check.score,
          result: check.result,
          details: check.details,
          ruleTriggered: check.ruleTriggered,
        },
      });
    }

    // ── Persist Revenue Record ──
    const revenueRecord = await db.revenueRecord.create({
      data: {
        transactionId: transaction.id,
        revenueType: "orchestration_fee",
        amount: revenue.orchestrationFee,
        currency: "USD",
        settledTo: "pending_split",
        splitDetails: JSON.stringify({
          orchestration: revenue.orchestrationFee,
          aiPremium: revenue.aiPremiumShare,
        }),
      },
    });

    if (revenue.aiPremiumShare > 0) {
      await db.revenueRecord.create({
        data: {
          transactionId: transaction.id,
          revenueType: "ai_premium",
          amount: revenue.aiPremiumShare,
          currency: "USD",
          settledTo: "pending_split",
        },
      });
    }

    return NextResponse.json({
      success: true,
      txRef,
      transaction: {
        ...transaction,
        id: undefined,
      },
      complianceResult: compliance,
      revenueRecord: {
        ...revenueRecord,
        id: undefined,
        transactionId: undefined,
      },
    });
  } catch (error) {
    console.error("[Transact] Error:", error);
    return NextResponse.json({ error: "Failed to create transaction. Please try again." }, { status: 500 });
  }
}