/**
 * Referral Stats API
 *
 * GET /api/content/referral/stats?phone=254XXX
 *
 * Returns referral earnings breakdown for a given phone number:
 * - Total earnings (sum of all ReferralReward.amountKes)
 * - Total paid out
 * - Total unpaid
 * - Number of referrals
 * - Recent referral rewards list
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone || !/^254\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Valid phone number required (format: 254XXXXXXXXX)' },
        { status: 400 },
      );
    }

    if (!dbReady) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 },
      );
    }

    // Fetch all rewards for this referrer, ordered by newest first
    const rewards = await db.referralReward.findMany({
      where: { referrerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: {
        ticket: {
          select: {
            amountPaid: true,
            purchasedAt: true,
            video: {
              select: {
                title: true,
                creator: {
                  select: { stageName: true },
                },
              },
            },
          },
        },
      },
    });

    // Calculate aggregates
    const totalEarnings = rewards.reduce((sum, r) => sum + r.amountKes, 0);
    const totalPaid = rewards
      .filter((r) => r.paidOut)
      .reduce((sum, r) => sum + r.amountKes, 0);
    const totalUnpaid = totalEarnings - totalPaid;
    const totalReferrals = rewards.length;

    // Recent rewards (last 20)
    const recentRewards = rewards.slice(0, 20).map((r) => ({
      id: r.id,
      videoId: r.videoId,
      videoTitle: r.ticket?.video?.title ?? null,
      creatorName: r.ticket?.video?.creator?.stageName ?? null,
      amountKes: r.amountKes,
      commissionPct: r.commissionPct,
      paidOut: r.paidOut,
      paidAt: r.paidAt,
      purchasedAt: r.ticket?.purchasedAt ?? null,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      phone,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalUnpaid: Math.round(totalUnpaid * 100) / 100,
      totalReferrals,
      recentRewards,
    });
  } catch (err) {
    console.error('[referral-stats] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
