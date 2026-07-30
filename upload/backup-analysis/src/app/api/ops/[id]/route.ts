import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tx = await db.transaction.findUnique({
      where: { id },
      include: {
        sender: { select: { email: true, fullName: true, phone: true, kycStatus: true, country: true } },
        quote: true,
        revenueRecords: true,
      },
    })
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    return NextResponse.json({ ...tx, id: undefined, sender: tx.sender || null })
  } catch (error) {
    console.error('[Ops/ID] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, reason } = body

    const tx = await db.transaction.findUnique({ where: { id } })
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const meta = JSON.parse(tx.metadata || '{}')
    let newStatus = tx.status

    switch (action) {
      case 'retry':
        if (!['failed'].includes(tx.status)) {
          return NextResponse.json({ error: 'Can only retry failed transactions' }, { status: 400 })
        }
        newStatus = 'processing'
        meta.retryReason = reason || 'Manually retried by ops'
        meta.retriedAt = new Date().toISOString()
        break

      case 'refund':
        if (!['failed', 'processing'].includes(tx.status)) {
          return NextResponse.json({ error: 'Can only refund failed or processing transactions' }, { status: 400 })
        }
        newStatus = 'refunded'
        meta.refundReason = reason || 'Manually refunded by ops'
        meta.refundedAt = new Date().toISOString()
        break

      case 'flag':
        meta.flaggedAt = new Date().toISOString()
        meta.flagReason = reason || 'Flagged for manual review'
        await db.transaction.update({
          where: { id },
          data: {
            amlResult: 'pending_review',
            amlDetails: reason || 'Flagged by ops',
            metadata: JSON.stringify(meta),
          },
        })
        return NextResponse.json({ success: true, action: 'flagged', txRef: tx.txRef })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: retry, refund, or flag' }, { status: 400 })
    }

    const updated = await db.transaction.update({
      where: { id },
      data: { status: newStatus, metadata: JSON.stringify(meta) },
    })

    return NextResponse.json({ success: true, action, newStatus, txRef: updated.txRef })
  } catch (error) {
    console.error('[Ops/ID] PATCH Error:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
