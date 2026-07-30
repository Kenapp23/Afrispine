/**
 * WhatsApp Business API integration for AfriSpine
 * Supports both Meta Business API and Twilio WhatsApp
 */

interface WhatsAppMessage {
  to: string;  // Phone number in international format (e.g., "+254712345678")
  templateName?: string;
  templateParams?: string[];
  body?: string;  // For non-template messages (only allowed in testing)
}

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Get the configured provider from env
function getProvider(): 'meta' | 'twilio' | 'mock' {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) return 'meta';
  return 'mock';  // Development mode
}

// Send via Meta WhatsApp Business API
async function sendViaMeta(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  
  const payload: any = {
    messaging_product: 'whatsapp',
    to: msg.to,
  };
  
  if (msg.templateName) {
    payload.type = 'template';
    payload.template = {
      name: msg.templateName,
      language: { code: 'en' },
      components: msg.templateParams ? [{
        type: 'body',
        parameters: msg.templateParams.map(p => ({ type: 'text', text: p })),
      }] : [],
    };
  } else if (msg.body) {
    payload.type = 'text';
    payload.text = { body: msg.body };
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true, messageId: data.messages?.[0]?.id };
}

// Send via Twilio WhatsApp
async function sendViaTwilio(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER!;
  
  const body = msg.templateParams 
    ? msg.templateParams.join(' | ') 
    : msg.body || '';
    
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioNumber,
        To: `whatsapp:${msg.to}`,
        Body: body,
      }),
    }
  );
  
  const data = await res.json();
  if (data.code) {
    return { success: false, error: data.message };
  }
  return { success: true, messageId: data.sid };
}

// Mock sender for development
async function sendMock(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  console.log('[WhatsApp Mock] Would send to:', msg.to);
  console.log('[WhatsApp Mock] Template:', msg.templateName);
  console.log('[WhatsApp Mock] Body:', msg.body);
  console.log('[WhatsApp Mock] Params:', msg.templateParams);
  return { success: true, messageId: `mock_${Date.now()}` };
}

// Main send function - routes to correct provider
export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const provider = getProvider();
  try {
    switch (provider) {
      case 'meta': return await sendViaMeta(msg);
      case 'twilio': return await sendViaTwilio(msg);
      default: return await sendMock(msg);
    }
  } catch (e: any) {
    console.error('[WhatsApp] Send failed:', e);
    return { success: false, error: e.message };
  }
}

// Pre-built message templates for AfriSpine

export function sendTransactionNotification(senderPhone: string, recipientPhone: string, data: {
  amountSent: string;
  currencySent: string;
  amountReceived: string;
  currencyReceived: string;
  recipientName: string;
  reference: string;
  deliveryMethod: string;
  deliveryMinutes?: number;
}) {
  // Sender notification
  sendWhatsAppMessage({
    to: senderPhone,
    body: `✅ AfriSpine: ${data.currencySent} ${data.amountSent} sent to ${data.recipientName} (${data.deliveryMethod}).\nRef: ${data.reference}.\nDelivered in ${data.deliveryMinutes || 14} min.`,
  });

  // Recipient notification
  if (recipientPhone) {
    sendWhatsAppMessage({
      to: recipientPhone,
      body: `💚 AfriSpine: Someone sent you ${data.currencyReceived} ${data.amountReceived} via ${data.deliveryMethod}.\nIt should arrive shortly. Ref: ${data.reference}`,
    });
  }
}

export function sendDangoteIpoAlert(phone: string, senderName: string) {
  return sendWhatsAppMessage({
    to: phone,
    body: `🔥 DANGOTE IPO IS NOW OPEN\n\n${senderName}, you registered your interest. Now invest in Africa's biggest-ever IPO.\n\nOpen AfriSpine to buy shares: https://afri-spine.com/wealth-buy`,
  });
}

export function sendChamaReminder(phone: string, data: {
  chamaName: string;
  dueDate: string;
  amount: string;
  currency: string;
  membersPaid: number;
  totalMembers: number;
  paymentLink: string;
}) {
  return sendWhatsAppMessage({
    to: phone,
    body: `📢 Diaspora Chama Reminder\n\n${data.chamaName} contribution due: ${data.dueDate}\nYour amount: ${data.currency} ${data.amount}\nPaid this month: ${data.membersPaid}/${data.totalMembers} members\n\n[Pay now] ${data.paymentLink}`,
  });
}

export function sendReEngagement(phone: string, senderName: string, country: string, daysDormant: number) {
  if (daysDormant >= 60) {
    return sendWhatsAppMessage({
      to: phone,
      body: `We miss you, ${senderName}! 🌍\n\nWhile you've been away, markets moved:\nSCOM +8.2% | GTCO +12% | MTN +6%\n\nYour family in ${country} misses you too. Send something home today.\n\nhttps://afri-spine.com/send`,
    });
  }
  return sendWhatsAppMessage({
    to: phone,
    body: `We miss you, ${senderName}! 🌍\n\nYour family in ${country} misses you too. Send something home today.\n\nhttps://afri-spine.com/send`,
  });
}

// Track growth events
export async function trackGrowthEvent(db: any, eventType: string, senderId?: string, metadata: Record<string, any> = {}) {
  try {
    await db.growthEvent.create({
      data: {
        senderId: senderId || null,
        eventType,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (e) {
    console.error('[GrowthEvent] Failed to track:', e);
  }
}

// Generate and validate referral codes
export function generateReferralCode(firstName: string, id: string): string {
  const clean = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const suffix = id.slice(-4).toUpperCase();
  return `${clean}${suffix}`;
}