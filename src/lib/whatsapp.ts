import twilio from 'twilio';
import { db } from '@/lib/db';

// ─── Credential helpers (no hardcoded fallbacks) ───────────────

function getTwilioCredentials() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

function getTwilioClient() {
  const creds = getTwilioCredentials();
  if (!creds) return null;
  return twilio(creds.sid, creds.token);
}

// ─── Message Templates ─────────────────────────────────────────
// Each template is a plain-text string. For production, these must
// be registered as pre-approved templates in your Twilio Console
// (Messaging > Senders > WhatsApp Senders > Templates).

export const WHATSAPP_TEMPLATES = {
  transaction_confirmation: (params: {
    name: string;
    amount: string;
    currency: string;
    recipientName: string;
    reference: string;
  }) =>
    'Hello ' + params.name + '! Your AfriSpine transfer of ' + params.amount + ' ' + params.currency + ' to ' + params.recipientName + ' has been submitted successfully.\n\nReference: ' + params.reference + '\n\nTrack your transfer at https://www.afri-spine.com',

  welcome: (params: { name: string }) =>
    'Welcome to AfriSpine, ' + params.name + '! You can now send money and gift cards to Africa at great rates. Your referral code is ready - share it with friends and earn rewards!\n\nhttps://www.afri-spine.com',

  referral_notification: (params: {
    referrerName: string;
    newUserName: string;
  }) =>
    'Great news, ' + params.referrerName + '! Someone you referred just signed up on AfriSpine. Keep sharing your link to earn more rewards.\n\nhttps://www.afri-spine.com',

  ipo_confirmation: (params: { name: string; ipoName: string }) =>
    'Hi ' + params.name + ', you are confirmed on the waitlist for the ' + params.ipoName + ' IPO through AfriSpine! We will notify you when subscription opens.\n\nhttps://www.afri-spine.com',

  gift_card_notification: (params: {
    name: string;
    brand: string;
    amount: string;
    currency: string;
    recipientName: string;
  }) =>
    'Hello ' + params.name + '! Your ' + params.brand + ' gift card worth ' + params.amount + ' ' + params.currency + ' for ' + params.recipientName + ' has been purchased successfully on AfriSpine.\n\nhttps://www.afri-spine.com',
} as const;

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES;

// ─── Opt-in / Opt-out helpers ──────────────────────────────────

export async function isOptedIn(phone: string): Promise<boolean> {
  const record = await db.whatsAppOptIn.findFirst({
    where: { phone: phone.replace(/[^0-9+]/g, '') },
  });
  // If no record exists, treat as opted in (opt-out is explicit)
  if (!record) return true;
  return record.isActive;
}

export async function optOut(phone: string): Promise<void> {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const existing = await db.whatsAppOptIn.findFirst({ where: { phone: cleanPhone } });
  if (existing) {
    await db.whatsAppOptIn.update({ where: { id: existing.id }, data: { isActive: false } });
  } else {
    await db.whatsAppOptIn.create({ data: { phone: cleanPhone, isActive: false } });
  }
}

export async function optIn(phone: string, senderId?: string): Promise<void> {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const existing = await db.whatsAppOptIn.findFirst({ where: { phone: cleanPhone } });
  if (existing) {
    await db.whatsAppOptIn.update({ where: { id: existing.id }, data: { isActive: true, ...(senderId ? { senderId } : {}) } });
  } else {
    await db.whatsAppOptIn.create({ data: { phone: cleanPhone, senderId, isActive: true } });
  }
}

// ─── Send WhatsApp message ─────────────────────────────────────

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsApp(
  toPhone: string,
  templateKey: WhatsAppTemplateKey,
  templateParams: Record<string, string>,
  options?: { skipOptInCheck?: boolean }
): Promise<SendWhatsAppResult> {
  const client = getTwilioClient();
  const creds = getTwilioCredentials();
  if (!client || !creds) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  // Clean phone number
  const cleanPhone = toPhone.replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  // Check opt-in status (unless explicitly skipped)
  if (!options?.skipOptInCheck) {
    try {
      const optedIn = await isOptedIn(cleanPhone);
      if (!optedIn) {
        return { success: false, error: 'Recipient has opted out of WhatsApp messages' };
      }
    } catch {
      // If DB check fails, don't block the send
    }
  }

  // Build message from template
  const templateFn = WHATSAPP_TEMPLATES[templateKey];
  const body = templateFn(templateParams as any);

  try {
    const message = await client.messages.create({
      body,
      from: `whatsapp:${creds.from}`,
      to: `whatsapp:${cleanPhone}`,
    });
    return { success: true, messageId: message.sid };
  } catch (err: any) {
    const errMsg = err?.message || 'Unknown Twilio error';
    console.error(`[WhatsApp] Failed to send ${templateKey} to ${cleanPhone}:`, errMsg);
    return { success: false, error: errMsg };
  }
}

// ─── Fire-and-forget wrapper (for non-critical notifications) ──
// Use this inside API routes when you don't want to block the response

export function sendWhatsAppAsync(
  toPhone: string,
  templateKey: WhatsAppTemplateKey,
  templateParams: Record<string, string>
): void {
  // Fire and forget — don't await, don't block the caller
  sendWhatsApp(toPhone, templateKey, templateParams).catch(() => {
    // Silently swallow errors for async fire-and-forget
  });
}
