import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Revenue Type Labels ─────────────────────────────────────────────────

const REVENUE_TYPE_LABELS: Record<string, string> = {
  fee: "Transaction Fee",
  api_licence: "API Licence",
  ai_premium: "Smart Routing Premium",
  data_insight: "Data Insight",
  embedded_commission: "Embedded Finance Commission",
};

// ── GET: Revenue Dashboard Data ─────────────────────────────────────────

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ── Revenue Records Aggregation ──
    const revenueRecords = await db.revenueRecord.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        revenueType: true,
        amount: true,
        currency: true,
        createdAt: true,
        status: true,
      },
    });

    // Total revenue (all time)
    const allRevenueRecords = await db.revenueRecord.findMany({
      select: { revenueType: true, amount: true, currency: true },
    });

    // Group by type
    const byType: Record<string, number> = {};
    for (const r of allRevenueRecords) {
      const label = REVENUE_TYPE_LABELS[r.revenueType] || r.revenueType;
      byType[label] = (byType[label] || 0) + r.amount;
    }

    // Total revenue
    const totalRevenue = allRevenueRecords.reduce((sum, r) => sum + r.amount, 0);

    // Today revenue
    const todayRevenue = revenueRecords
      .filter((r) => r.createdAt >= todayStart)
      .reduce((sum, r) => sum + r.amount, 0);

    // Yesterday revenue (for growth calc)
    const yesterdayRevenue = revenueRecords
      .filter((r) => r.createdAt >= yesterdayStart && r.createdAt < todayStart)
      .reduce((sum, r) => sum + r.amount, 0);

    // Growth rate
    const growthRate = yesterdayRevenue > 0
      ? parseFloat(((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1))
      : todayRevenue > 0 ? 100 : 0;

    // Fee revenue
    const feeRevenue = allRevenueRecords
      .filter((r) => r.revenueType === "fee")
      .reduce((sum, r) => sum + r.amount, 0);

    // By type breakdown (named fields)
    const apiLicenceRevenue = allRevenueRecords
      .filter((r) => r.revenueType === "api_licence")
      .reduce((sum, r) => sum + r.amount, 0);
    const aiPremiumRevenue = allRevenueRecords
      .filter((r) => r.revenueType === "ai_premium")
      .reduce((sum, r) => sum + r.amount, 0);
    const dataInsightRevenue = allRevenueRecords
      .filter((r) => r.revenueType === "data_insight")
      .reduce((sum, r) => sum + r.amount, 0);
    const embeddedCommissionRevenue = allRevenueRecords
      .filter((r) => r.revenueType === "embedded_commission")
      .reduce((sum, r) => sum + r.amount, 0);

    // Daily breakdown (last 7 days)
    const dailyBreakdown: Array<{
      date: string;
      revenue: number;
      feeRevenue: number;
      otherRevenue: number;
      txCount: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dateStr = dayStart.toISOString().split("T")[0];

      const dayRecords = revenueRecords.filter(
        (r) => r.createdAt >= dayStart && r.createdAt < dayEnd
      );
      const dayRevenue = dayRecords.reduce((sum, r) => sum + r.amount, 0);
      const dayFee = dayRecords
        .filter((r) => r.revenueType === "fee")
        .reduce((sum, r) => sum + r.amount, 0);

      dailyBreakdown.push({
        date: dateStr,
        revenue: Math.round(dayRevenue * 100) / 100,
        feeRevenue: Math.round(dayFee * 100) / 100,
        otherRevenue: Math.round((dayRevenue - dayFee) * 100) / 100,
        txCount: new Set(dayRecords.map((r) => r.transactionId)).size,
      });
    }

    // By currency breakdown
    const byCurrency: Record<string, number> = {};
    for (const r of allRevenueRecords) {
      byCurrency[r.currency] = (byCurrency[r.currency] || 0) + r.amount;
    }

    // ── Transaction Aggregation ──
    const allTransactions = await db.transaction.findMany({
      select: {
        sendAmount: true,
        fee: true,
        status: true,
        sendCurrency: true,
      },
    });

    const totalVolume = allTransactions
      .filter((t) => t.status !== "failed")
      .reduce((sum, t) => sum + t.sendAmount, 0);

    const totalFeesCollected = allTransactions
      .filter((t) => t.status !== "failed")
      .reduce((sum, t) => sum + t.fee, 0);

    const successfulTx = allTransactions.filter(
      (t) => t.status !== "failed" && t.sendAmount > 0
    );
    const avgFeePct =
      successfulTx.length > 0
        ? parseFloat(
            (
              successfulTx.reduce((sum, t) => sum + (t.fee / t.sendAmount) * 100, 0) /
              successfulTx.length
            ).toFixed(2)
          )
        : 0;

    const txCount = allTransactions.length;

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        yesterdayRevenue: Math.round(yesterdayRevenue * 100) / 100,
        growthRate,
        feeRevenue: Math.round(feeRevenue * 100) / 100,
        apiLicenceRevenue: Math.round(apiLicenceRevenue * 100) / 100,
        aiPremiumRevenue: Math.round(aiPremiumRevenue * 100) / 100,
        dataInsightRevenue: Math.round(dataInsightRevenue * 100) / 100,
        embeddedCommissionRevenue: Math.round(embeddedCommissionRevenue * 100) / 100,
      },
      dailyBreakdown,
      byType,
      byCurrency,
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalFeesCollected: Math.round(totalFeesCollected * 100) / 100,
      avgFeePct,
      txCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Create Revenue Record (Admin Testing) ─────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { revenueType, amount, currency, transactionId, settledTo } = body;

    // Validate
    if (!revenueType || !REVENUE_TYPE_LABELS[revenueType]) {
      return NextResponse.json(
        {
          error: `Invalid revenueType. Must be one of: ${Object.keys(REVENUE_TYPE_LABELS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    if (!currency || currency.length !== 3) {
      return NextResponse.json({ error: "Currency must be a 3-letter code" }, { status: 400 });
    }

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    // Verify transaction exists
    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const record = await db.revenueRecord.create({
      data: {
        transactionId,
        revenueType,
        amount: Math.round(amount * 100) / 100,
        currency: currency.toUpperCase(),
        settledTo: settledTo || "operational_pool",
        status: "collected",
      },
    });

    return NextResponse.json(
      {
        id: record.id,
        transactionId: record.transactionId,
        revenueType: record.revenueType,
        revenueLabel: REVENUE_TYPE_LABELS[record.revenueType],
        amount: record.amount,
        currency: record.currency,
        settledTo: record.settledTo,
        status: record.status,
        collectedAt: record.collectedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}