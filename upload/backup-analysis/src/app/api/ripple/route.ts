import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Simulated XRP market rate ───────────────────────────────────────
const XRP_USD_RATE = 0.48; // simulated XRP/USD
const XRP_TX_FEE = 0.0001; // XRP transaction fee in XRP
const RLUSD_SLIPPAGE_BPS = 1; // 0.01% slippage for RLUSD
const RLUSD_GAS_FEE_USD = 0.000012; // tiny gas fee for RLUSD

// ── Corridors with strong Ripple presence ───────────────────────────
const RIPPLE_STRONG_CORRIDORS = new Set([
  "US->AE", "US->SA", "US->QA", "US->BH", "US->KW", "US->OM",  // GCC
  "US->CN",  // China
  "US->CA",  // Canada
  "US->MX",  // Mexico
  "US->PH",  // Philippines
  "US->GB",  // UK
  "AE->IN",  // UAE→India
  "SA->PH",  // Saudi→Philippines
]);

// ── Simulated FX rates for cross-border corridors ───────────────────
const CORRIDOR_FX: Record<string, number> = {
  "US->KE": 153.5,
  "US->NG": 1550,
  "US->GH": 12.05,
  "US->ZA": 18.5,
  "US->UG": 3800,
  "US->TZ": 2700,
  "US->EG": 48.5,
  "US->ET": 120.5,
  "US->AE": 3.67,
  "US->SA": 3.75,
  "US->QA": 3.64,
  "US->BH": 0.376,
  "US->KW": 0.308,
  "US->OM": 0.384,
  "US->CN": 7.24,
  "US->CA": 1.37,
  "US->MX": 17.15,
  "US->PH": 56.2,
  "US->GB": 0.79,
  "US->IN": 83.5,
  "AE->IN": 22.74,
  "SA->PH": 14.99,
  "GB->KE": 194.3,
  "GB->NG": 1962,
  "GB->GH": 15.26,
  "EU->NG": 1680,
  "EU->KE": 166.8,
};

function getCorridorFxRate(corridor: string): number {
  if (CORRIDOR_FX[corridor]) return CORRIDOR_FX[corridor];
  // Reverse lookup
  const parts = corridor.split("->");
  if (parts.length === 2) {
    const reverse = `${parts[1]}->${parts[0]}`;
    if (CORRIDOR_FX[reverse]) return 1 / CORRIDOR_FX[reverse];
  }
  return 1.0;
}

