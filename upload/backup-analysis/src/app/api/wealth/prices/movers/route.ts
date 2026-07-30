import { NextRequest, NextResponse } from 'next/server';
import { STOCKS, type StockQuote } from '@/lib/wealth-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '10');

  const allStocks = Object.values(STOCKS).flat();
  let filtered: StockQuote[];

  switch (type) {
    case 'gainers': filtered = [...allStocks].sort((a, b) => b.changePct - a.changePct); break;
    case 'losers': filtered = [...allStocks].sort((a, b) => a.changePct - b.changePct); break;
    default: filtered = [...allStocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)); break;
  }

  return NextResponse.json({ movers: filtered.slice(0, limit) });
}