import { NextResponse } from 'next/server';
import { processRecurringSends } from '@/lib/cron-jobs';

export async function POST() {
  try {
    const results = await processRecurringSends();
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    console.error('[cron/recurring]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}