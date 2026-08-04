import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Transfer history is coming soon. We are integrating our payment processor.',
      transfers: [],
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Transfers are coming soon. We are integrating our payment processor.',
    },
    { status: 503 }
  );
}
