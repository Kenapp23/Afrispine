/**
 * Admin 2FA Disable
 *
 * POST: Verify current TOTP token and disable 2FA. Admin only.
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
      return NextResponse.json({ error: '2FA not set up.' }, { status: 400 });
    }

    const isValid = totp.validate({ token, secret: admin.twoFactorSecret }) !== null;

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Disable 2FA and clear secret
    await db.adminUser.update({
      where: { id: auth.admin.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return NextResponse.json({ success: true, twoFactorEnabled: false });
  } catch (err) {
    console.error('[admin/2fa/disable] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
