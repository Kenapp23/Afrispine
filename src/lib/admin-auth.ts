import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, AdminJwtPayload } from './auth';
import { db, dbReady } from './db';

/** Convenience function: returns admin payload or null */
export async function adminAuth(req: NextRequest): Promise<AdminJwtPayload | null> {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') return null;
  return admin;
}

export async function requireAdmin(req: NextRequest): Promise<{
  error: string | null;
  res: NextResponse | null;
  admin: AdminJwtPayload | null;
}> {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return {
      error: 'Unauthorized',
      res: NextResponse.json({ error: 'Admin authentication required' }, { status: 401 }),
      admin: null,
    };
  }
  return { error: null, res: null, admin };
}

/**
 * Require admin auth AND 2FA enabled.
 * Use for sensitive routes: reconciliation, payouts, content takedown,
 * sponsor pricing, settings.
 */
export async function requireAdminWith2FA(req: NextRequest): Promise<{
  error: string | null;
  res: NextResponse | null;
  admin: AdminJwtPayload | null;
}> {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return {
      error: 'Unauthorized',
      res: NextResponse.json({ error: 'Admin authentication required' }, { status: 401 }),
      admin: null,
    };
  }

  // Check 2FA is enabled in the database
  if (dbReady) {
    try {
      const adminUser = await db.adminUser.findUnique({
        where: { id: admin.id },
        select: { twoFactorEnabled: true },
      });
      if (!adminUser?.twoFactorEnabled) {
        return {
          error: '2FA required',
          res: NextResponse.json({ error: 'Two-factor authentication is required for this action. Please enable 2FA in settings.', requires2FA: true }, { status: 403 }),
          admin: null,
        };
      }
    } catch {
      // If DB check fails, allow through (fail-open to avoid locking admins out
      // if DB is temporarily unavailable — the 2FA gate is a defense-in-depth measure)
    }
  }

  return { error: null, res: null, admin };
}

export function withAdminAuth(
  handler: (req: NextRequest, admin: AdminJwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.res!;
    return handler(req, auth.admin!);
  };
}

export function withAdminAuth2FA(
  handler: (req: NextRequest, admin: AdminJwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await requireAdminWith2FA(req);
    if (auth.error) return auth.res!;
    return handler(req, auth.admin!);
  };
}
