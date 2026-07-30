import { NextRequest, NextResponse } from 'next/server';
import { getSenderFromRequest } from '@/lib/auth';
import { getDividendCalendar, isConfigured as mystocksConfigured } from '@/lib/mystocks';

// Mock dividend data when mystocks is not configured
const MOCK_DIVIDENDS = [
  {
    symbol: 'SCOM',
    exchange: 'NSE',
    companyName: 'Safaricom',
    amount: 0.68,
    currency: 'KES',
    exDate: '2026-08-15',
    payDate: '2026-09-01',
    yieldPct: 8.2,
  },
  {
    symbol: 'EQTY',
    exchange: 'NSE',
    companyName: 'Equity Group',
    amount: 2.50,
    currency: 'KES',
    exDate: '2026-07-20',
    payDate: '2026-08-15',
    yieldPct: 5.1,
  },
  {
    symbol: 'DANGCEM',
    exchange: 'NGX',
    companyName: 'Dangote Cement',
    amount: 20.00,
    currency: 'NGN',
    exDate: '2026-09-10',
    payDate: '2026-10-05',
    yieldPct: 6.5,
  },
  {
    symbol: 'MTNN',
    exchange: 'NGX',
    companyName: 'MTN Nigeria',
    amount: 13.15,
    currency: 'NGN',
    exDate: '2026-08-25',
    payDate: '2026-09-20',
    yieldPct: 9.1,
  },
  {
    symbol: 'NPN',
    exchange: 'JSE',
    companyName: 'Naspers',
    amount: 3.20,
    currency: 'ZAR',
    exDate: '2026-09-15',
    payDate: '2026-09-30',
    yieldPct: 0.5,
  },
  {
    symbol: 'MTNGH',
    exchange: 'GSE',
    companyName: 'MTN Ghana',
    amount: 0.015,
    currency: 'GHS',
    exDate: '2026-10-01',
    payDate: '2026-10-20',
    yieldPct: 3.5,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (mystocksConfigured()) {
      const calendar = await getDividendCalendar();
      return NextResponse.json({ dividends: calendar });
    }

    return NextResponse.json({ dividends: MOCK_DIVIDENDS });
  } catch (e: any) {
    console.error('[dividends/calendar]', e);
    return NextResponse.json({ error: e.message || 'Failed to load dividend calendar' }, { status: 500 });
  }
}