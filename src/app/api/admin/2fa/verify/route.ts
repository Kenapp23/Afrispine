/**
 * Admin 2FA Verify
 *
 * POST: Verify a TOTP token and enable 2FA. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { TOTP, createGuardrails } from 'otplib';

const guardrails = createGuardrails({ window: 1 });
const totp = new TOTP({
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  ...guardrails,
});

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  try {
    const body = await req.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // Fetch the stored secret
    const admin = await db.adminUser.findUnique({
      where: { id: auth.admin.id },
      select: { twoFactorSecret: true },
    });

    if (!admin?.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not set up. Call /setup first.' }, { status: 400 });
    }

    const isValid = totp.validate({ token, secret: admin.twoFactorSecret }) !== null;

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Enable 2FA
    await db.adminUser.update({
      where: { id: auth.admin.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ success: true, twoFactorEnabled: true });
  } catch (err) {
    console.error('[admin/2fa/verify] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
