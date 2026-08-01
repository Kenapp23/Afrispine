import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { error, res, admin } = await requireAdmin(request);
    if (error) return res!;

    const { id } = await params;

    const brand = await db.giftCardBrand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (brand.kycStatus !== 'verified') {
      return NextResponse.json({ error: 'Brand must be verified before generating a smart contract' }, { status: 400 });
    }

    // Generate mock smart contract document
    const contract = {
      contractId: `SC-${Date.now()}`,
      version: '1.0',
      type: 'GiftCardEscrow',
      platform: 'AfriSpine',
      generatedAt: new Date().toISOString(),
      brand: {
        id: brand.id,
        name: brand.brandName,
        slug: brand.slug,
        country: brand.country,
        category: brand.category,
      },
      terms: {
        escrowModel: 'Time-locked with manual release',
        expiryPolicy: 'Cards expire 12 months from issuance unless redeemed',
        refundPolicy: 'Unredeemed cards eligible for refund after expiry',
        settlementPeriod: 'T+2 business days',
        feeStructure: {
          platformFee: '2.5% of face value',
          processingFee: '$0.50 per transaction',
          currencyConversion: 'AfriSpine mid-market rate',
        },
      },
      reconciliationRules: {
        reportingFrequency: 'Daily',
        settlementCurrency: 'USD',
        disputeWindow: '30 days from redemption',
        auditTrail: 'Full transaction history with blockchain verification',
      },
      compliance: {
        kycRequired: true,
        amlMonitoring: true,
        dataProtection: 'Compliant with GDPR and local regulations',
      },
      signatures: {
        platform: { name: 'AfriSpine Ltd', role: 'Platform Operator' },
        brand: { name: brand.brandName, role: 'Gift Card Issuer' },
      },
    };

    const contractJson = JSON.stringify(contract);
    const contractHash = await sha256(contractJson);

    // Update the brand's contract hash
    await db.giftCardBrand.update({
      where: { id },
      data: { smartContractHash: contractHash },
    });

    return NextResponse.json({
      contract,
      contractHash,
      message: 'Smart contract generated successfully',
    });
  } catch (error: any) {
    console.error('[admin/gift-cards/brands/contract]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
