import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Gift card purchases are coming soon. Please join the waitlist to be notified.' },
    { status: 503 }
  );
}
