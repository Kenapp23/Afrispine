// Resend email integration
export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your_resend_api_key_here') {
    console.log('[email] Skipping - no Resend API key configured');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${process.env.EMAIL_FROM_NAME || 'AfriSpine'} <${process.env.FROM_EMAIL || 'noreply@afri-spine.com'}>`,
        to,
        subject,
        html: htmlBody,
      }),
    });
    const data = await res.json();
    if (res.ok) return true;
    console.error('[email] Resend error:', data);
    return false;
  } catch (e: any) {
    console.error('[email] Send failed:', e.message);
    return false;
  }
}

// Africa's Talking SMS integration
async function sendSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!apiKey || !username) {
    console.log('[sms] Skipping - no Africa\'s Talking credentials');
    return false;
  }
  try {
    const res = await fetch(`https://api.africastalking.com/version1/messaging`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username,
        to: phone.startsWith('+') ? phone : `+${phone}`,
        message,
        from: process.env.AT_SENDER_ID || 'AfriSpine',
      }),
    });
    const data = await res.json();
    if (res.ok) return true;
    console.error('[sms] Africa\'s Talking error:', data);
    return false;
  } catch (e: any) {
    console.error('[sms] Send failed:', e.message);
    return false;
  }
}

// Email templates
const emailTemplates: Record<string, (data: any) => { subject: string; html: string }> = {
  email_verified: (data) => ({
    subject: 'Verify your AfriSpine email',
    html: `<p>Hi ${data.name || 'there'},</p><p>Click the link below to verify your email address:</p><p><a href="${data.verifyUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
  }),
  payment_processing: (data) => ({
    subject: `Transfer confirmed – ${data.reference}`,
    html: `<p>Hi ${data.name},</p><p>Your transfer of ${data.amount} ${data.currency} to ${data.recipientName} is confirmed and being processed.</p><p><strong>Reference:</strong> ${data.reference}<br><strong>ETA:</strong> ${data.eta || '~30 minutes'}</p>`,
  }),
  delivered: (data) => ({
    subject: `${data.recipientName} received ${data.amount} ${data.currency}`,
    html: `<p>Great news!</p><p>${data.recipientName} has received <strong>${data.amount} ${data.currency}</strong>.</p><p>Reference: ${data.reference}</p>`,
  }),
  failed: (data) => ({
    subject: `Transfer ${data.reference} could not complete`,
    html: `<p>We couldn't complete your transfer of ${data.amount} ${data.currency}.</p><p>A full refund of ${data.usdAmount || 'the charged amount'} will reach your card in 5–10 business days.</p><p>Reason: ${data.reason || 'Unknown error'}</p>`,
  }),
  refund_processed: (data) => ({
    subject: `Refund confirmed – ${data.reference}`,
    html: `<p>Your refund of ${data.amount} has been processed to your original payment method.</p><p>Reference: ${data.reference}</p>`,
  }),
  kyc_approved: (data) => ({
    subject: 'Identity verified — You can now send money',
    html: `<p>Hi ${data.name},</p><p>Your identity has been verified successfully. You can now send money to your family in Africa.</p><p><a href="/" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;">Start Sending</a></p>`,
  }),
  kyc_rejected: (data) => ({
    subject: 'Identity verification could not be completed',
    html: `<p>Hi ${data.name},</p><p>We were unable to verify your identity. ${data.reason || 'Please try again with a different document.'}</p>`,
  }),
};

// SMS templates
const smsTemplates: Record<string, (data: any) => string> = {
  processing: (data) => `${data.senderName} is sending you ${data.amount} ${data.currency} via AfriSpine. Arrives soon. Ref: ${data.reference}`,
  delivered: (data) => `You received ${data.amount} ${data.currency} from ${data.senderName} via AfriSpine. Ref: ${data.reference}`,
};

export async function notifySender(email: string, name: string, trigger: string, data: Record<string, any> = {}): Promise<boolean> {
  const template = emailTemplates[trigger];
  if (!template) {
    console.warn(`[notify] No email template for trigger: ${trigger}`);
    return false;
  }
  const { subject, html } = template({ name, ...data });
  return sendEmail(email, subject, html);
}

export async function notifyRecipient(phone: string, name: string, trigger: string, data: Record<string, any> = {}): Promise<boolean> {
  const template = smsTemplates[trigger];
  if (!template) {
    console.warn(`[notify] No SMS template for trigger: ${trigger}`);
    return false;
  }
  const message = template({ recipientName: name, ...data });
  return sendSms(phone, message);
}

// Contact form email
export async function sendContactForm(data: { name: string; email: string; subject: string; message: string }): Promise<boolean> {
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
    <p><em>Submitted at ${new Date().toISOString()}</em></p>
  `;
  return sendEmail('support@afri-spine.com', `Contact Form: ${data.subject}`, html);
}