import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  await ensureDb();
  const { error, res, admin } = await requireAdmin(req);
  if (error) return res!;

  try {
    const { senderId, grossAmountUsd, assetCode, quantity, pricePerUnit, cscsNominee } = await req.json();

    if (!grossAmountUsd || grossAmountUsd <= 0) {
      return NextResponse.json({ error: 'grossAmountUsd is required and must be > 0' }, { status: 400 });
    }

    // Step 1: Load matching settlement rule
    const rule = await db.settlementRule.findFirst({
      where: { assetType: 'equity', currency: 'USD', isActive: true },
    });
    if (!rule) {
      return NextResponse.json({ error: 'No active settlement rule found for equity/USD' }, { status: 400 });
    }

    // Step 2: Calculate fee splits
    const afriSpineFee = +(grossAmountUsd * (rule.afriSpineFeeBps / 10000)).toFixed(2);
    const partnerFee = +(grossAmountUsd * (rule.partnerFeeBps / 10000)).toFixed(2);
    const netAssetUsd = +(grossAmountUsd - afriSpineFee - partnerFee).toFixed(2);

    // Step 3: Create settlement transaction
    const reference = 'STL-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const tx = await db.settlementTransaction.create({
      data: {
        reference,
        senderId: senderId || null,
        ruleId: rule.id,
        grossAmountUsd,
        afriSpineFeeUsd: afriSpineFee,
        partnerFeeUsd: partnerFee,
        netAssetUsd,
        status: 'pending',
        assetCode: assetCode || null,
        quantity: quantity || null,
        pricePerUnit: pricePerUnit || null,
        cscsNominee: cscsNominee || null,
      },
    });

    // Step 4: Simulate settlement pipeline
    const afriSpineTxRef = 'TXN-ASP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    await db.settlementTransaction.update({
      where: { id: tx.id },
      data: { status: 'split_complete', afriSpineTxRef },
    });

    const partnerTxRef = 'TXN-MSA-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    await db.settlementTransaction.update({
      where: { id: tx.id },
      data: { status: 'partner_settled', partnerTxRef },
    });

    const brokerTxRef = 'TXN-NGX-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    await db.settlementTransaction.update({
      where: { id: tx.id },
      data: { status: 'broker_executed', brokerTxRef },
    });

    await db.settlementTransaction.update({
      where: { id: tx.id },
      data: { status: 'completed' },
    });

    // Step 5: Create DiasporaNseLedger and FeeMatrix entries
    const ledger = await db.diasporaNseLedger.create({
      data: {
        orderId: tx.id,
        ticker: assetCode || 'N/A',
        side: 'BUY',
        quantity,
        price: pricePerUnit || (netAssetUsd / (quantity || 1)),
        totalValue: netAssetUsd,
        status: 'Secured',
        fee: afriSpineFee + partnerFee,
        currency: 'USD',
        exchange: 'NGX',
      },
    });

    await db.feeMatrix.create({
      data: {
        orderId: tx.id,
        type: 'platform_fee',
        description: `AfriSpine fee (${rule.afriSpineFeeBps} bps on $${grossAmountUsd})`,
        amount: afriSpineFee,
        currency: 'USD',
        recipient: 'AfriSpine Treasury',
        status: 'Collected',
      },
    });

    await db.feeMatrix.create({
      data: {
        orderId: tx.id,
        type: 'partner_fee',
        description: `MyStocks partner fee (${rule.partnerFeeBps} bps on $${grossAmountUsd})`,
        amount: partnerFee,
        currency: 'USD',
        recipient: 'MyStocks Africa',
        status: 'Collected',
      },
    });

    // Step 6: Build response
    const fxRate = 1.266; // simulated GBP→USD rate for display
    const response = {
      success: true,
      settlement: {
        reference: tx.reference,
        grossAmountUsd,
        breakdown: {
          userPaysGbp: +(grossAmountUsd / fxRate).toFixed(2),
          afriSpineFee,
          myStocksFee: partnerFee,
          netToBroker: netAssetUsd,
          fxRate,
        },
        steps: [
          { step: 1, action: 'AfriSpine Treasury', amount: afriSpineFee, status: 'completed', txRef: afriSpineTxRef },
          { step: 2, action: 'MyStocks Settlement', amount: grossAmountUsd - afriSpineFee, status: 'completed', txRef: partnerTxRef },
          { step: 3, action: 'Broker Execution', amount: netAssetUsd, status: 'completed', txRef: brokerTxRef },
        ],
      },
    };

    console.log(`[settlement/execute] ${reference} completed. Gross: $${grossAmountUsd}, Net: $${netAssetUsd} by ${admin?.email}`);
    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[settlement/execute]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
