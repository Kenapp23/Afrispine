import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── GET: List All Wallets ───────────────────────────────────────────────

export async function GET() {
  try {
    const wallets = await db.wallet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        revenueRecords: {
          select: { id: true, amount: true, currency: true, status: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { revenueRecords: true, splitAllocations: true },
        },
      },
    });

    // Summary calculations
    let totalBalance = 0;
    const byCurrency: Record<string, number> = {};
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const w of wallets) {
      totalBalance += w.balance;
      totalInflow += w.totalInflow;
      totalOutflow += w.totalOutflow;
      byCurrency[w.currency] = (byCurrency[w.currency] || 0) + w.balance;
    }

    return NextResponse.json({
      wallets: wallets.map((w) => ({
        id: w.id,
        label: w.label,
        type: w.type,
        currency: w.currency,
        provider: w.provider,
        accountRef: w.accountRef,
        isActive: w.isActive,
        balance: w.balance,
        totalInflow: w.totalInflow,
        totalOutflow: w.totalOutflow,
        recentRevenueCount: w._count.revenueRecords,
        splitAllocationCount: w._count.splitAllocations,
        recentRevenue: w.revenueRecords,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
      summary: {
        totalWallets: wallets.length,
        totalBalance: Math.round(totalBalance * 100) / 100,
        totalInflow: Math.round(totalInflow * 100) / 100,
        totalOutflow: Math.round(totalOutflow * 100) / 100,
        byCurrency,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Create New Wallet ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, type, currency, provider, accountRef } = body;

    if (!label || label.trim().length < 2) {
      return NextResponse.json({ error: "Wallet label is required (minimum 2 characters)" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: "Wallet type is required (e.g. operational, settlement, escrow)" }, { status: 400 });
    }
    if (!currency || currency.length !== 3) {
      return NextResponse.json({ error: "Currency must be a 3-letter code" }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider is required (e.g. bank, stablecoin, mno)" }, { status: 400 });
    }
    if (!accountRef) {
      return NextResponse.json({ error: "accountRef is required" }, { status: 400 });
    }

    const wallet = await db.wallet.create({
      data: {
        label: label.trim(),
        type,
        currency: currency.toUpperCase(),
        provider,
        accountRef,
      },
    });

    return NextResponse.json(
      {
        id: wallet.id,
        label: wallet.label,
        type: wallet.type,
        currency: wallet.currency,
        provider: wallet.provider,
        accountRef: wallet.accountRef,
        isActive: wallet.isActive,
        balance: wallet.balance,
        totalInflow: wallet.totalInflow,
        totalOutflow: wallet.totalOutflow,
        createdAt: wallet.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PUT: Update Wallet Balance (Simulate Inflow/Outflow) ────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { walletId, amount, direction } = body;

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (!direction || (direction !== "inflow" && direction !== "outflow")) {
      return NextResponse.json({ error: 'direction must be "inflow" or "outflow"' }, { status: 400 });
    }

    // Verify wallet exists
    const existing = await db.wallet.findUnique({ where: { id: walletId } });
    if (!existing) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    // Build update data based on direction
    const updateData =
      direction === "inflow"
        ? {
            balance: { increment: roundedAmount },
            totalInflow: { increment: roundedAmount },
          }
        : {
            balance: { decrement: roundedAmount },
            totalOutflow: { increment: roundedAmount },
          };

    const wallet = await db.wallet.update({
      where: { id: walletId },
      data: updateData,
    });

    return NextResponse.json({
      id: wallet.id,
      label: wallet.label,
      type: wallet.type,
      currency: wallet.currency,
      balance: wallet.balance,
      totalInflow: wallet.totalInflow,
      totalOutflow: wallet.totalOutflow,
      lastMovement: {
        direction,
        amount: roundedAmount,
        timestamp: new Date().toISOString(),
      },
      updatedAt: wallet.updatedAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}