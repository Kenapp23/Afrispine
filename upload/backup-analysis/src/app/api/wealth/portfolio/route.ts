import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { getPortfolio as getMystocksPortfolio, isConfigured as mystocksConfigured } from '@/lib/mystocks';
import { getStockByTicker } from '@/lib/wealth-data';

export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const account = await db.investmentAccount.findUnique({
      where: { senderId: sender.id },
    });

    if (!account) {
      return NextResponse.json({ hasAccount: false, portfolio: null });
    }

    // Fetch pending orders
    const pendingOrders = await db.investmentOrder.findMany({
      where: { investmentAccountId: account.id, status: { in: ['pending', 'submitted'] } },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch dividend history
    const dividends = await db.dividendPayment.findMany({
      where: { investmentAccountId: account.id },
      orderBy: { createdAt: 'desc' },
    });

    // Build portfolio data
    let portfolio: any = null;

    if (mystocksConfigured() && account.mystocksAccountId) {
      try {
        const msPortfolio = await getMystocksPortfolio(account.mystocksAccountId);
        portfolio = {
          totalValueUsd: msPortfolio.totalValueUsd ?? account.totalValueUsd,
          cashBalanceUsd: msPortfolio.cashBalanceUsd ?? 0,
          holdings: (msPortfolio.holdings ?? []).map((h: any) => ({
            ticker: h.symbol || h.ticker,
            exchange: h.exchange || '',
            companyName: h.companyName || '',
            shares: h.quantity ?? h.shares ?? 0,
            avgCostUsd: h.avgCostUsd ?? 0,
            currentPriceUsd: h.currentPriceUsd ?? 0,
            marketValueUsd: h.marketValueUsd ?? 0,
            gainLossUsd: h.gainLossUsd ?? 0,
            gainLossPct: h.gainLossPct ?? 0,
          })),
          source: 'mystocks',
        };
      } catch (e: any) {
        console.error('[portfolio] mystocks getPortfolio failed, falling back to local:', e.message);
        portfolio = await buildLocalPortfolio(account.id);
      }
    } else {
      portfolio = await buildLocalPortfolio(account.id);
    }

    return NextResponse.json({
      hasAccount: true,
      account: {
        id: account.id,
        mystocksAccountId: account.mystocksAccountId,
        status: account.status,
        totalInvestedUsd: account.totalInvestedUsd,
        totalValueUsd: account.totalValueUsd,
        totalGainLossUsd: account.totalGainLossUsd,
        dividendsEarnedUsd: account.dividendsEarnedUsd,
        autoReinvestDividends: account.autoReinvestDividends,
        createdAt: account.createdAt,
      },
      portfolio,
      dividends,
      pendingOrders,
    });
  } catch (e: any) {
    console.error('[portfolio]', e);
    return NextResponse.json({ error: e.message || 'Failed to load portfolio' }, { status: 500 });
  }
}

async function buildLocalPortfolio(accountId: string) {
  const filledOrders = await db.investmentOrder.findMany({
    where: { investmentAccountId: accountId, status: 'filled', orderDirection: 'BUY' },
    orderBy: { filledAt: 'asc' },
  });

  // Aggregate holdings by ticker+exchange
  const holdingsMap = new Map<string, any>();
  for (const order of filledOrders) {
    const key = `${order.ticker}|${order.exchange}`;
    const existing = holdingsMap.get(key) || {
      ticker: order.ticker,
      exchange: order.exchange,
      companyName: order.companyName,
      shares: 0,
      totalCostUsd: 0,
    };
    existing.shares += order.sharesFilled;
    existing.totalCostUsd += (order.fillPriceUsd ?? 0) * order.sharesFilled;
    holdingsMap.set(key, existing);
  }

  // Enrich with live prices and compute market values
  const holdings = Array.from(holdingsMap.values()).map((h) => {
    const live = getStockByTicker(h.ticker);
    const avgCostUsd = h.shares > 0 ? h.totalCostUsd / h.shares : 0;
    const currentPriceUsd = live?.price ?? avgCostUsd;
    const marketValueUsd = h.shares * currentPriceUsd;
    const gainLossUsd = marketValueUsd - h.totalCostUsd;
    const gainLossPct = h.totalCostUsd > 0 ? (gainLossUsd / h.totalCostUsd) * 100 : 0;

    return {
      ticker: h.ticker,
      exchange: h.exchange,
      companyName: h.companyName,
      shares: h.shares,
      avgCostUsd,
      currentPriceUsd,
      marketValueUsd,
      gainLossUsd,
      gainLossPct,
    };
  });

  const totalValueUsd = holdings.reduce((sum, h) => sum + h.marketValueUsd, 0);

  return {
    totalValueUsd,
    cashBalanceUsd: 0,
    holdings,
    source: 'local',
  };
}