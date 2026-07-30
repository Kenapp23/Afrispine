import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { getStockByTicker } from '@/lib/wealth-data';

// GET — return sender's watchlist items
export async function GET(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const items = await db.watchlistItem.findMany({
    where: { senderId: sender.id },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich each item with live price data
  const enriched = items.map((item) => {
    const live = getStockByTicker(item.ticker);
    return {
      ...item,
      currentPrice: live?.price ?? null,
      currentChange: live?.change ?? null,
      currentChangePct: live?.changePct ?? null,
    };
  });

  return NextResponse.json({ watchlist: enriched });
}

// POST — add a stock to the watchlist
export async function POST(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { ticker, exchange, companyName } = body;

  if (!ticker || !exchange) {
    return NextResponse.json({ error: 'ticker and exchange are required' }, { status: 400 });
  }

  // Look up current price for the addedPrice field
  const stock = getStockByTicker(ticker);
  const addedPrice = stock?.price ?? 0;

  const item = await db.watchlistItem.create({
    data: {
      senderId: sender.id,
      ticker,
      exchange,
      companyName: companyName || stock?.name || '',
      addedPrice,
    },
  });

  return NextResponse.json({ success: true, item });
}

// DELETE — remove a stock from the watchlist
export async function DELETE(req: NextRequest) {
  const sender = getSenderFromRequest(req);
  if (!sender) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { ticker, exchange } = body;

  if (!ticker || !exchange) {
    return NextResponse.json({ error: 'ticker and exchange are required' }, { status: 400 });
  }

  try {
    await db.watchlistItem.delete({
      where: {
        senderId_ticker_exchange: {
          senderId: sender.id,
          ticker,
          exchange,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Watchlist item not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}