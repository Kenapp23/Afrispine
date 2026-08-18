/**
 * Admin 2FA Setup
 *
 * POST: Generate TOTP secret + QR code data URL. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { TOTP, generateSecret, createGuardrails } from 'otplib';
import QRCode from 'qrcode';

// Configure TOTP options
const guardrails = createGuardrails({
  window: 1,
});
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
    const secret = generateSecret();

    // Build otpauth URL
    const otpauthUrl = totp.toURI(secret, auth.admin.email, 'AfriSpine Admin');

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret on admin user, 2FA not yet enabled
    await db.adminUser.update({
      where: { id: auth.admin.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    return NextResponse.json({ secret, qrDataUrl });
  } catch (err) {
    console.error('[admin/2fa/setup] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
