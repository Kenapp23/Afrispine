import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signAdminToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

let autoSeeded = false;

async function ensureSeeded() {
  if (autoSeeded) return;
  try {
    const count = await db.adminUser.count();
    if (count === 0) {
      const hash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin@2024',
        12,
      );
      await db.adminUser.create({
        data: {
          email: process.env.ADMIN_EMAIL || 'admin@afrispine.com',
          passwordHash: hash,
          fullName: 'AfriSpine Admin',
          role: 'superadmin',
          isActive: true,
        },
      });
      console.log('[adminLogin] Auto-seeded admin user on first login attempt');
    }
    autoSeeded = true;
  } catch (e) {
    console.error('[adminLogin] Auto-seed failed', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const admin = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!admin.isActive) {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    const token = signAdminToken({ id: admin.id, email: admin.email, role: 'admin' });
    const { passwordHash: _, ...safe } = admin;
    const res = NextResponse.json({ success: true, admin: safe, token });
    res.cookies.set('afrispine_admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (e: any) {
    console.error('[adminLogin]', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
