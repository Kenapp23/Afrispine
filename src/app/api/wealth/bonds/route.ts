import { NextRequest, NextResponse } from 'next/server';
import '@/lib/ensure-db';

export async function GET() {
  try {
    return NextResponse.json({
      bonds: [
        {
          id: 'bond-ke-treasury-2026',
          name: 'Kenya Treasury Bond 2026',
          country: 'KE',
          yield: 12.5,
          tenor: '2 Years',
          minInvestment: 50000,
          currency: 'KES',
          taxFree: true,
          interestFrequency: 'Semi-annual',
          issuer: 'Central Bank of Kenya',
          couponRate: 12.5,
          maturityDate: '2028-06-30',
        },
        {
          id: 'bond-ke-infrastructure-2027',
          name: 'Kenya Infrastructure Bond 2027',
          country: 'KE',
          yield: 13.2,
          tenor: '5 Years',
          minInvestment: 100000,
          currency: 'KES',
          taxFree: true,
          interestFrequency: 'Semi-annual',
          issuer: 'National Treasury',
          couponRate: 13.2,
          maturityDate: '2032-01-15',
        },
        {
          id: 'bond-ng-fgn-2028',
          name: 'FGN Savings Bond 2028',
          country: 'NG',
          yield: 18.5,
          tenor: '2 Years',
          minInvestment: 5000,
          currency: 'NGN',
          taxFree: true,
          interestFrequency: 'Quarterly',
          issuer: 'Debt Management Office',
          couponRate: 18.5,
          maturityDate: '2030-03-31',
        },
        {
          id: 'bond-ng-corporate-2027',
          name: 'Dangote Industries Corporate Bond',
          country: 'NG',
          yield: 22.0,
          tenor: '3 Years',
          minInvestment: 1000000,
          currency: 'NGN',
          taxFree: false,
          interestFrequency: 'Semi-annual',
          issuer: 'Dangote Industries Plc',
          couponRate: 22.0,
          maturityDate: '2029-06-30',
        },
        {
          id: 'bond-gh-treasury-2027',
          name: 'Ghana Treasury Bill 182-Day',
          country: 'GH',
          yield: 28.0,
          tenor: '6 Months',
          minInvestment: 1000,
          currency: 'GHS',
          taxFree: false,
          interestFrequency: 'At maturity',
          issuer: 'Bank of Ghana',
          couponRate: 28.0,
          maturityDate: '2027-12-31',
        },
        {
          id: 'bond-gh-2year-2029',
          name: 'Ghana 2-Year Fixed Note',
          country: 'GH',
          yield: 26.5,
          tenor: '2 Years',
          minInvestment: 2000,
          currency: 'GHS',
          taxFree: false,
          interestFrequency: 'Semi-annual',
          issuer: 'Republic of Ghana',
          couponRate: 26.5,
          maturityDate: '2029-06-30',
        },
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bondId, amount, currency } = body;

    if (!bondId || !amount) {
      return NextResponse.json({ error: 'Bond ID and amount are required' }, { status: 400 });
    }

    // In production this would create an actual bond subscription via the partner
    return NextResponse.json({
      success: true,
      message: 'Bond subscription submitted successfully',
      subscription: {
        bondId,
        amount,
        currency: currency || 'USD',
        status: 'pending',
        reference: `BND-${Date.now()}`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
