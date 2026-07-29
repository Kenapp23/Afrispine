import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { searchParams } = new URL(req.url);
  const kycStatus = searchParams.get('kycStatus') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));

  const where: any = {};
  if (kycStatus) {
    where.kycStatus = kycStatus;
  }
  if (status) {
    where.accountStatus = status;
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [senders, total] = await Promise.all([
    db.sender.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { transactions: true } } },
    }),
    db.sender.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  const stripped = senders.map((s) => {
    const { passwordHash: _, ...safe } = s;
    return safe;
  });

  return NextResponse.json({ senders: stripped, total, page, pages });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res;

  const { id, kycStatus, accountStatus, dailyLimitGbp } = await req.json();
  const data: any = {};
  if (kycStatus) data.kycStatus = kycStatus;
  if (accountStatus) data.accountStatus = accountStatus;
  if (dailyLimitGbp) data.dailyLimitGbp = dailyLimitGbp;
  const sender = await db.sender.update({ where: { id }, data });
  const { passwordHash: _, ...safe } = sender;
  return NextResponse.json({ sender: safe });
}