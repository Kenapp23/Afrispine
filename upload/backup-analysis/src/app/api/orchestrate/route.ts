import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Core Orchestration Engine ─────────────────────────────────────────
// Graph-based bipartite matching + multi-objective rail scoring
// This is the "brain" of AfriSpine — selects optimal rail per transaction

type RailConfig = {
  id: string;
  rail: string;
  network: string;
  token: string;
  feeMultiplier: number;
  speed: string;
  matchType: string;
  reliability: number; // 0-1
  fxOptimization: number; // 0-1
};

const RAILS: RailConfig[] = [
  { id: "ripple_odl", rail: "RippleNet ODL", network: "XRP Ledger", token: "XRP/RLUSD", feeMultiplier: 0.012, speed: "Instant", matchType: "ripple_odl", reliability: 0.97, fxOptimization: 0.92 },
  { id: "stablecoin_stellar", rail: "Stellar", network: "Stellar Mainnet", token: "USDC", feeMultiplier: 0.016, speed: "Instant", matchType: "stablecoin_atomic", reliability: 0.95, fxOptimization: 0.88 },
  { id: "stablecoin_polygon", rail: "Polygon", network: "Polygon PoS", token: "USDC", feeMultiplier: 0.014, speed: "< 2 min", matchType: "stablecoin_atomic", reliability: 0.94, fxOptimization: 0.86 },
  { id: "papss", rail: "PAPSS", network: "AfCFTA Settlement", token: "Local Currency", feeMultiplier: 0.010, speed: "< 5 min", matchType: "papss_settle", reliability: 0.91, fxOptimization: 0.80 },
  { id: "direct_mno", rail: "Direct API", network: "MNO/Bank Network", token: "Fiat", feeMultiplier: 0.022, speed: "< 2 min", matchType: "direct", reliability: 0.88, fxOptimization: 0.70 },
  { id: "smart_netting", rail: "Netted Transfer", network: "AfriSpine Netting", token: "Offset", feeMultiplier: 0.008, speed: "Instant", matchType: "smart_match", reliability: 0.96, fxOptimization: 0.95 },
];

const AFRICAN_COUNTRIES = new Set([
  "KE", "NG", "GH", "ET", "TZ", "UG", "SN", "RW", "CM", "ZA", "EG",
  "CI", "ML", "BJ", "NE", "BF", "TD", "MG", "MU", "CD", "AO", "MZ",
  "ZM", "ZW", "NA", "BW", "LR", "SL", "GN", "GM", "CV", "ST", "KM", "ER", "SO", "SD", "TN", "MA", "DZ", "LY", "EG",
]);

const RIPPLE_STRONG_CORRIDORS = new Set(["AE", "SA", "CN", "CA", "AU", "IN", "QA", "KW", "BH", "OM"]);

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
  CI: { fx: 620, fee: 0.016, speed: "Instant", recvCurrency: "XOF" },
};

const PROVIDERS: Record<string, { name: string; type: string }> = {
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
  CI: { name: "Orange Money", type: "mno" },
};

// ── Multi-Objective Rail Scoring ──────────────────────────────────────

function scoreRail(
  rail: RailConfig,
  amount: number,
  sourceCountry: string,
  destination: string,
  hasNettingOpportunity: boolean
): { rail: RailConfig; score: number; breakdown: { fee: number; speed: number; reliability: number; fx: number; corridorBonus: number } } {
  const breakdown = { fee: 0, speed: 0, reliability: 0, fx: 0, corridorBonus: 0 };

  // 1. Fee score (0-40 points) — lower fee = higher score
  breakdown.fee = Math.max(0, (0.025 - rail.feeMultiplier) / 0.025) * 40;

  // 2. Speed score (0-30 points)
  if (rail.speed === "Instant") breakdown.speed = 30;
  else if (rail.speed.includes("2 min")) breakdown.speed = 20;
  else if (rail.speed.includes("5 min")) breakdown.speed = 12;
  else breakdown.speed = 5;

  // 3. Reliability score (0-20 points)
  breakdown.reliability = rail.reliability * 20;

  // 4. FX optimization score (0-10 points)
  breakdown.fx = rail.fxOptimization * 10;

  // 5. Corridor bonuses
  // Ripple bonus for GCC/China/Canada/Australia/India source
  if (rail.id === "ripple_odl" && RIPPLE_STRONG_CORRIDORS.has(sourceCountry)) {
    breakdown.corridorBonus += 15;
  }
  // PAPSS bonus for intra-Africa
  if (rail.id === "papss" && AFRICAN_COUNTRIES.has(sourceCountry) && AFRICAN_COUNTRIES.has(destination)) {
    breakdown.corridorBonus += 12;
  }
  // Smart netting bonus when offsetting flows exist
  if (rail.id === "smart_netting" && hasNettingOpportunity) {
    breakdown.corridorBonus += 18;
  }
  // Amount-based: Ripple better for high amounts (>500)
  if (rail.id === "ripple_odl" && amount > 500) {
    breakdown.corridorBonus += 5;
  }
  // Netting best for smaller amounts (<500)
  if (rail.id === "smart_netting" && amount < 500 && hasNettingOpportunity) {
    breakdown.corridorBonus += 8;
  }

  const score = breakdown.fee + breakdown.speed + breakdown.reliability + breakdown.fx + breakdown.corridorBonus;
  return { rail, score, breakdown };
}

