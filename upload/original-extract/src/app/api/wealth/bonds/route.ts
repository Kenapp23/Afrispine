import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';
import { getBonds, getFunds, isConfigured as mystocksConfigured, subscribe } from '@/lib/mystocks';
import { generateOrderReference } from '@/lib/wealth-fees';
import { initializeTransaction } from '@/lib/paystack';

const MOCK_BONDS = [
  { id: 'bond-ken-infra-2026', name: 'Kenya Infrastructure Bond 2026/2031', issuer: 'Kenya National Treasury', yieldPct: 14.25, taxFree: true, tenorYears: 5, minInvestmentLocal: 50000, currency: 'KES', interestFrequency: 'Semi-annual', type: 'bond', status: 'open' },
  { id: 'bond-ken-tbill-2026', name: 'Kenya Treasury Bond 2026/2036', issuer: 'Kenya National Treasury', yieldPct: 13.50, taxFree: false, tenorYears: 10, minInvestmentLocal: 50000, currency: 'KES', interestFrequency: 'Semi-annual', type: 'bond', status: 'open' },
  { id: 'bond-nga-fgn-2026', name: 'Nigeria FGN Savings Bond', issuer: 'Federal Government of Nigeria', yieldPct: 12.50, taxFree: false, tenorYears: 2, minInvestmentLocal: 5000000, currency: 'NGN', interestFrequency: 'Quarterly', type: 'bond', status: 'open' },
  { id: 'bond-gha-euro-2027', name: 'Ghana Eurobond 2027', issuer: 'Republic of Ghana', yieldPct: 11.80, taxFree: false, tenorYears: 5, minInvestmentLocal: 10000, currency: 'USD', interestFrequency: 'Semi-annual', type: 'bond', status: 'upcoming' },
];

// GET — list available bonds
export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (mystocksConfigured()) {
      const [bonds, funds] = await Promise.all([getBonds(), getFunds()]);
      return NextResponse.json({ bonds: [...(bonds ?? []), ...(funds ?? [])] });
    }

    return NextResponse.json({ bonds: MOCK_BONDS });
  } catch (e: any) {
    console.error('[bonds]', e);
    return NextResponse.json({ error: e.message || 'Failed to load bonds' }, { status: 500 });
  }
}

// POST — subscribe to a bond
export async function POST(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { bondId, amountUsd } = body;

    if (!bondId || !amountUsd || amountUsd <= 0) {
      return NextResponse.json({ error: 'bondId and amountUsd are required' }, { status: 400 });
    }

    // Verify sender has investment account
    const account = await db.investmentAccount.findUnique({
      where: { senderId: sender.id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Investment account not found. Please create one first.' }, { status: 404 });
    }

    // Look up sender email for Paystack
    const senderRecord = await db.sender.findUnique({
      where: { id: sender.id },
      select: { email: true },
    });

    const reference = generateOrderReference();

    // Create order record
    const order = await db.investmentOrder.create({
      data: {
        reference,
        senderId: sender.id,
        investmentAccountId: account.id,
        orderDirection: 'BUY',
        status: 'pending',
        ticker: bondId,
        exchange: 'BOND',
        companyName: bondId,
        assetType: 'bond',
        orderType: 'market',
        investmentAmountUsd: amountUsd,
        totalChargedUsd: amountUsd,
      },
    });

    // Initialize Paystack payment (amount in GBP, assume ~1.27 USD/GBP)
    const GBP_TO_USD = 1.27;
    const amountGbp = amountUsd / GBP_TO_USD;

    const paystackResult = await initializeTransaction({
      email: senderRecord?.email || '',
      amount: amountGbp,
      reference,
      metadata: {
        type: 'bond_investment',
        senderId: sender.id,
        investmentAccountId: account.id,
        orderId: order.id,
        bondId,
        amountUsd,
      },
    });

    // Update order with Paystack ref
    await db.investmentOrder.update({
      where: { id: order.id },
      data: { paystackRef: reference },
    });

    return NextResponse.json({
      accessCode: paystackResult.access_code,
      reference: paystackResult.reference,
      orderId: order.id,
    });
  } catch (e: any) {
    console.error('[bonds]', e);
    return NextResponse.json({ error: e.message || 'Bond subscription failed' }, { status: 500 });
  }
}