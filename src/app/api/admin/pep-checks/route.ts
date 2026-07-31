import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDb } from '@/lib/ensure-db';

/** GET — Admin view of all PEP check results */
export async function GET(req: NextRequest) {
  try {
    await ensureDb();
    const admin = getAdminFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [checks, total] = await Promise.all([
      db.pepCheck.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          sender: {
            select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true },
          },
        },
      }),
      db.pepCheck.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      checks,
      pagination: { total, limit, offset },
    });
  } catch (error: any) {
    console.error('[ADMIN PEP CHECKS]', error);
    return NextResponse.json({ error: 'Failed to retrieve PEP checks' }, { status: 500 });
  }
}
