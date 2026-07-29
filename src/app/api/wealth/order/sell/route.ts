import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { placeOrder, isConfigured as mystocksConfigured } from '@/lib/mystocks';
import { calculateTradingFee, generateOrderReference, toMystocksTicker, EXCHANGE_CURRENCIES } from '@/lib/wealth-fees';
import { getStockByTicker } from '@/lib/wealth-data';

export async function POST(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { ticker, exchange, shares, investmentAccountId } = body;

    if (!ticker || !exchange || !shares || !investmentAccountId) {
      return NextResponse.json({ error: 'ticker, exchange, shares, and investmentAccountId are required' }, { status: 400 });
    }

    if (shares <= 0) {
      return NextResponse.json({ error: 'shares must be positive' }, { status: 400 });
    }

    // Verify account belongs to sender
    const account = await db.investmentAccount.findUnique({
      where: { id: investmentAccountId },
    });

    if (!account || account.senderId !== sender.id) {
      return NextResponse.json({ error: 'Investment account not found' }, { status: 404 });
    }

    // Look up current price to estimate proceeds
    const stock = getStockByTicker(ticker);
    const currentPriceLocal = stock?.price ?? 0;
    const currencyLocal = EXCHANGE_CURRENCIES[exchange] || '';
    const companyName = stock?.name || '';

    // Estimate proceeds in GBP (assume ~1.27 GBP→USD rate for fee calc)
    const GBP_TO_USD = 1.27;
    const estimatedProceedsUsd = currentPriceLocal * shares / 150; // rough local→USD
    const estimatedProceedsGbp = estimatedProceedsUsd / GBP_TO_USD;
    const tradingFeeGbp = calculateTradingFee(estimatedProceedsGbp);

    const reference = generateOrderReference();

    // Create the order
    const order = await db.investmentOrder.create({
      data: {
        reference,
        senderId: sender.id,
        investmentAccountId: account.id,
        orderDirection: 'SELL',
        status: 'pending',
        ticker,
        exchange,
        companyName,
        assetType: 'equity',
        orderType: 'market',
        sharesRequested: shares,
        priceLocal: currentPriceLocal,
        currencyLocal,
        tradingFeeGbp,
        totalChargedGbp: 0, // no charge for sells
        totalChargedUsd: 0,
        settlementDate: null,
      },
    });

    // If mystocks is configured, place sell order immediately (no Paystack for sells)
    if (mystocksConfigured() && account.mystocksAccountId) {
      try {
        const msTicker = toMystocksTicker(ticker, exchange);
        const msResult = await placeOrder(account.mystocksAccountId, {
          type: 'SELL',
          symbol: msTicker,
          quantity: shares,
          orderType: 'market',
          limitPrice: null,
          reference,
        });

        await db.investmentOrder.update({
          where: { id: order.id },
          data: {
            status: 'submitted',
            mystocksOrderId: msResult.orderId ?? null,
            submittedAt: new Date(),
          },
        });
      } catch (e: any) {
        console.error('[sell] mystocks placeOrder failed:', e.message);
        // Keep as pending — webhook may still update it
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      reference,
    });
  } catch (e: any) {
    console.error('[sell]', e);
    return NextResponse.json({ error: e.message || 'Sell order failed' }, { status: 500 });
  }
}