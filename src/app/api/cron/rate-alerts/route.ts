import { NextResponse } from 'next/server';
import { processRateAlerts } from '@/lib/cron-jobs';

export async function POST() {
  try {
    const result = await processRateAlerts();
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}