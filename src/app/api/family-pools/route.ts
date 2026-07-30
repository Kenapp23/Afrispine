import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── Family Pools & Recurring Sends ─────────────────────────────────

export async function GET() {
  try {
    const pools = await db.familyPool.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        recurringSends: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // Get all recurring sends
    const allRecurring = await db.recurringSend.findMany({
      orderBy: { nextExecution: "asc" },
      take: 20,
    });

    return NextResponse.json({
      pools: pools.map(p => {
        const members = JSON.parse(p.members || "[]").map((m: Record<string, string>) => ({
          name: m.name || "Unknown",
          relationship: m.relationship || "Member",
          initials: (m.name || "?").split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
        }));
        return {
          id: p.id,
          name: p.name,
          members,
          memberCount: members.length,
          totalSent: p.totalSent ?? 0,
          activeRecurring: p.recurringSends?.filter((r: { status: string }) => r.status === "active").length ?? 0,
          status: p.isActive ? "active" as const : "paused" as const,
        };
      }),
      recurringSends: allRecurring.map(r => ({
        id: r.id,
        recipient: r.recipientName,
        destination: r.destination,
        amount: r.sendAmount,
        frequency: r.frequency,
        nextExecution: r.nextExecution ? new Date(r.nextExecution).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "--",
        activeCount: r.activeCount ?? 0,
        status: r.status ?? "active",
      })),
      summary: {
        totalPools: pools.length,
        activeRecurringSends: allRecurring.filter(r => r.status === "active").length,
        totalPoolVolume: pools.reduce((s, p) => s + (p.totalSent ?? 0), 0),
      },
    });
  } catch (error) {
    console.error("[Family Pools] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch family pool data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create_pool") {
      const { name, creatorPhone, members } = body;
      if (!name || !creatorPhone) {
        return NextResponse.json({ error: "Pool name and creator phone required" }, { status: 400 });
      }

      const pool = await db.familyPool.create({
        data: {
          name,
          creatorPhone,
          members: JSON.stringify(members || [{ phone: creatorPhone, name: "Creator", relationship: "self", country: "US" }]),
        },
      });

      return NextResponse.json({
        success: true,
        pool: { id: pool.id, name: pool.name, creatorPhone: pool.creatorPhone },
      });
    }

    if (action === "create_recurring") {
      const { poolId, senderPhone, recipientName, recipientPhone, destination, sendAmount, sendCurrency = "USD", frequency = "monthly", creatorPhone: creatorPhoneVal } = body;

      if (!recipientName || !recipientPhone || !destination || !sendAmount) {
        return NextResponse.json({ error: "Recipient details, destination, and amount required" }, { status: 400 });
      }

      const freqMs: Record<string, number> = {
        weekly: 7 * 24 * 60 * 60 * 1000,
        biweekly: 14 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      };

      const recurring = await db.recurringSend.create({
        data: {
          poolId: poolId || null,
          senderPhone: senderPhone || creatorPhoneVal || "+1234567890",
          recipientName,
          recipientPhone,
          destination,
          sendAmount,
          sendCurrency,
          frequency,
          nextExecution: new Date(Date.now() + (freqMs[frequency] || freqMs.monthly)),
        },
      });

      return NextResponse.json({
        success: true,
        recurring: {
          id: recurring.id,
          recipientName,
          amount: sendAmount,
          frequency,
          nextExecution: recurring.nextExecution,
        },
      });
    }

    if (action === "seed_demo") {
      // Seed demo data for the dashboard
      const demoPools = [
        { name: "Okafor Family", creatorPhone: "+14155551234", members: [{ phone: "+14155551234", name: "Chioma Okafor", relationship: "self", country: "US" }, { phone: "+2348012345678", name: "Adanna Okafor", relationship: "sister", country: "NG" }, { phone: "+2348023456789", name: "Emeka Okafor", relationship: "brother", country: "NG" }] },
        { name: "Mwangi Household", creatorPhone: "+442071234567", members: [{ phone: "+442071234567", name: "Grace Mwangi", relationship: "self", country: "UK" }, { phone: "+254712345678", name: "Wangari Mwangi", relationship: "mother", country: "KE" }, { phone: "+254723456789", name: "Kamau Mwangi", relationship: "brother", country: "KE" }, { phone: "+254734567890", name: "Amina Mwangi", relationship: "cousin", country: "KE" }] },
        { name: "Diallo Family Pool", creatorPhone: "+33612345678", members: [{ phone: "+33612345678", name: "Mamadou Diallo", relationship: "self", country: "FR" }, { phone: "+221771234567", name: "Fatou Diallo", relationship: "wife", country: "SN" }, { phone: "+221782345678", name: "Ibrahima Diallo", relationship: "son", country: "SN" }] },
      ];

      const created = [];
      for (const dp of demoPools) {
        const pool = await db.familyPool.create({
          data: {
            name: dp.name,
            creatorPhone: dp.creatorPhone,
            members: JSON.stringify(dp.members),
            totalSent: Math.round(Math.random() * 5000 * 100) / 100,
          },
        });

        // Add recurring sends for each pool
        const recurrings = [
          { recipientName: dp.members[1]?.name || "Family", recipientPhone: dp.members[1]?.phone || "+234", destination: dp.members[1]?.country === "KE" ? "KE" : dp.members[1]?.country === "SN" ? "SN" : "NG", sendAmount: Math.round((100 + Math.random() * 400) * 100) / 100, frequency: "monthly" as const },
          { recipientName: dp.members[2]?.name || "Family", recipientPhone: dp.members[2]?.phone || "+234", destination: dp.members[2]?.country === "KE" ? "KE" : dp.members[2]?.country === "SN" ? "SN" : "NG", sendAmount: Math.round((50 + Math.random() * 200) * 100) / 100, frequency: "biweekly" as const },
        ];

        for (const r of recurrings) {
          await db.recurringSend.create({
            data: {
              poolId: pool.id,
              senderPhone: dp.creatorPhone,
              recipientName: r.recipientName,
              recipientPhone: r.recipientPhone,
              destination: r.destination,
              sendAmount: r.sendAmount,
              sendCurrency: "USD",
              frequency: r.frequency,
              nextExecution: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
              lastExecution: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
              activeCount: Math.floor(Math.random() * 12),
              totalSent: Math.round(r.sendAmount * (Math.floor(Math.random() * 12)) * 100) / 100,
            },
          });
        }

        created.push(pool.name);
      }

      return NextResponse.json({
        success: true,
        message: `Seeded ${created.length} family pools with recurring sends`,
        pools: created,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'create_pool', 'create_recurring', or 'seed_demo'." }, { status: 400 });
  } catch (error) {
    console.error("[Family Pools] POST error:", error);
    return NextResponse.json({ error: "Family pool operation failed" }, { status: 500 });
  }
}