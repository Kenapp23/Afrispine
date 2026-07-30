import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIpoRegistrationStats } from '@/lib/wealth-data';

export async function GET() {
  try {
    const count = await db.ipoRegistration.count();
    const stats = getIpoRegistrationStats();
    return NextResponse.json({
      total: count || stats.total,
      countries: stats.countries,
      byCountry: stats.byCountry
    });
  } catch {
    const stats = getIpoRegistrationStats();
    return NextResponse.json({ total: stats.total, countries: stats.countries, byCountry: stats.byCountry });
  }
}