import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = await requireSenderAuth(req);
    const { optIn, phone } = await req.json();
    
    const sender = await db.sender.findUnique({ where: { id: payload.id } });
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    
    const upsertPhone = phone || sender.phone;
    if (!upsertPhone) return NextResponse.json({ error: 'No phone number on file' }, { status: 400 });
    
    await db.whatsAppOptIn.upsert({
      where: { id: `${payload.id}_whatsapp` },
      create: { id: `${payload.id}_whatsapp`, senderId: payload.id, phone: upsertPhone, optIn: optIn !== false },
      update: { optIn: optIn !== false, phone: upsertPhone },
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}