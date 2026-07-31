import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

const PEPCHECKER_BASE_URL = 'https://pepchecker.com/api/v1/check';

/** PEPChecker API response types */
interface PepEntry {
  title?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  aliases?: string;
  function?: string;
  specific?: string;
  country?: string;
  possibleBirthDates?: string[];
  active?: boolean;
}

interface PepCheckerResponse {
  pepList: PepEntry[];
  sanctionList: PepEntry[];
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the user is authenticated
    const user = getSenderFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { firstName, lastName, dobStart, dobEnd } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // 3. Get API key — use test key for free tier, production key if set
    const apiKey = process.env.PEPCHECKER_API_KEY || 'test-d8269f8b-721a-42bf-8dba-6d2a30dcff68';

    // 4. Build PEPChecker query
    const params = new URLSearchParams({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (dobStart) params.set('dobStart', dobStart);
    if (dobEnd) params.set('dobEnd', dobEnd);

    const checkUrl = `${PEPCHECKER_BASE_URL}?${params.toString()}`;

    console.log(`[PEPCHECKER] Checking: ${firstName} ${lastName}`);

    // 5. Call PEPChecker API
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PEPCHECKER] API error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `PEP screening service error: ${response.status}` },
        { status: 502 }
      );
    }

    const data: PepCheckerResponse = await response.json();

    // 6. Process results
    const pepList = data.pepList || [];
    const sanctionList = data.sanctionList || [];
    const isPep = pepList.length > 0;
    const isSanctioned = sanctionList.length > 0;

    // 7. Determine check status
    let status: string;
    if (isSanctioned) {
      status = 'sanctioned'; // Blocked — sanctions hit
    } else if (isPep) {
      status = 'pep_review'; // Flagged for manual review
    } else {
      status = 'clear'; // All clear
    }

    // 8. Save check result to database
    const pepCheck = await db.pepCheck.create({
      data: {
        senderId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dobStart: dobStart || null,
        dobEnd: dobEnd || null,
        isPep,
        isSanctioned,
        pepCount: pepList.length,
        sanctionCount: sanctionList.length,
        rawResponse: JSON.stringify(data),
        status,
      },
    });

    // 9. Update sender KYC status if flagged
    if (status === 'clear') {
      // PEP check passed, update sender kycStatus to 'pep_clear'
      await db.sender.update({
        where: { id: user.id },
        data: { kycStatus: 'pep_clear' },
      });
    } else if (status === 'pep_review') {
      await db.sender.update({
        where: { id: user.id },
        data: { kycStatus: 'pep_review' },
      });
    } else if (status === 'sanctioned') {
      await db.sender.update({
        where: { id: user.id },
        data: { kycStatus: 'sanctioned' },
      });
    }

    // 10. Return result
    return NextResponse.json({
      success: true,
      checkId: pepCheck.id,
      status,
      isPep,
      isSanctioned,
      pepCount: pepList.length,
      sanctionCount: sanctionList.length,
      // Return summary info (not full PEP details to client for security)
      pepSummary: pepList.length > 0
        ? pepList.slice(0, 3).map((p) => ({
            country: p.country,
            function: p.function,
            specific: p.specific,
            active: p.active,
          }))
        : [],
      sanctionSummary: sanctionList.length > 0
        ? sanctionList.slice(0, 3).map((s) => ({
            country: s.country,
            function: s.function,
            specific: s.specific,
          }))
        : [],
      checkedAt: pepCheck.checkedAt,
    });
  } catch (error: any) {
    console.error('[PEPCHECKER] Error:', error);
    return NextResponse.json(
      { error: 'PEP screening failed', details: error.message },
      { status: 500 }
    );
  }
}

/** GET — Retrieve PEP check history for the authenticated sender */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checks = await db.pepCheck.findMany({
      where: { senderId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isPep: true,
        isSanctioned: true,
        pepCount: true,
        sanctionCount: true,
        status: true,
        checkedAt: true,
      },
    });

    return NextResponse.json({ success: true, checks });
  } catch (error: any) {
    console.error('[PEPCHECKER] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve PEP check history' },
      { status: 500 }
    );
  }
}
