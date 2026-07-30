import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const admin = await db.adminUser.findUnique({ where: { email } });
    if (!admin) {
      console.warn('[adminLogin] No admin found for:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!admin.isActive) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      console.warn('[adminLogin] Invalid password for:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    const token = signAdminToken({ id: admin.id, email: admin.email, role: 'admin' });
    const { passwordHash: _, ...safe } = admin;
    const res = NextResponse.json({ success: true, admin: safe, token });
    res.cookies.set('afrispine_admin_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60, path: '/' });
    return res;
  } catch (e: any) {
    console.error('[adminLogin]', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}