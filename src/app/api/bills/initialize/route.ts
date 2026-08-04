import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Bill payments are coming soon. We are integrating our payment processor and will launch this feature shortly.',
    },
    { status: 503 }
  );
}
