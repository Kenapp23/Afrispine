import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, country } = await req.json();
    if (!name || !email || !country) {
      return NextResponse.json({ error: 'Name, email and country are required' }, { status: 400 });
    }
    const record = await db.chinaCorridorWaitlist.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), country: country.trim() },
    });
    return NextResponse.json({ success: true, id: record.id });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ success: true, message: 'You are already on the waiting list' });
    }
    console.error('[chinaWaitlist]', e);
    return NextResponse.json({ error: 'Failed to join waiting list' }, { status: 500 });
  }
}