import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/mystocks';
import { calculateSettlementDate } from '@/lib/wealth-fees';

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-mystocks-signature') || '';

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MYSTOCKS_WEBHOOK_SECRET || '';
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('[mystocksWebhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Return 200 immediately, process async
    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    // Fire-and-forget async processing
    processEvent(eventType, data).catch((e) => {
      console.error('[mystocksWebhook] Async processing failed:', e);
    });

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[mystocksWebhook]', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Status probe (same pattern as paystack webhook)
export async function GET() {
  return NextResponse.json({ status: 'MyStocks webhook endpoint' });
}

async function processEvent(eventType: string, data: any) {
  console.log(`[mystocksWebhook] Processing event: ${eventType}`);

  if (eventType === 'order.filled') {
    // Find order by mystocksOrderId
    const mystocksOrderId = data.orderId || data.mystocksOrderId;
    if (!mystocksOrderId) {
      console.warn('[mystocksWebhook] order.filled missing orderId');
      return;
    }

    const order = await db.investmentOrder.findFirst({
      where: { mystocksOrderId },
    });

    if (!order) {
      console.warn(`[mystocksWebhook] Order not found for mystocksOrderId: ${mystocksOrderId}`);
      return;
    }

    const filledShares = data.filledQuantity ?? data.quantity ?? 0;
    const fillPriceUsd = data.filledPrice ?? data.priceUsd ?? null;
    const exchange = order.exchange || 'NSE';
    const settlementDate = calculateSettlementDate(exchange, new Date());

    await db.investmentOrder.update({
      where: { id: order.id },
      data: {
        status: 'filled',
        sharesFilled: filledShares,
        fillPriceUsd,
        fillPriceLocal: data.filledPriceLocal ?? null,
        filledAt: new Date(),
        settlementDate,
        settled: true,
        settledAt: new Date(),
      },
    });

    console.log(`[mystocksWebhook] Order ${order.reference} filled: ${filledShares} shares`);
  }

  if (eventType === 'order.rejected') {
    const mystocksOrderId = data.orderId || data.mystocksOrderId;
    if (!mystocksOrderId) {
      console.warn('[mystocksWebhook] order.rejected missing orderId');
      return;
    }

    const order = await db.investmentOrder.findFirst({
      where: { mystocksOrderId },
    });

    if (!order) {
      console.warn(`[mystocksWebhook] Order not found for mystocksOrderId: ${mystocksOrderId}`);
      return;
    }

    await db.investmentOrder.update({
      where: { id: order.id },
      data: {
        status: 'failed',
        failureReason: data.reason || data.message || 'Order rejected by broker',
        failedAt: new Date(),
      },
    });

    console.log(`[mystocksWebhook] Order ${order.reference} rejected`);
  }

  if (eventType === 'dividend.paid') {
    const mystocksAccountId = data.mystocksAccountId || data.accountId;
    if (!mystocksAccountId) {
      console.warn('[mystocksWebhook] dividend.paid missing accountId');
      return;
    }

    const account = await db.investmentAccount.findUnique({
      where: { mystocksAccountId },
    });

    if (!account) {
      console.warn(`[mystocksWebhook] Account not found for mystocksAccountId: ${mystocksAccountId}`);
      return;
    }

    await db.dividendPayment.create({
      data: {
        senderId: account.senderId,
        investmentAccountId: account.id,
        ticker: data.symbol || data.ticker || '',
        exchange: data.exchange || '',
        companyName: data.companyName || '',
        sharesHeld: data.sharesHeld ?? 0,
        dividendPerShareLocal: data.dividendPerShare ?? data.amount ?? 0,
        amountLocal: data.amountLocal ?? data.grossAmount ?? 0,
        currencyLocal: data.currency || '',
        amountUsd: data.amountUsd ?? 0,
        amountGbp: data.amountGbp ?? 0,
        withheldTaxPct: data.withheldTaxPct ?? 0,
        withheldTaxAmountUsd: data.withheldTaxAmountUsd ?? 0,
        netUsd: data.netUsd ?? data.amountUsd ?? 0,
        exDate: data.exDate ? new Date(data.exDate) : null,
        payDate: data.payDate ? new Date(data.payDate) : null,
        receivedAt: new Date(),
        mystocksDividendId: data.dividendId || null,
      },
    });

    console.log(`[mystocksWebhook] Dividend recorded for account ${account.id}`);
  }

  if (eventType === 'deposit.confirmed') {
    console.log(`[mystocksWebhook] Deposit confirmed:`, JSON.stringify(data));
  }
}