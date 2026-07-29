import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const OPS_KEY = "afrispine-ops-2024";

function auth(request: Request): boolean {
  return request.headers.get("x-ops-key") === OPS_KEY;
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const [transactions, total, delivered, failed, pending, agg] = await Promise.all([
      db.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: limit,
        include: { sender: { select: { email: true, fullName: true, kycStatus: true } }, provider: { select: { name: true, type: true, successRate: true } }, revenueRecords: { select: { revenueType: true, amount: true, status: true } } } }),
      db.transaction.count({ where }),
      db.transaction.count({ where: { ...where, status: "delivered" } }),
      db.transaction.count({ where: { ...where, status: "failed" } }),
      db.transaction.count({ where: { ...where, status: { in: ["quote", "kyc_pending", "payment_pending", "processing"] } } }),
      db.transaction.aggregate({ _sum: { fee: true, sendAmount: true }, where }),
    ]);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        txRef: t.txRef, status: t.status,
        senderName: t.senderName, senderEmail: t.senderEmail, senderKycStatus: t.senderKycStatus,
        recipientName: t.recipientName, recipientPhone: t.recipientPhone, recipientCountry: t.recipientCountry,
        deliveryMethod: t.deliveryMethod,
        sendAmount: t.sendAmount, sendCurrency: t.sendCurrency,
        recvAmount: t.recvAmount, recvCurrency: t.recvCurrency,
        fxRate: t.fxRate, fee: t.fee, feePct: t.feePct,
        providerName: t.providerName, providerType: t.providerType,
        amlResult: t.amlResult, complianceScore: t.complianceScore,
        createdAt: t.createdAt, updatedAt: t.updatedAt,
        revenue: t.revenueRecords.map((r) => ({ type: r.revenueType, amount: r.amount })),
      })),
      summary: { total, delivered, failed, pending, totalFees: agg._sum.fee || 0, totalVolume: agg._sum.sendAmount || 0 },
    });
  } catch (error) {
    console.error("[MVP Ops GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch ops data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { txRef, action, note } = await request.json();
    if (!txRef || !action) return NextResponse.json({ error: "txRef and action required" }, { status: 400 });
    const tx = await db.transaction.findUnique({ where: { txRef } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    const statusMap: Record<string, string> = { retry: "processing", refund: "refunded", flag: "failed", deliver: "delivered" };
    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: `Invalid action. Use: retry, refund, flag, deliver` }, { status: 400 });
    const updated = await db.transaction.update({
      where: { txRef },
      data: { status: newStatus, complianceNotes: note ? `${tx.complianceNotes || ""}\n[OPS] ${new Date().toISOString()}: ${note}` : tx.complianceNotes },
    });
    return NextResponse.json({ txRef: updated.txRef, status: updated.status, action });
  } catch (error) {
    console.error("[MVP Ops PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
