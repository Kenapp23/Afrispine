import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── GET: List All Split Rules ───────────────────────────────────────────

export async function GET() {
  try {
    const rules = await db.splitRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        allocations: {
          include: {
            wallet: {
              select: { id: true, label: true, type: true, currency: true, balance: true },
            },
          },
          orderBy: { priority: "asc" },
        },
      },
    });

    return NextResponse.json({
      rules: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        isActive: rule.isActive,
        totalAllocationPct: rule.allocations.reduce((sum, a) => sum + a.percentage, 0),
        allocationCount: rule.allocations.length,
        allocations: rule.allocations.map((a) => ({
          id: a.id,
          walletId: a.walletId,
          walletLabel: a.wallet.label,
          walletType: a.wallet.type,
          walletCurrency: a.wallet.currency,
          walletBalance: a.wallet.balance,
          percentage: a.percentage,
          label: a.label,
          priority: a.priority,
        })),
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Create Split Rule OR Execute Split ────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── Execute Split ──
    if (action === "execute_split") {
      const { ruleId, amount } = body;

      if (!ruleId) {
        return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
      }
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      }

      const rule = await db.splitRule.findUnique({
        where: { id: ruleId, isActive: true },
        include: { allocations: { include: { wallet: true } } },
      });

      if (!rule) {
        return NextResponse.json({ error: "Split rule not found or inactive" }, { status: 404 });
      }

      const roundedAmount = Math.round(amount * 100) / 100;
      const results: Array<{
        walletId: string;
        walletLabel: string;
        percentage: number;
        amount: number;
        currency: string;
        newBalance: number;
      }> = [];

      // Execute each allocation in a sequential loop
      for (const alloc of rule.allocations) {
        const allocAmount = Math.round(roundedAmount * (alloc.percentage / 100) * 100) / 100;

        const updatedWallet = await db.wallet.update({
          where: { id: alloc.walletId },
          data: {
            balance: { increment: allocAmount },
            totalInflow: { increment: allocAmount },
          },
        });

        results.push({
          walletId: alloc.walletId,
          walletLabel: alloc.wallet.label,
          percentage: alloc.percentage,
          amount: allocAmount,
          currency: alloc.wallet.currency,
          newBalance: updatedWallet.balance,
        });
      }

      return NextResponse.json({
        ruleId,
        ruleName: rule.name,
        totalAmount: roundedAmount,
        allocations: results,
        executedAt: new Date().toISOString(),
      });
    }

    // ── Create Split Rule ──
    const { name, description, allocations } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Rule name is required (minimum 2 characters)" }, { status: 400 });
    }

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json({ error: "At least one allocation is required" }, { status: 400 });
    }

    // Validate allocations
    for (const alloc of allocations) {
      if (!alloc.walletId) {
        return NextResponse.json({ error: "Each allocation must have a walletId" }, { status: 400 });
      }
      if (!alloc.percentage || alloc.percentage <= 0) {
        return NextResponse.json({ error: "Each allocation percentage must be greater than 0" }, { status: 400 });
      }
      if (!alloc.label || alloc.label.trim().length < 1) {
        return NextResponse.json({ error: "Each allocation must have a label" }, { status: 400 });
      }
    }

    // Check percentages sum to 100%
    const totalPct = allocations.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return NextResponse.json(
        { error: `Allocations must sum to 100%. Current sum: ${totalPct.toFixed(2)}%` },
        { status: 400 }
      );
    }

    // Verify all wallets exist
    const walletIds = allocations.map((a: { walletId: string }) => a.walletId);
    const walletCount = await db.wallet.count({
      where: { id: { in: walletIds } },
    });
    if (walletCount !== walletIds.length) {
      return NextResponse.json(
        { error: "One or more wallet IDs not found" },
        { status: 400 }
      );
    }

    // Create the rule with allocations
    const rule = await db.splitRule.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        allocations: {
          create: allocations.map((a: { walletId: string; percentage: number; label: string; priority?: number }, idx: number) => ({
            walletId: a.walletId,
            percentage: a.percentage,
            label: a.label.trim(),
            priority: a.priority ?? idx,
          })),
        },
      },
      include: {
        allocations: {
          include: {
            wallet: {
              select: { id: true, label: true, type: true, currency: true },
            },
          },
          orderBy: { priority: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        isActive: rule.isActive,
        allocations: rule.allocations.map((a) => ({
          id: a.id,
          walletId: a.walletId,
          walletLabel: a.wallet.label,
          walletType: a.wallet.type,
          walletCurrency: a.wallet.currency,
          percentage: a.percentage,
          label: a.label,
          priority: a.priority,
        })),
        createdAt: rule.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}