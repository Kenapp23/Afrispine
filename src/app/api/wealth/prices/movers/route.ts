import { NextResponse } from 'next/server';
import { getTopMovers } from '@/lib/wealth-data';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    let movers;
    if (type === 'all') {
      // Mix of top gainers and most active for variety
      const gainers = getTopMovers('gainers', Math.ceil(limit / 2));
      const active = getTopMovers('active', Math.floor(limit / 2));
      // Combine and deduplicate by ticker
      const seen = new Set<string>();
      movers = [];
      for (const s of [...gainers, ...active]) {
        if (!seen.has(s.ticker) && movers.length < limit) {
          seen.add(s.ticker);
          movers.push(s);
        }
      }
    } else if (type === 'gainers' || type === 'losers' || type === 'active') {
      movers = getTopMovers(type, limit);
    } else {
      movers = getTopMovers('gainers', limit);
    }

    // Add slight randomization to simulate live data (±0.3%)
    const live = movers.map(s => {
      const jitter = (Math.random() - 0.5) * 0.006;
      const newPrice = s.price * (1 + jitter);
      const newChange = newPrice - (s.price - s.change);
      const newChangePct = (newChange / (newPrice - newChange)) * 100;
      return {
        ticker: s.ticker,
        exchange: s.exchange,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(newChange * 100) / 100,
        changePct: Math.round(newChangePct * 100) / 100,
      };
    });

    return NextResponse.json({ movers: live });
  } catch (e: any) {
    console.error('[wealth/prices/movers]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
