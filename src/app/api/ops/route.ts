import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Summary view
    if (view === 'summary') {
      const all = await db.transaction.findMany({ select: { status: true, sendAmount: true, fee: true, sendCurrency: true } })
      const summary = {
        totalTransactions: all.length,
        totalVolume: Math.round(all.reduce((s, t) => s + t.sendAmount, 0) * 100) / 100,
        totalFees: Math.round(all.reduce((s, t) => s + t.fee, 0) * 100) / 100,
        currency: 'GBP',
        pendingCount: all.filter(t => ['quote', 'kyc_pending', 'payment_pending'].includes(t.status)).length,
        processingCount: all.filter(t => t.status === 'processing').length,
        deliveredCount: all.filter(t => t.status === 'delivered').length,
        failedCount: all.filter(t => t.status === 'failed').length,
        refundedCount: all.filter(t => t.status === 'refunded').length,
      }
      return NextResponse.json(summary)
    }

    // Transaction list
    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { sender: { select: { email: true, fullName: true, kycStatus: true } } },
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        txRef: t.txRef,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        senderName: t.senderName || t.sender?.fullName || 'Guest',
        senderEmail: t.senderEmail || t.sender?.email || '',
        senderKycStatus: t.senderKycStatus,
        senderCountry: t.senderCountry,
        recipientName: t.recipientName,
        recipientPhone: t.recipientPhone,
        recipientCountry: t.recipientCountry,
        sendAmount: t.sendAmount,
        sendCurrency: t.sendCurrency,
        recvAmount: t.recvAmount,
        recvCurrency: t.recvCurrency,
        fxRate: t.fxRate,
        fee: t.fee,
        feePct: t.feePct,
        status: t.status,
        providerName: t.providerName,
        providerReference: t.providerReference,
        deliveryMethod: t.deliveryMethod,
        amlResult: t.amlResult,
        quoteExpiresAt: t.quoteExpiresAt?.toISOString(),
        stripePaymentIntentId: t.stripePaymentIntentId,
      })),
      total,
      filters: { status, limit, offset },
    })
  } catch (error) {
    console.error('[Ops] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch ops data' }, { status: 500 })
  }
}
