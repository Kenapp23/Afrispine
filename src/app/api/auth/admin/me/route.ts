import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = getAdminFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const admin = await db.adminUser.findUnique({ where: { id: payload.id } });
  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  const { passwordHash: _, ...safe } = admin;
  return NextResponse.json({ admin: safe });
}