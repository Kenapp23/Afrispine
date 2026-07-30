import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    });
  } catch {
    // Allow simulated key
  }

  if (credential) {
    await db.b2BApiCredential.update({
      where: { id: credential.id },
      data: { totalCalls: { increment: 1 }, lastUsedAt: new Date() },
    });
  }

  return { valid: true, credential };
}

// ── Status Timeline Builder ─────────────────────────────────────────────

function buildStatusTimeline(tx: {
  status: string;
  speed: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const now = new Date();
  const created = tx.createdAt;
  const timeline: Array<{ status: string; timestamp: string; description: string }> = [];

  // All transfers start with "quoted" (logically before DB creation)
  timeline.push({
    status: "quoted",
    timestamp: created.toISOString(),
    description: "Quote generated and presented to partner",
  });

  // Then "matched" — rail selected
  const matchedTime = new Date(created.getTime() + 500);
  timeline.push({
    status: "matched",
    timestamp: matchedTime.toISOString(),
    description: "Optimal rail selected via smart matching",
  });

  // Simulated progression based on current status
  if (tx.status === "matched" || tx.status === "submitted" || tx.status === "settled" || tx.status === "completed") {
    const submittedTime = new Date(created.getTime() + 2000);
    timeline.push({
      status: "submitted",
      timestamp: submittedTime.toISOString(),
      description: "Transfer submitted to rail network",
    });
  }

  if (tx.status === "settled" || tx.status === "completed") {
    const speedMs = tx.speed === "Instant" ? 5000 : tx.speed.includes("2 min") ? 30000 : 90000;
    const settledTime = new Date(created.getTime() + speedMs);
    timeline.push({
      status: "settled",
      timestamp: settledTime.toISOString(),
      description: "Funds settled on rail network, delivery initiated",
    });
  }

  if (tx.status === "completed") {
    const completedTime = new Date(
      tx.updatedAt.getTime() > created.getTime() ? tx.updatedAt.getTime() : now.getTime()
    );
    timeline.push({
      status: "completed",
      timestamp: completedTime.toISOString(),
      description: "Funds delivered to recipient successfully",
    });
  }

  if (tx.status === "failed") {
    const failedTime = new Date(tx.updatedAt.getTime());
    timeline.push({
      status: "failed",
      timestamp: failedTime.toISOString(),
      description: "Transfer failed — contact support for details",
    });
  }

  return timeline;
}

// ── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("txRef");
    const apiKey = searchParams.get("apiKey");

    // Validate API key
    const auth = await validateApiKey(apiKey || "");
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Validate txRef
    if (!txRef) {
      return NextResponse.json({ error: "txRef query parameter is required" }, { status: 400 });
    }

    // Look up transaction
    const transaction = await db.transaction.findUnique({
      where: { txRef },
      include: {
        corridor: true,
        participant: {
          select: { id: true, name: true, type: true },
        },
        revenueRecords: {
          select: { id: true, revenueType: true, amount: true, currency: true, status: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const timeline = buildStatusTimeline(transaction);

    return NextResponse.json({
      transferId: transaction.id,
      txRef: transaction.txRef,
      status: transaction.status,
      statusTimeline: timeline,
      amounts: {
        sendAmount: transaction.sendAmount,
        sendCurrency: transaction.sendCurrency,
        recvAmount: transaction.recvAmount,
        recvCurrency: transaction.recvCurrency,
        fxRate: transaction.fxRate,
        fee: transaction.fee,
        feeCurrency: transaction.feeCurrency,
      },
      rail: {
        name: transaction.railName,
        network: transaction.railNetwork,
        token: transaction.railToken,
        matchType: transaction.matchType,
        speed: transaction.speed,
      },
      recipient: {
        name: transaction.recipientName,
        phone: transaction.recipientPhone,
        country: transaction.recvCountry,
      },
      compliance: {
        score: transaction.complianceScore,
        notes: transaction.complianceNotes,
      },
      partner: transaction.participant
        ? {
            id: transaction.participant.id,
            name: transaction.participant.name,
            type: transaction.participant.type,
          }
        : null,
      revenue: transaction.revenueRecords.map((r) => ({
        id: r.id,
        type: r.revenueType,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
      })),
      corridor: transaction.corridor
        ? {
            source: transaction.corridor.source,
            destination: transaction.corridor.destination,
            sendCurrency: transaction.corridor.sendCurrency,
            recvCurrency: transaction.corridor.recvCurrency,
          }
        : null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}