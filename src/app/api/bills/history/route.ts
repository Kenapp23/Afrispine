import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Bill payment history is coming soon.',
    },
    { status: 503 }
  );
}