// ── Graph-Based Bipartite Matching (Simplified) ───────────────────────

interface LiquidityProvider {
  id: string;
  name: string;
  type: string;
  rails: string[];
  maxAmount: number;
  rate: number;
  fee: number;
}

function simulateBipartiteMatching(
  sendAmount: number,
  destination: string
): { matched: boolean; provider: LiquidityProvider | null; matchScore: number; nettingOpportunity: boolean; matchDetails: string } {
  // Simulate a pool of liquidity providers on the demand side
  const providers: LiquidityProvider[] = [
    { id: "lp1", name: "Circle USDC Pool", type: "stablecoin_lp", rails: ["stablecoin_stellar", "stablecoin_polygon"], maxAmount: 500000, rate: 0.001, fee: 0.015 },
    { id: "lp2", name: "RippleNet ODL Pool", type: "ripple", rails: ["ripple_odl"], maxAmount: 1000000, rate: 0.0012, fee: 0.012 },
    { id: "lp3", name: "PAPSS Netting Pool", type: "settlement", rails: ["papss"], maxAmount: 250000, rate: 0.001, fee: 0.010 },
    { id: "lp4", name: "M-Pesa Liquidity", type: "mno", rails: ["direct_mno", "smart_netting"], maxAmount: 100000, rate: 0.002, fee: 0.020 },
    { id: "lp5", name: "KCB Bank Pool", type: "bank", rails: ["papss", "direct_mno"], maxAmount: 750000, rate: 0.0015, fee: 0.018 },
    { id: "lp6", name: "RLUSD Liquidity", type: "stablecoin_lp", rails: ["ripple_odl"], maxAmount: 300000, rate: 0.001, fee: 0.011 },
  ];

  // Build bipartite graph: demand node (this transaction) vs supply nodes (providers)
  // Score each edge (demand → provider) based on capacity, rate, and fee
  const scoredProviders = providers
    .filter(p => p.maxAmount >= sendAmount)
    .map(p => ({
      provider: p,
      // Edge weight: higher is better match
      edgeScore: (1 - p.fee / 0.025) * 40 + (1 - p.rate / 0.003) * 30 + (p.maxAmount / 1000000) * 30,
    }))
    .sort((a, b) => b.edgeScore - a.edgeScore);

  const matched = scoredProviders.length > 0;
  const best = scoredProviders[0];

  // Check for netting opportunity: simulate existing offsetting flows
  const hasNetting = Math.random() < 0.35; // 35% chance of finding offsetting flows

  let matchDetails = "";
  if (matched) {
    matchDetails = `Bipartite match found: demand (${sendAmount} ${destination}) matched to ${best.provider.name} (capacity: $${best.provider.maxAmount.toLocaleString()}, edge score: ${best.edgeScore.toFixed(1)}). `;
    matchDetails += `Graph nodes evaluated: ${providers.length} supply nodes. `;
    matchDetails += hasNetting ? "Netting opportunity detected — offsetting flows found in same corridor." : "No offsetting flows available for netting.";
  } else {
    matchDetails = `No provider with sufficient capacity for $${sendAmount}. Fallback to direct rail routing.`;
  }

  return {
    matched,
    provider: best?.provider || null,
    matchScore: best?.edgeScore || 0,
    nettingOpportunity: hasNetting,
    matchDetails,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sendAmount, sendCurrency = "USD", destination, recipientPhone, recipientName, sourceCountry = "US" } = body;

    const route = RATES[destination];
    if (!route) {
      return NextResponse.json({ error: `Invalid destination. Supported: ${Object.keys(RATES).join(", ")}` }, { status: 400 });
    }
    if (!sendAmount || sendAmount < 1) {
      return NextResponse.json({ error: "Minimum send amount is $1.00" }, { status: 400 });
    }
    if (sendAmount > 9999) {
      return NextResponse.json({ error: "Maximum per transaction is $9,999.00" }, { status: 400 });
    }

    // ── Step 1: Bipartite Matching ──
    const matching = simulateBipartiteMatching(sendAmount, destination);

    // ── Step 2: Multi-Rail Scoring ──
    const railScores = RAILS.map(rail =>
      scoreRail(rail, sendAmount, sourceCountry, destination, matching.nettingOpportunity)
    ).sort((a, b) => b.score - a.score);

    const selected = railScores[0];

    // ── Step 3: Calculate Quote ──
    const jitter = 0.997 + Math.random() * 0.006;
    const effectiveFx = Math.round(route.fx * jitter * 100) / 100;
    const fee = Math.round(sendAmount * selected.rail.feeMultiplier * 100) / 100;
    const recvAmount = Math.round((sendAmount - fee) * effectiveFx * 100) / 100;

    // Comparison with traditional MTO
    const mtoFee = Math.round(sendAmount * 0.07 * 100) / 100;
    const mtoRecv = Math.round((sendAmount - mtoFee) * (effectiveFx * 0.97) * 100) / 100;
    const savings = recvAmount - mtoRecv;

    const provider = PROVIDERS[destination] || { name: "Bank Partner", type: "bank" };

    return NextResponse.json({
      // Core quote
      sendAmount,
      sendCurrency,
      destination,
      recipientName: recipientName?.trim() || "",
      recipientPhone: recipientPhone?.trim() || "",
      provider: provider.name,
      providerType: provider.type,
      recvCurrency: route.recvCurrency,
      fxRate: effectiveFx,
      fee,
      feePct: (fee / sendAmount * 100).toFixed(1),
      recvAmount,
      speed: selected.rail.speed,
      matchType: selected.rail.matchType,

      // Rail details
      settlement: selected.rail.rail,
      settlementNetwork: selected.rail.network,
      settlementToken: selected.rail.token,
      railSelected: {
        id: selected.rail.id,
        rail: selected.rail.rail,
        score: selected.score,
        breakdown: selected.breakdown,
        reason: selected.rail.id === "ripple_odl"
          ? RIPPLE_STRONG_CORRIDORS.has(sourceCountry)
            ? "Ripple ODL provides best FX rate and instant settlement for this global corridor"
            : "Ripple ODL selected for speed and competitive FX"
          : selected.rail.id === "smart_netting" && matching.nettingOpportunity
            ? "Offsetting flows detected — smart netting provides lowest cost route"
            : selected.rail.id === "papss_settle" || selected.rail.id === "papss"
              ? "PAPSS local currency settlement available — lowest fee for intra-Africa"
              : "Optimized digital settlement selected for speed, cost, and reliability",
      },

      // All rail scores (ranked)
      railScores: railScores.map(rs => ({
        id: rs.rail.id,
        rail: rs.rail.rail,
        score: Math.round(rs.score * 10) / 10,
        breakdown: rs.breakdown,
        feePct: (rs.rail.feeMultiplier * 100).toFixed(1),
        speed: rs.rail.speed,
      })),

      // Matching details
      bipartiteMatchDetails: {
        matched: matching.matched,
        matchedProvider: matching.provider ? { name: matching.provider.name, type: matching.provider.type, rails: matching.provider.rails } : null,
        matchScore: matching.matchScore,
        nettingOpportunity: matching.nettingOpportunity,
        details: matching.matchDetails,
        graphNodes: RAILS.length + 6, // rails + providers
      },

      // Comparison
      comparison: {
        mtoFee,
        mtoRecvAmount: mtoRecv,
        youSave: Math.round(savings),
        savingsPct: Math.round(savings / mtoRecv * 100),
      },
    });
  } catch (error) {
    console.error("[Orchestrate] Error:", error);
    return NextResponse.json({ error: "Orchestration engine error. Please try again." }, { status: 500 });
  }
}