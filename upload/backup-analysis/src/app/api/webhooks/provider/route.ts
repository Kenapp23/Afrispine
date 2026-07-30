import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { txRef, providerStatus, providerReference, errorMessage } = body

    if (!txRef || !providerStatus) {
      return NextResponse.json({ error: 'txRef and providerStatus required' }, { status: 400 })
    }

    const tx = await db.transaction.findUnique({ where: { txRef } })
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const newStatus = providerStatus === 'delivered' ? 'delivered' : 'failed'
    const meta = JSON.parse(tx.metadata || '{}')
    meta.webhookReceived = new Date().toISOString()
    meta.providerStatus = providerStatus
    if (errorMessage) meta.webhookError = errorMessage

    const updated = await db.transaction.update({
      where: { txRef },
      data: {
        status: newStatus,
        providerReference: providerReference || tx.providerReference,
        metadata: JSON.stringify(meta),
      },
    })

    // Log webhook
    console.log(`[Webhook] ${txRef}: ${providerStatus} from ${tx.providerName}`)

    return NextResponse.json({ received: true, txRef, newStatus })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
