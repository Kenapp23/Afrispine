import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.ipoRegistration.count({
      where: { source: 'intra-africa' },
    });
    return NextResponse.json({ total: count });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}