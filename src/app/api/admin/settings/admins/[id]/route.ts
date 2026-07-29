import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const { id } = await params;
  const body = await req.json();
  const { role, isActive } = body;

  const data: Record<string, any> = {};
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;

  try {
    const admin = await db.adminUser.update({
      where: { id },
      data,
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
    return NextResponse.json({ admin });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const { id } = await params;
  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { id } });
  if (!admin) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.adminUser.update({
    where: { id },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true });
}