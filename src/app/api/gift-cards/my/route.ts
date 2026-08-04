import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Gift card history is coming soon.', cards: [] },
    { status: 503 }
  );
}
