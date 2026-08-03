import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, signSenderToken, signAdminToken } from '@/lib/auth';
import { ensureDb, ensureAdminSeeded } from '@/lib/ensure-db';

// ─── Helper: parse the slug from the URL ───────────────────────
function parseSlug(request: NextRequest): string[] {
  const url = new URL(request.url);
  // /api/auth/signup → ['signup']
  // /api/auth/admin/login → ['admin', 'login']
  const parts = url.pathname.replace('/api/auth/', '').split('/').filter(Boolean);
  return parts;
}

// ─── Helper: read JSON body safely ─────────────────────────────
async function body(req: NextRequest) {
  return req.json();
}

// ─── Helper: JSON error response (no internal details leaked) ──
function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status });
}

// ─── Unified POST handler ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const slug = parseSlug(req);

  try {
    // ── /api/auth/signup ───────────────────────────────────────
    if (slug[0] === 'signup' && slug.length === 1) {
      try {
        await ensureDb();
      } catch {
        return err('Signup is temporarily unavailable — database not ready', 503);
      }

      const { fullName, email, phone, password } = await body(req);

      if (!fullName || !email || !password)
        return err('Full name, email, and password are required', 400);

      if (password.length < 8)
        return err('Password must be at least 8 characters', 400);

      const normalizedEmail = email.trim().toLowerCase();

      const existing = await db.sender.findUnique({ where: { email: normalizedEmail } });
      if (existing) return err('An account with this email already exists', 409);

      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const passwordHash = await hashPassword(password);

      const sender = await db.sender.create({
        data: {
          email: normalizedEmail,
          firstName,
          lastName,
          phone: phone?.trim() || null,
          passwordHash,
          kycStatus: 'pending',
          accountStatus: 'active',
        },
      });

      const token = signSenderToken({ id: sender.id, email: sender.email, role: 'sender' });
      const { passwordHash: _, ...safe } = sender;

      const res = NextResponse.json({ success: true, sender: safe, token });
      res.cookies.set('afrispine_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      return res;
    }

    // ── /api/auth/login ────────────────────────────────────────
    if (slug[0] === 'login' && slug.length === 1) {
      try {
        await ensureDb();
      } catch {
        return err('Login is temporarily unavailable — database not ready', 503);
      }

      const { email, password } = await body(req);

      if (!email || !password)
        return err('Email and password are required', 400);

      const sender = await db.sender.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (!sender) return err('Invalid credentials', 401);

      const valid = await verifyPassword(password, sender.passwordHash);
      if (!valid) return err('Invalid credentials', 401);

      if (sender.accountStatus !== 'active')
        return err('Account is not active', 403);

      const token = signSenderToken({ id: sender.id, email: sender.email, role: 'sender' });
      const { passwordHash: _, ...safe } = sender;

      const res = NextResponse.json({ success: true, sender: safe, token });
      res.cookies.set('afrispine_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      return res;
    }

    // ── /api/auth/admin/login ──────────────────────────────────
    if (slug[0] === 'admin' && slug[1] === 'login' && slug.length === 2) {
      try {
        await ensureAdminSeeded();
      } catch {
        return err('Admin database initialization failed', 503);
      }

      const { email, password } = await body(req);

      if (!email || !password)
        return err('Email and password are required', 400);

      const normalizedEmail = email.trim().toLowerCase();
      const admin = await db.adminUser.findUnique({
        where: { email: normalizedEmail },
      });
      if (!admin) return err('Invalid credentials', 401);
      if (!admin.isActive) return err('Account is not active', 403);

      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) return err('Invalid credentials', 401);

      await db.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

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
    }

    // ── Unknown route ───────────────────────────────────────────
    return err('Not found', 404);

  } catch (e: any) {
    console.error(`[auth/${slug.join('/')}]`, e);
    return err('Authentication failed', 500);
  }
}
