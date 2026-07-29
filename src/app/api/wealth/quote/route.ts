import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { STOCKS, EXCHANGES, getStockByTicker, generateOrderReference } from '@/lib/wealth-data';
import { buildQuote } from '@/lib/wealth-fees';

// Exchange → local currency mapping (matches EXCHANGES data)
const EXCHANGE_CURRENCY: Record<string, string> = {
  NSE: 'KES',
  NGX: 'NGN',
  JSE: 'ZAR',
  GSE: 'GHS',
  EGX: 'EGP',
  BRVM: 'XOF',
};

// Fallback USD → local FX rates when DB has no entry
const FALLBACK_USD_LOCAL: Record<string, number> = {
  KES: 129.0,
  NGN: 1550.0,
  ZAR: 18.5,
  GHS: 15.2,
  EGP: 48.0,
  XOF: 620.0,
};

export async function POST(req: NextRequest) {
  try {
    const senderPayload = getSenderFromRequest(req);
    if (!senderPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify sender has an investment account
    const invAccount = await db.investmentAccount.findUnique({
      where: { senderId: senderPayload.id },
    });
    if (!invAccount) {
      return NextResponse.json({ error: 'Investment account not found. Please activate your account first.' }, { status: 403 });
    }

    const body = await req.json();
    const { ticker, exchange, mode, amountGbp, shares, orderType, limitPriceUsd } = body;

    if (!ticker || !exchange || !mode || !orderType) {
      return NextResponse.json({ error: 'Missing required fields: ticker, exchange, mode, orderType' }, { status: 400 });
    }

    if (mode === 'amount' && !amountGbp) {
      return NextResponse.json({ error: 'amountGbp is required for mode=amount' }, { status: 400 });
    }
    if (mode === 'shares' && !shares) {
      return NextResponse.json({ error: 'shares is required for mode=shares' }, { status: 400 });
    }
    if (orderType === 'limit' && !limitPriceUsd) {
      return NextResponse.json({ error: 'limitPriceUsd is required for limit orders' }, { status: 400 });
    }

    // Look up the stock from wealth-data
    const exchangeKey = exchange.toLowerCase();
    const stockList = STOCKS[exchangeKey];
    if (!stockList) {
      return NextResponse.json({ error: `Exchange "${exchange}" not supported` }, { status: 400 });
    }

    const stock = stockList.find((s) => s.ticker === ticker);
    if (!stock) {
      return NextResponse.json({ error: `Ticker "${ticker}" not found on ${exchange}` }, { status: 404 });
    }

    const currentPriceLocal = stock.price;
    const currencyLocal = EXCHANGE_CURRENCY[exchange] || '';
    const companyName = stock.name;

    // Fetch FX rates — GBP/USD and USD/local
    const now = new Date();

    const gbpUsdRateRow = await db.fxRate.findFirst({
      where: {
        fromCurrency: 'GBP',
        toCurrency: 'USD',
        expiresAt: { gt: now },
      },
      orderBy: { fetchedAt: 'desc' },
    });
    const fxRateGbpUsd = gbpUsdRateRow?.rate ?? 1.27;

    const usdLocalRateRow = await db.fxRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: currencyLocal,
        expiresAt: { gt: now },
      },
      orderBy: { fetchedAt: 'desc' },
    });
    const fxRateUsdLocal = usdLocalRateRow?.rate ?? FALLBACK_USD_LOCAL[currencyLocal] ?? 1;

    // Build the quote via wealth-fees library
    const quote = await buildQuote({
      amountGbp: mode === 'amount' ? amountGbp : undefined,
      shares: mode === 'shares' ? shares : undefined,
      currentPriceLocal,
      currencyLocal,
      fxRateGbpUsd,
      fxRateUsdLocal,
      orderType,
      limitPriceUsd,
    });

    // Create a pending InvestmentOrder in the database
    const reference = generateOrderReference();
    const quoteExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const order = await db.investmentOrder.create({
      data: {
        reference,
        senderId: senderPayload.id,
        investmentAccountId: invAccount.id,
        orderDirection: 'BUY',
        status: 'pending',
        ticker,
        exchange,
        companyName,
        assetType: 'equity',
        orderType,
        sharesRequested: quote.sharesRequested,
        priceLocal: currentPriceLocal,
        currencyLocal,
        limitPriceUsd: limitPriceUsd ?? null,
        amountGbp: quote.amountGbp,
        investmentAmountUsd: quote.investmentAmountUsd,
        fxRateGbpUsd: quote.fxRateGbpUsd,
        fxMarginPct: quote.fxMarginPct,
        fxFeeGbp: quote.fxFeeGbp,
        tradingFeeGbp: quote.tradingFeeGbp,
        totalChargedGbp: quote.totalChargedGbp,
        totalChargedUsd: quote.totalChargedUsd,
        quoteExpiresAt,
      },
    });

    return NextResponse.json({
      ...quote,
      orderId: order.id,
      reference: order.reference,
      quoteExpiresAt: order.quoteExpiresAt,
    });
  } catch (e: any) {
    console.error('[wealth/quote]', e);
    return NextResponse.json({ error: e.message || 'Failed to generate quote' }, { status: 500 });
  }
}