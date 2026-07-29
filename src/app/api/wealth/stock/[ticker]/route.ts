import { NextRequest, NextResponse } from 'next/server';
import { getStockByTicker, generatePriceHistory } from '@/lib/wealth-data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;

  const stock = getStockByTicker(ticker);
  if (!stock) {
    return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  }

  // Use dividendYield as a proxy for volatility — higher-yield stocks tend to be less volatile
  const volatility = stock.dividendYield ? Math.max(0.008, 0.025 - stock.dividendYield * 0.001) : 0.02;
  const history = generatePriceHistory(stock.price, volatility);

  return NextResponse.json({ stock, history });
}