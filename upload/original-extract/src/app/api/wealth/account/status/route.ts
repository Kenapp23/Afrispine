import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [account, senderRecord] = await Promise.all([
    db.investmentAccount.findUnique({
      where: { senderId: sender.id },
    }),
    db.sender.findUnique({
      where: { id: sender.id },
      select: { kycStatus: true },
    }),
  ]);

  return NextResponse.json({
    hasAccount: !!account,
    account: account
      ? {
          id: account.id,
          mystocksAccountId: account.mystocksAccountId,
          kycAssertedStatus: account.kycAssertedStatus,
          kycAssertedAt: account.kycAssertedAt,
          cashBalanceUsd: account.cashBalanceUsd,
          totalInvestedUsd: account.totalInvestedUsd,
          totalValueUsd: account.totalValueUsd,
          totalGainLossUsd: account.totalGainLossUsd,
          dividendsEarnedUsd: account.dividendsEarnedUsd,
          autoReinvestDividends: account.autoReinvestDividends,
          status: account.status,
          createdAt: account.createdAt,
        }
      : null,
    kycStatus: senderRecord?.kycStatus ?? 'pending',
  });
}