import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Auth is optional
    const sender = getSenderFromRequest(req);

    const { serviceKey, email } = await req.json();

    if (!serviceKey || !email) {
      return NextResponse.json(
        { error: 'serviceKey and email are required' },
        { status: 400 },
      );
    }

    try {
      await db.serviceWaitlist.create({
        data: {
          senderId: sender?.id || null,
          serviceKey,
          email,
        },
      });
    } catch (e: unknown) {
      // Ignore unique constraint violation (already on waitlist)
      const code =
        (e as { code?: string })?.code ||
        (e as { meta?: { target?: string } }).meta?.target;
      if (
        !String(e).includes('Unique') &&
        code !== 'P2002'
      ) {
        throw e;
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('[bills/waitlist]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}