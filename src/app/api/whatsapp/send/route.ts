import { NextRequest, NextResponse } from 'next/server';
import { requireSenderAuth } from '@/lib/auth';
import { sendWhatsApp } from '@/lib/whatsapp';
import type { WhatsAppTemplateKey } from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/send
 *
 * Authenticated endpoint for a logged-in sender to trigger a WhatsApp
 * message to their own phone. Accepts:
 *   { templateKey: string, templateParams: Record<string, string> }
 *
 * The recipient phone is pulled from the sender's profile.
 */
export async function POST(req: NextRequest) {
  // 1. Auth check
  let authPayload: any;
  try {
    authPayload = await requireSenderAuth(req);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { templateKey, templateParams } = body;

  if (!templateKey || typeof templateKey !== 'string') {
    return NextResponse.json({ error: 'templateKey is required' }, { status: 400 });
  }

  const validKeys: string[] = [
    'transaction_confirmation',
    'welcome',
    'referral_notification',
    'ipo_confirmation',
    'gift_card_notification',
  ];
  if (!validKeys.includes(templateKey)) {
    return NextResponse.json(
      { error: 'Invalid templateKey. Must be one of: ' + validKeys.join(', ') },
      { status: 400 }
    );
  }

  // 3. Get sender phone from DB
  const { db } = await import('@/lib/db');
  const sender = await db.sender.findUnique({
    where: { id: authPayload.id },
    select: { phone: true, firstName: true },
  });

  if (!sender?.phone) {
    return NextResponse.json(
      { error: 'No phone number on file. Add your mobile number in Account Settings.' },
      { status: 400 }
    );
  }

  // 4. Send the message
  const result = await sendWhatsApp(
    sender.phone,
    templateKey as WhatsAppTemplateKey,
    templateParams || {}
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
