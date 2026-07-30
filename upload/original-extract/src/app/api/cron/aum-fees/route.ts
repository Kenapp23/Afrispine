import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateAumFee, AUM_FEE_QUARTERLY_PCT } from '@/lib/wealth-fees';
import { isConfigured, getPortfolio } from '@/lib/mystocks';

// GET /api/cron/aum-fees
// Scheduled: 1st of January, April, July, October at 01:00 UTC
// Rate: 0.125% of total portfolio value per quarter (0.5%/year)
export async function GET(req: NextRequest) {
  try {
    // Simple cron auth check — in production, use a cron secret header
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db.investmentAccount.findMany({
      where: { status: 'active' },
    });

    if (accounts.length === 0) {
      return NextResponse.json({ message: 'No active investment accounts', charged: 0 });
    }

    // Determine quarter boundaries
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);

    let charged = 0;
    let totalFees = 0;

    for (const account of accounts) {
      let aumValueUsd = account.totalValueUsd || 0;

      // If mystocks is configured, get live portfolio value
      if (isConfigured() && account.mystocksAccountId) {
        try {
          const portfolio = await getPortfolio(account.mystocksAccountId);
          aumValueUsd = portfolio.totalValueUsd || aumValueUsd;
          // Sync local totals
          await db.investmentAccount.update({
            where: { id: account.id },
            data: {
              totalValueUsd: aumValueUsd,
              cashBalanceUsd: portfolio.cashBalanceUsd || 0,
            },
          });
        } catch (e) {
          console.error('[aum-fees] Failed to fetch portfolio for', account.id, e);
        }
      }

      if (aumValueUsd <= 0) continue;

      // Check if already charged this quarter
      const existingCharge = await db.aumFeeCharge.findFirst({
        where: {
          investmentAccountId: account.id,
          periodStart: { gte: quarterStart },
        },
      });

      if (existingCharge) {
        console.log(`[aum-fees] Skipping ${account.id} — already charged this quarter`);
        continue;
      }

      const feeAmount = calculateAumFee(aumValueUsd);

      // Record the fee
      await db.aumFeeCharge.create({
        data: {
          senderId: account.senderId,
          investmentAccountId: account.id,
          periodStart: quarterStart,
          periodEnd: quarterEnd,
          aumValueUsd,
          feeRatePct: AUM_FEE_QUARTERLY_PCT * 100,
          feeAmountUsd: feeAmount,
          chargedAt: new Date(),
          status: 'charged',
        },
      });

      // Deduct from cash balance (simplified — in production, might need to liquidate)
      const newCashBalance = Math.max(0, (account.cashBalanceUsd || 0) - feeAmount);
      await db.investmentAccount.update({
        where: { id: account.id },
        data: { cashBalanceUsd: newCashBalance },
      });

      charged++;
      totalFees += feeAmount;
      console.log(`[aum-fees] Charged $${feeAmount.toFixed(2)} for ${account.senderId} (AUM: $${aumValueUsd.toFixed(2)})`);
    }

    return NextResponse.json({
      message: 'AUM fee calculation complete',
      accountsProcessed: accounts.length,
      accountsCharged: charged,
      totalFeesUsd: Math.round(totalFees * 100) / 100,
      quarter: `${quarterStart.toISOString().split('T')[0]} to ${quarterEnd.toISOString().split('T')[0]}`,
    });
  } catch (e: any) {
    console.error('[aum-fees] Error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}