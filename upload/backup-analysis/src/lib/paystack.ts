import crypto from 'crypto';

export function getSecretKey(): string {
  return process.env.PAYSTACK_SECRET_KEY || '';
}

function getPublicKey(): string {
  return process.env.PAYSTACK_PUBLIC_KEY || '';
}

export function getPaystackPublicKey(): string {
  return getPublicKey();
}

/**
 * Initialize a Paystack transaction — server-side only.
 * Returns the access_code for the frontend popup.
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in GBP, will be converted to kobo/pence (cents)
  reference: string;
  metadata?: Record<string, any>;
}): Promise<{ access_code: string; reference: string }> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Paystack secret key not configured');

  const amountInCents = Math.round(params.amount * 100);

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInCents,
      reference: params.reference,
      metadata: params.metadata || {},
      channels: ['card', 'bank_transfer'],
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || 'Paystack initialization failed');
  }

  return {
    access_code: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  id: number;
  fees: number;
  channel: string;
  paidAt: string;
  metadata: Record<string, any>;
}> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Paystack secret key not configured');

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      'Authorization': `Bearer ${secretKey}`,
    },
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || 'Verification failed');
  }

  const d = data.data;
  return {
    status: d.status, // 'success' | 'failed' | 'abandoned'
    amount: d.amount, // in kobo/pence
    id: d.id,
    fees: d.fees || 0,
    channel: d.channel,
    paidAt: d.paid_at,
    metadata: d.metadata || {},
  };
}

/**
 * Verify Paystack webhook signature using HMAC-SHA512.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secretKey = getSecretKey();
  if (!secretKey) return false;
  const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex');
  return hash === signature;
}

/**
 * Refund a Paystack transaction.
 */
export async function refundTransaction(transactionId: number, amount?: number): Promise<{
  status: boolean;
  message: string;
  refundId?: number;
}> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Paystack secret key not configured');

  const body: Record<string, any> = { transaction: transactionId };
  if (amount) body.amount = amount;

  const res = await fetch('https://api.paystack.co/refund', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.status) {
    return { status: true, message: 'Refund initiated', refundId: data.data?.id };
  }
  return { status: false, message: data.message || 'Refund failed' };
}

/**
 * Charge a saved authorization (for recurring sends).
 */
export async function chargeAuthorization(params: {
  authorization_code: string;
  email: string;
  amount: number; // in GBP
  reference: string;
}): Promise<{
  status: boolean;
  reference: string;
  message: string;
}> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Paystack secret key not configured');

  const res = await fetch('https://api.paystack.co/transaction/charge_authorization', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorization_code: params.authorization_code,
      email: params.email,
      amount: Math.round(params.amount * 100),
      reference: params.reference,
    }),
  });

  const data = await res.json();
  return {
    status: data.status,
    reference: data.data?.reference || params.reference,
    message: data.message || 'Charge initiated',
  };
}

/**
 * Create a Paystack subscription (for Pro plan).
 */
export async function createSubscription(params: {
  email: string;
  plan: string; // Paystack plan code
  authorization_code: string;
}): Promise<{
  status: boolean;
  subscriptionCode: string;
  message: string;
}> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Paystack secret key not configured');

  const res = await fetch('https://api.paystack.co/subscription', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: params.email,
      plan: params.plan,
      authorization: params.authorization_code,
    }),
  });

  const data = await res.json();
  return {
    status: data.status,
    subscriptionCode: data.data?.subscription_code || '',
    message: data.message || 'Subscription created',
  };
}

/**
 * Validate Paystack keys by making a test API call.
 */
export async function validateKeys(secretKey: string, publicKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.paystack.co/merchant', {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    const data = await res.json();
    if (data.status) {
      return { valid: true };
    }
    return { valid: false, error: data.message || 'Invalid secret key' };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Connection failed' };
  }
}

/**
 * Check if Paystack is connected (for admin settings).
 */
export async function checkConnection(): Promise<{ connected: boolean; businessName?: string; merchantId?: string }> {
  const secretKey = getSecretKey();
  if (!secretKey) return { connected: false };

  try {
    const res = await fetch('https://api.paystack.co/merchant', {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    const data = await res.json();
    if (data.status) {
      return {
        connected: true,
        businessName: data.data?.business_name,
        merchantId: data.data?.merchant_id,
      };
    }
    return { connected: false };
  } catch {
    return { connected: false };
  }
}