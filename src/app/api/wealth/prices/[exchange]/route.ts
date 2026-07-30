import { NextRequest, NextResponse } from 'next/server';
import { EXCHANGES, STOCKS } from '@/lib/wealth-data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ exchange: string }> },
) {
  const { exchange: exchangeId } = await params;

  const exchange = EXCHANGES.find((e) => e.id === exchangeId);
  if (!exchange) {
    return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
  }

  const stocks = STOCKS[exchangeId] ?? [];

  return NextResponse.json({ exchange, stocks });
}