import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.sender.count();
    return NextResponse.json({ status: 'ok', db: 'connected', senderCount: count });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message, code: e.code }, { status: 500 });
  }
}
