import { NextRequest, NextResponse } from 'next/server';
import { getExchangeById, STOCKS } from '@/lib/wealth-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ exchangeId: string }> }
) {
  const { exchangeId } = await params;
  const exchange = getExchangeById(exchangeId);
  if (!exchange) {
    return NextResponse.json({ error: `Exchange '${exchangeId}' not found` }, { status: 404 });
  }
  const stocks = STOCKS[exchangeId] ?? [];
  return NextResponse.json({ exchange, stocks });
}
