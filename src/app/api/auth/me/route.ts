import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest, getAdminFromRequest } from '@/lib/auth';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(req: NextRequest) {
  try {
    await ensureDb();

    // Try sender session first
    const senderPayload = getSenderFromRequest(req);
    if (senderPayload) {
      const sender = await db.sender.findUnique({
        where: { id: senderPayload.id },
      });
      if (sender && sender.accountStatus === 'active') {
        const { passwordHash: _, ...safe } = sender;
        return NextResponse.json({
          success: true,
          type: 'sender',
          sender: {
            ...safe,
            fullName: `${sender.firstName || ''} ${sender.lastName || ''}`.trim(),
          },
        });
      }
    }

    // Try admin session
    const adminPayload = getAdminFromRequest(req);
    if (adminPayload) {
      const admin = await db.adminUser.findUnique({
        where: { id: adminPayload.id },
      });
      if (admin && admin.isActive) {
        const { passwordHash: _, ...safe } = admin;
        return NextResponse.json({
          success: true,
          type: 'admin',
          admin: safe,
        });
      }
    }

    // No valid session
    return NextResponse.json({ success: false, type: null }, { status: 401 });
  } catch (e: any) {
    console.error('[auth/me]', e);
    return NextResponse.json({ success: false, error: 'Session check failed' }, { status: 500 });
  }
}
