import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── FX Marketplace ─────────────────────────────────────────────────
// Simulated order book for FX matching between participants

const CURRENCY_PAIRS: Record<string, { base: string; quote: string; midRate: number; spread: number }> = {
  "USD/KES": { base: "USD", quote: "KES", midRate: 153.5, spread: 0.4 },
  "USD/NGN": { base: "USD", quote: "NGN", midRate: 1580, spread: 2.5 },
  "USD/GHS": { base: "USD", quote: "GHS", midRate: 15.1, spread: 0.05 },
  "USD/ETB": { base: "USD", quote: "ETB", midRate: 57.3, spread: 0.3 },
  "GBP/KES": { base: "GBP", quote: "KES", midRate: 194.2, spread: 0.5 },
  "EUR/XOF": { base: "EUR", quote: "XOF", midRate: 655.96, spread: 1.0 },
  "AED/KES": { base: "AED", quote: "KES", midRate: 41.8, spread: 0.15 },
  "CNY/NGN": { base: "CNY", quote: "NGN", midRate: 218.5, spread: 1.5 },
};

const SIMULATED_PROVIDERS = [
  { name: "Circle USDC Pool", type: "stablecoin_lp" },
  { name: "KCB Bank", type: "bank" },
  { name: "Access Bank NG", type: "bank" },
  { name: "RippleNet ODL", type: "ripple" },
  { name: "Flutterwave FX", type: "fintech" },
  { name: "Standard Bank ZA", type: "bank" },
  { name: "Ecobank", type: "bank" },
  { name: "RLUSD Liquidity", type: "stablecoin_lp" },
];

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "FX-";
  for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

// GET: View order book and recent matches
export async function GET() {
  try {
    const orders = await db.fxOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Build simulated order book for top pairs
    const orderBook = Object.entries(CURRENCY_PAIRS).slice(0, 5).map(([pair, config]) => {
      const bid = config.midRate - config.spread / 2;
      const ask = config.midRate + config.spread / 2;
      const pairOrders = orders.filter(o => o.baseCurrency === config.base && o.quoteCurrency === config.quote);

      return {
        pair,
        bid: Math.round(bid * 100) / 100,
        ask: Math.round(ask * 100) / 100,
        mid: config.midRate,
        spread: config.spread,
        openOrders: pairOrders.filter(o => o.status === "open").length,
        filled24h: pairOrders.filter(o => o.status === "filled").length,
        volume24h: pairOrders.reduce((s, o) => s + (o.amount || 0), 0),
      };
    });

    // Summary stats
    const totalOrders = orders.length;
    const filledOrders = orders.filter(o => o.status === "filled");
    const naturalHedgeCount = orders.filter(o => o.matchType === "natural_hedge").length;

    return NextResponse.json({
      orderBook,
      recentOrders: orders.slice(0, 15),
      summary: {
        totalOrders,
        filledCount: filledOrders.length,
        fillRate: totalOrders > 0 ? Math.round(filledOrders.length / totalOrders * 100) : 0,
        naturalHedgeRate: filledOrders.length > 0 ? Math.round(naturalHedgeCount / filledOrders.length * 100) : 0,
        totalVolume: orders.reduce((s, o) => s + (o.amount || 0), 0),
        avgSavingsBps: 18,
      },
    });
  } catch (error) {
    console.error("[FX Marketplace] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch FX marketplace data" }, { status: 500 });
  }
}

// POST: Place or match FX orders
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, baseCurrency, quoteCurrency, side, amount, requestedRate } = body;

    if (action === "place_order") {
      // Place a new FX order
      const pair = `${baseCurrency}/${quoteCurrency}`;
      const config = CURRENCY_PAIRS[pair];
      if (!config) {
        return NextResponse.json({ error: `Unsupported pair: ${pair}. Supported: ${Object.keys(CURRENCY_PAIRS).join(", ")}` }, { status: 400 });
      }

      // Simulate matching
      const isFilled = Math.random() > 0.4; // 60% fill rate
      const filledRate = config.midRate + (side === "buy" ? config.spread * 0.1 : -config.spread * 0.1);
      const provider = SIMULATED_PROVIDERS[Math.floor(Math.random() * SIMULATED_PROVIDERS.length)];

      const order = await db.fxOrder.create({
        data: {
          orderId: generateOrderId(),
          side,
          baseCurrency,
          quoteCurrency,
          amount,
          requestedRate: requestedRate || config.midRate,
          filledRate: isFilled ? Math.round(filledRate * 100) / 100 : null,
          filledAmount: isFilled ? Math.round(amount * filledRate * 100) / 100 : null,
          status: isFilled ? "filled" : "open",
          matchType: isFilled ? (Math.random() > 0.5 ? "natural_hedge" : "lp_fill") : null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
        },
      });

      return NextResponse.json({
        success: true,
        order: {
          orderId: order.orderId,
          side: order.side,
          pair: `${baseCurrency}/${quoteCurrency}`,
          amount: order.amount,
          requestedRate: order.requestedRate,
          status: order.status,
          filledRate: order.filledRate,
          filledAmount: order.filledAmount,
          matchType: order.matchType,
          counterparty: isFilled ? provider.name : null,
          expiresAt: order.expiresAt,
        },
      });
    }

    if (action === "simulate_market") {
      // Simulate market activity — create a batch of orders
      const batchCount = 8;
      const created = [];
      for (let i = 0; i < batchCount; i++) {
        const pairEntry = Object.entries(CURRENCY_PAIRS)[Math.floor(Math.random() * Object.keys(CURRENCY_PAIRS).length)];
        const [pair, config] = pairEntry;
        const [base, quote] = [config.base, config.quote];
        const side = Math.random() > 0.5 ? "buy" : "sell";
        const amount = Math.round((500 + Math.random() * 10000) * 100) / 100;
        const isFilled = Math.random() > 0.35;

        const order = await db.fxOrder.create({
          data: {
            orderId: generateOrderId(),
            side,
            baseCurrency: base,
            quoteCurrency: quote,
            amount,
            requestedRate: config.midRate,
            filledRate: isFilled ? Math.round((config.midRate + (Math.random() - 0.5) * config.spread) * 100) / 100 : null,
            filledAmount: isFilled ? Math.round(amount * (config.midRate + (Math.random() - 0.5) * config.spread) * 100) / 100 : null,
            status: isFilled ? "filled" : "open",
            matchType: isFilled ? (Math.random() > 0.5 ? "natural_hedge" : "lp_fill") : null,
          },
        });
        created.push(order.orderId);
      }

      return NextResponse.json({
        success: true,
        message: `Created ${batchCount} simulated FX orders`,
        orderIds: created,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'place_order' or 'simulate_market'." }, { status: 400 });
  } catch (error) {
    console.error("[FX Marketplace] POST error:", error);
    return NextResponse.json({ error: "FX marketplace operation failed" }, { status: 500 });
  }
}