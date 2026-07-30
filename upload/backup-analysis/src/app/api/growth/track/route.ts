import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { triggerDripSequence } from '@/lib/drip-engine';

export async function POST(req: NextRequest) {
  try {
    const payload = await requireSenderAuth(req);
    const { eventType, metadata } = await req.json();
    if (!eventType) return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    
    await db.growthEvent.create({
      data: {
        senderId: payload.id,
        eventType,
        metadata: JSON.stringify(metadata || {}),
      },
    });

    // Auto-trigger relevant drip sequences based on event type (fire-and-forget)
    if (eventType === 'first_send' || eventType === 'transfer_completed') {
      triggerDripSequence(payload.id, 'investment_nurture').catch(() => {});
    }
    if (eventType === 'ipo_registered') {
      triggerDripSequence(payload.id, 'dangote_ipo').catch(() => {});
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}