/**
 * Growth Leaderboard API
 *
 * GET /api/growth/leaderboard?window=week|month|all
 *
 * Public endpoint — no auth required.
 * Returns top 20 referrers by successful referral count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json(
        { leaderboard: [] },
        { status: 200 },
      );
    }

    const { searchParams } = new URL(req.url);
    const window = searchParams.get('window') || 'week';

    // Build date filter
    let dateFilter: Prisma.DateTimeNullableFilter | undefined;
    if (window === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = { gte: d };
    } else if (window === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      dateFilter = { gte: d };
    }
    // window === 'all' → no date filter

    // Group successful referrals by referrerId
    const referralGroups = await db.referral.groupBy({
      by: ['referrerId'],
      where: {
        isClaimed: true,
        referrerId: { not: null },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    if (referralGroups.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const referrerIds = referralGroups.map((g) => g.referrerId!);

    // Fetch sender profiles for these referrers
    const senders = await db.sender.findMany({
      where: { id: { in: referrerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        referralCode: true,
      },
    });

    // Build a map: senderId → sender
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    // Collect phone numbers to look up ReferralReward earnings
    const phones = senders
      .map((s) => s.phone)
      .filter((p): p is string => !!p);

    // Sum earnings per phone from ReferralReward
    let rewardSums: Map<string, number> = new Map();
    if (phones.length > 0) {
      const rewardGroups = await db.referralReward.groupBy({
        by: ['referrerPhone'],
        where: {
          referrerPhone: { in: phones },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amountKes: true },
      });
      rewardSums = new Map(
        rewardGroups.map((g) => [g.referrerPhone, g._sum.amountKes ?? 0]),
      );
    }

    // Build leaderboard entries
    const leaderboard = referralGroups.map((group, idx) => {
      const sender = senderMap.get(group.referrerId!);
      const earnings = sender?.phone
        ? rewardSums.get(sender.phone) ?? 0
        : 0;

      // Build display name
      const firstName = sender?.firstName ?? '';
      const lastName = sender?.lastName ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const displayName = fullName || sender?.email || 'Anonymous';

      return {
        rank: idx + 1,
        name: displayName.length > 24 ? displayName.slice(0, 22) + '…' : displayName,
        referralCount: group._count.id,
        totalEarningsKes: Math.round(earnings * 100) / 100,
        referralCode: sender?.referralCode ?? null,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error('[growth/leaderboard] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
