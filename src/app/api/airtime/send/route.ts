import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Airtime top-up is coming soon. We are integrating our payment processor.',
    },
    { status: 503 }
  );
}
