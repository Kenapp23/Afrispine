import { NextRequest, NextResponse } from 'next/server';
import { getFxRate, applyMargin, formatCurrency } from '@/lib/fx';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') || 'GBP';
  const to = req.nextUrl.searchParams.get('to') || 'KES';
  const rawRate = await getFxRate(from, to);
  const corridor = `${from.substring(0,2).toUpperCase()}-${to.substring(0,2).toUpperCase()}`;
  const rate = await applyMargin(rawRate, corridor);
  return NextResponse.json({ rate: Math.round(rate * 100) / 100, from, to, fetchedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15*60*1000).toISOString() });
}
