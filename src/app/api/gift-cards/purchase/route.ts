import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireSenderAuth } from '@/lib/auth';

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AFG-';
  for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function randomHex64(): string {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const sender = await requireSenderAuth(request);

    const body = await request.json();
    const { brandId, amount, currency, recipientName, recipientEmail, recipientPhone, message, occasion } = body;

    if (!brandId || !amount || !currency) {
      return NextResponse.json({ error: 'brandId, amount, and currency are required' }, { status: 400 });
    }

    // Look up brand
    const brand = await db.giftCardBrand.findUnique({ where: { id: brandId } });
    if (!brand || !brand.isVerified || !brand.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive brand' }, { status: 400 });
    }

    if (amount < brand.minAmount || amount > brand.maxAmount) {
      return NextResponse.json({ error: `Amount must be between ${brand.minAmount} and ${brand.maxAmount}` }, { status: 400 });
    }

    // Generate unique code
    let code = generateCode();
    let existing = await db.giftCard.findUnique({ where: { code } });
    while (existing) {
      code = generateCode();
      existing = await db.giftCard.findUnique({ where: { code } });
    }

    const txHash = randomHex64();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // QR code data
    const qrCodeData = JSON.stringify({
      cardId: '',
      code,
      brand: brand.brandName,
      amount,
      currency,
      blockchainContract: brand.smartContractAddress || '0x0000000000000000000000000000000000000000',
      issuedBy: 'AfriSpine',
      timestamp: new Date().toISOString(),
      redeemUrl: 'https://afrispine.com/gifts/redeem',
    });

    // Create gift card + transaction
    const giftCard = await db.giftCard.create({
      data: {
        code,
        brandId,
        senderId: sender.id,
        recipientName: recipientName || null,
        recipientEmail: recipientEmail || null,
        recipientPhone: recipientPhone || null,
        amount,
        currency,
        status: 'active',
        qrCodeData,
        blockchainTxHash: txHash,
        smartContractRef: brand.smartContractHash || null,
        message: message || null,
        occasion: occasion || null,
        expiresAt,
        transactions: {
          create: {
            type: 'purchase',
            amount,
            currency,
            status: 'completed',
            performedBy: sender.id,
            performedByRole: 'sender',
            blockchainTxHash: txHash,
            metadata: JSON.stringify({ brandName: brand.brandName, occasion }),
          },
        },
      },
      include: { brand: true, transactions: true },
    });

    // Update qrCodeData with actual card ID
    const updatedQrData = JSON.stringify({
      cardId: giftCard.id,
      code,
      brand: brand.brandName,
      amount,
      currency,
      blockchainContract: brand.smartContractAddress || '0x0000000000000000000000000000000000000000',
      issuedBy: 'AfriSpine',
      timestamp: new Date().toISOString(),
      redeemUrl: 'https://afrispine.com/gifts/redeem',
    });

    await db.giftCard.update({
      where: { id: giftCard.id },
      data: { qrCodeData: updatedQrData },
    });

    giftCard.qrCodeData = updatedQrData;

    return NextResponse.json({ giftCard });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[gift-cards/purchase]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
