import { NextRequest, NextResponse } from 'next/server';
import { requireSenderAuth } from '@/lib/auth';
import { optIn, optOut, isOptedIn } from '@/lib/whatsapp';
import { db } from '@/lib/db';

/**
 * GET  /api/whatsapp/opt-in — Check current opt-in status
 * POST /api/whatsapp/opt-in — Toggle opt-in on/off
 */

export async function GET(req: NextRequest) {
  let authPayload: any;
  try {
    authPayload = await requireSenderAuth(req);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const sender = await db.sender.findUnique({
    where: { id: authPayload.id },
    select: { phone: true },
  });

  if (!sender?.phone) {
    return NextResponse.json({ optedIn: false, phoneMissing: true });
  }

  try {
    const optedIn = await isOptedIn(sender.phone);
    return NextResponse.json({ optedIn, phoneMissing: false });
  } catch {
    return NextResponse.json({ optedIn: false, phoneMissing: false });
  }
}

export async function POST(req: NextRequest) {
  let authPayload: any;
  try {
    authPayload = await requireSenderAuth(req);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sender = await db.sender.findUnique({
    where: { id: authPayload.id },
    select: { phone: true },
  });

  if (!sender?.phone) {
    return NextResponse.json(
      { error: 'No phone number on file. Add your number in Account Settings first.' },
      { status: 400 }
    );
  }

  const enable = body.enable !== false; // default true

  try {
    if (enable) {
      await optIn(sender.phone, authPayload.id);
    } else {
      const { optOut: doOptOut } = await import('@/lib/whatsapp');
      await doOptOut(sender.phone);
    }
    return NextResponse.json({ success: true, optedIn: enable });
  } catch (err: any) {
    console.error('[whatsapp/opt-in] Error:', err);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}