// ── Generate fake Ripple tx hash ────────────────────────────────────
function generateRippleTxHash(): string {
  const chars = "0123456789ABCDEF";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// ── Generate random hex ID ──────────────────────────────────────────
function randomHexId(prefix: string, bytes: number = 8): string {
  const chars = "0123456789abcdef";
  let id = prefix;
  for (let i = 0; i < bytes * 2; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ── Simulated source/destination addresses ──────────────────────────
function generateAddress(prefix: string): string {
  return `r${prefix}${Math.random().toString(36).substring(2, 10)}`.padEnd(34, "x").substring(0, 34);
}

// ── Single ODL transaction processing ───────────────────────────────
async function processSingleOdl(params: {
  sendAmount: number;
  sendCurrency: string;
  recvCurrency: string;
  corridor: string;
  bridgeAsset: string;
}): Promise<{
  odlQuoteId: string;
  bridgeAsset: string;
  sendAmount: number;
  bridgeAmount: number;
  destinationAmount: number;
  fees: Record<string, number | string>;
  estimatedTime: string;
  status: string;
  corridor: string;
  rippleTxHash: string | null;
  sourceAddress: string;
  destAddress: string;
  settlementDelay: number;
  xrpMarketRate?: number;
  fxRate: number;
  liquidityProvider?: string;
}> {
  const { sendAmount, sendCurrency, recvCurrency, corridor, bridgeAsset } = params;

  const fxRate = getCorridorFxRate(corridor);
  const sourceAddress = generateAddress("SRC");
  const destAddress = generateAddress("DST");

  let bridgeAmount: number;
  let feeXrp = 0;
  let feeUsd = 0;
  let xrpMarketRate: number | undefined;
  let gasFee = 0;
  let slippageUsd = 0;

  const odlQuoteId = randomHexId("ODL-", 8);

  if (bridgeAsset === "RLUSD") {
    // RLUSD: 1:1 USD peg with tiny slippage
    const slipFactor = RLUSD_SLIPPAGE_BPS / 10000;
    slippageUsd = sendAmount * slipFactor;
    bridgeAmount = sendAmount - slippageUsd;
    gasFee = RLUSD_GAS_FEE_USD;
    feeUsd = slippageUsd + gasFee;
  } else {
    // XRP bridge
    xrpMarketRate = XRP_USD_RATE;
    bridgeAmount = sendAmount / xrpMarketRate;
    feeXrp = XRP_TX_FEE;
    feeUsd = feeXrp * xrpMarketRate;
  }

  // Destination amount after FX conversion (minus fees)
  const bridgeUsdValue = bridgeAsset === "RLUSD" ? bridgeAmount : bridgeAmount * XRP_USD_RATE;
  const destinationAmount = bridgeUsdValue * fxRate;

  // Settlement delay based on corridor strength
  let minDelay: number;
  let maxDelay: number;
  if (RIPPLE_STRONG_CORRIDORS.has(corridor)) {
    minDelay = 1000;
    maxDelay = 3000;
  } else {
    minDelay = 2000;
    maxDelay = 4000;
  }
  const settlementDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;

  // Determine liquidity provider
  const providers = ["Bitso", "Coinbase", "Binance", "Uphold", "MoonPay"];
  const hasStrongPresence = RIPPLE_STRONG_CORRIDORS.has(corridor);
  const liquidityProvider = hasStrongPresence
    ? providers[Math.floor(Math.random() * providers.length)]
    : providers[Math.floor(Math.random() * 2)] + " (limited)";

  // Write to DB
  const txRef = randomHexId("TXR-", 8);
  await db.rippleSettlement.create({
    data: {
      txRef,
      odlQuoteId,
      sourceAddress,
      destAddress,
      sendAmount,
      xrpAmount: bridgeAsset === "XRP" ? bridgeAmount : null,
      rlusdAmount: bridgeAsset === "RLUSD" ? bridgeAmount : null,
      bridgeAsset,
      sendCurrency,
      recvCurrency,
      fxRate,
      xrpMarketRate: bridgeAsset === "XRP" ? xrpMarketRate : null,
      feeXrp,
      feeUsd,
      status: "quoted",
      corridor,
      liquidityProvider,
    },
  });

  // Simulate settlement after delay
  const rippleTxHash = generateRippleTxHash();

  setTimeout(async () => {
    try {
      await db.rippleSettlement.update({
        where: { txRef },
        data: {
          status: "settled",
          rippleTxHash,
        },
      });
    } catch {
      // Settlement update failed silently
    }
  }, settlementDelay);

  return {
    odlQuoteId,
    bridgeAsset,
    sendAmount,
    bridgeAmount: Math.round(bridgeAmount * 1000000) / 1000000,
    destinationAmount: Math.round(destinationAmount * 100) / 100,
    fees: {
      bridgeFeeXrp: feeXrp,
      bridgeFeeUsd: Math.round(feeUsd * 1000000) / 1000000,
      slippageUsd: bridgeAsset === "RLUSD" ? Math.round(slippageUsd * 1000000) / 1000000 : null,
      gasFee: bridgeAsset === "RLUSD" ? gasFee : null,
      totalFeeUsd: Math.round(feeUsd * 1000000) / 1000000,
    },
    estimatedTime: `${(settlementDelay / 1000).toFixed(1)}s`,
    status: "quoted",
    corridor,
    rippleTxHash: null, // will be generated after settlement
    sourceAddress,
    destAddress,
    settlementDelay,
    xrpMarketRate,
    fxRate,
    liquidityProvider,
  };
}

// ── POST: Initiate ODL transfer or batch simulation ─────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Batch simulation mode ──────────────────────────────────────
    if (body.action === "simulate_batch") {
      const corridors = [
        { corridor: "US->KE", sendCurrency: "USD", recvCurrency: "KES", asset: "XRP" },
        { corridor: "US->NG", sendCurrency: "USD", recvCurrency: "NGN", asset: "RLUSD" },
        { corridor: "US->AE", sendCurrency: "USD", recvCurrency: "AED", asset: "XRP" },
        { corridor: "GB->KE", sendCurrency: "GBP", recvCurrency: "KES", asset: "XRP" },
        { corridor: "US->GH", sendCurrency: "USD", recvCurrency: "GHS", asset: "RLUSD" },
      ];

      const amounts = [100, 250, 500, 1000, 2000];
      const results = [];

      for (let i = 0; i < 5; i++) {
        const config = corridors[i % corridors.length];
        const sendAmount = amounts[i % amounts.length];
        const bridgeAsset = Math.random() > 0.5 ? "XRP" : "RLUSD";

        const result = await processSingleOdl({
          sendAmount,
          sendCurrency: config.sendCurrency,
          recvCurrency: config.recvCurrency,
          corridor: config.corridor,
          bridgeAsset,
        });
        results.push(result);
      }

      return NextResponse.json({
        action: "simulate_batch",
        batchId: randomHexId("BATCH-", 6),
        count: results.length,
        transactions: results,
        summary: {
          totalSendVolume: results.reduce((s, r) => s + r.sendAmount, 0),
          xrpCount: results.filter((r) => r.bridgeAsset === "XRP").length,
          rlusdCount: results.filter((r) => r.bridgeAsset === "RLUSD").length,
          corridors: [...new Set(results.map((r) => r.corridor))],
        },
      });
    }

    // ── Single ODL transfer ───────────────────────────────────────
    const { sendAmount, sendCurrency, recvCurrency, corridor, bridgeAsset } = body;

    if (!sendAmount || !sendCurrency || !recvCurrency || !corridor) {
      return NextResponse.json(
        { error: "Missing required fields. Provide: sendAmount, sendCurrency, recvCurrency, corridor" },
        { status: 400 }
      );
    }

    const asset = bridgeAsset === "RLUSD" ? "RLUSD" : "XRP";

    const result = await processSingleOdl({
      sendAmount,
      sendCurrency,
      recvCurrency,
      corridor,
      bridgeAsset: asset,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Ripple ODL processing failed: ${message}` },
      { status: 500 }
    );
  }
}

// ── GET: Retrieve all Ripple settlements with summary ───────────────
export async function GET() {
  try {
    const settlements = await db.rippleSettlement.findMany({
      orderBy: { createdAt: "desc" },
    });

    const totalSettlements = settlements.length;
    const settledSettlements = settlements.filter((s) => s.status === "settled");
    const pendingSettlements = settlements.filter((s) => s.status === "quoted");

    const totalSendVolume = settlements.reduce((sum, s) => sum + s.sendAmount, 0);
    const totalFeesXrp = settlements.reduce((sum, s) => sum + s.feeXrp, 0);
    const totalFeesUsd = settlements.reduce((sum, s) => sum + s.feeUsd, 0);

    const xrpSettlements = settlements.filter((s) => s.bridgeAsset === "XRP");
    const rlusdSettlements = settlements.filter((s) => s.bridgeAsset === "RLUSD");

    const xrpVolume = xrpSettlements.reduce((sum, s) => sum + s.sendAmount, 0);
    const rlusdVolume = rlusdSettlements.reduce((sum, s) => sum + s.sendAmount, 0);

    // Average settlement time
    let avgSettlementTimeMs: number | null = null;
    const settledWithHash = settlements.filter(
      (s) => s.status === "settled" && s.rippleTxHash !== null
    );
    if (settledWithHash.length > 0) {
      // Use createdAt to estimate (since we don't store settlement completion time separately)
      // Simulate avg based on corridor types
      const avgDelay = settledWithHash.reduce((sum) => {
        const corridor = settledWithHash[0]?.corridor || "";
        const base = RIPPLE_STRONG_CORRIDORS.has(corridor) ? 2000 : 3000;
        return sum + base + Math.random() * 1000;
      }, 0) / settledWithHash.length;
      avgSettlementTimeMs = avgDelay;
    }

    // Corridor breakdown
    const corridorMap: Record<string, { count: number; volume: number; xrp: number; rlusd: number }> = {};
    for (const s of settlements) {
      if (!corridorMap[s.corridor]) {
        corridorMap[s.corridor] = { count: 0, volume: 0, xrp: 0, rlusd: 0 };
      }
      corridorMap[s.corridor].count += 1;
      corridorMap[s.corridor].volume += s.sendAmount;
      if (s.bridgeAsset === "XRP") corridorMap[s.corridor].xrp += 1;
      else corridorMap[s.corridor].rlusd += 1;
    }

    // Liquidity provider breakdown
    const providerMap: Record<string, { count: number; volume: number }> = {};
    for (const s of settlements) {
      const provider = s.liquidityProvider || "Unknown";
      if (!providerMap[provider]) providerMap[provider] = { count: 0, volume: 0 };
      providerMap[provider].count += 1;
      providerMap[provider].volume += s.sendAmount;
    }

    return NextResponse.json({
      summary: {
        totalSettlements,
        settled: settledSettlements.length,
        pending: pendingSettlements.length,
        totalSendVolume,
        totalFeesUsd: Math.round(totalFeesUsd * 1000000) / 1000000,
        totalFeesXrp: Math.round(totalFeesXrp * 1000000) / 1000000,
        avgSettlementTimeMs: avgSettlementTimeMs
          ? `${(avgSettlementTimeMs / 1000).toFixed(2)}s`
          : null,
        assetSplit: {
          xrp: {
            count: xrpSettlements.length,
            volume: xrpVolume,
            percentage: totalSettlements > 0
              ? `${((xrpSettlements.length / totalSettlements) * 100).toFixed(1)}%`
              : "0%",
          },
          rlusd: {
            count: rlusdSettlements.length,
            volume: rlusdVolume,
            percentage: totalSettlements > 0
              ? `${((rlusdSettlements.length / totalSettlements) * 100).toFixed(1)}%`
              : "0%",
          },
        },
        topCorridors: Object.entries(corridorMap)
          .sort((a, b) => b[1].volume - a[1].volume)
          .slice(0, 10)
          .map(([corridor, data]) => ({ corridor, ...data })),
        liquidityProviders: Object.entries(providerMap)
          .sort((a, b) => b[1].volume - a[1].volume)
          .map(([provider, data]) => ({ provider, ...data })),
      },
      settlements,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to retrieve Ripple settlements: ${message}` },
      { status: 500 }
    );
  }
}