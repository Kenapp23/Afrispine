import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const body = await req.json();
  const { fullName, email, password, role } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Admin user with this email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const admin = await db.adminUser.create({
    data: {
      fullName: fullName || '',
      email,
      passwordHash,
      role: role || 'ops',
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  // TODO: Send welcome email

  return NextResponse.json({ admin }, { status: 201 });
}