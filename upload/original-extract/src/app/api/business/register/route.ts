import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      companyName,
      companyRegNumber,
      countryOfIncorporation,
      industry,
      signatoryName,
      email,
      phone,
      monthlyVolumeUsd,
      useCase,
    } = body;

    if (!companyName || !companyRegNumber || !countryOfIncorporation || !signatoryName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const existing = await db.businessAccount.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 409 },
      );
    }

    const application = await db.businessAccount.create({
      data: {
        companyName,
        companyRegNumber,
        countryOfIncorporation,
        industry: industry || '',
        signatoryName,
        email,
        phone: phone || '',
        monthlyVolumeUsd: monthlyVolumeUsd ? Number(monthlyVolumeUsd) : 0,
        useCase: useCase || '',
        kybStatus: 'pending',
        accountStatus: 'pending',
      },
    });

    return NextResponse.json(
      { id: application.id, status: 'pending' },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Business registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}