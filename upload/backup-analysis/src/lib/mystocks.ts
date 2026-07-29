// mystocks.africa Partner API Client
// All calls server-side only — API key never reaches the browser

const MYSTOCKS_API_URL = process.env.MYSTOCKS_API_URL || 'https://mystocks.africa/api/sandbox/v1';
const MYSTOCKS_API_KEY = process.env.MYSTOCKS_API_KEY || '';

const headers = () => ({
  'Authorization': `Bearer ${MYSTOCKS_API_KEY}`,
  'Content-Type': 'application/json',
});

// Create user sub-account
export async function createSubAccount(params: { externalId: string; displayName: string; email: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/partner/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks createSubAccount failed: ${res.status} ${text}`);
  }
  return res.json(); // { subAccountId, externalId }
}

// Assert KYC (tells mystocks AfriSpine verified this user)
export async function assertKyc(subAccountId: string, params: { status: string; provider: string; verifiedAt: string; documentType: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/kyc`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks assertKyc failed: ${res.status} ${text}`);
  }
  return res.json(); // { kycStatus: 'approved' }
}

// Deposit funds into sub-account
export async function depositFunds(subAccountId: string, params: { amount: number; currency: string; reference: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/deposit`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks depositFunds failed: ${res.status} ${text}`);
  }
  return res.json(); // { depositId, newBalance, status }
}

// Get live stock quote
export async function getQuote(exchange: string, ticker: string) {
  const res = await fetch(`${MYSTOCKS_API_URL}/markets/${exchange}/quotes/${ticker}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getQuote failed: ${res.status} ${text}`);
  }
  return res.json(); // { ticker, price, currency, change, change_pct, volume, bid, ask, updatedAt }
}

// Place buy/sell order
export async function placeOrder(subAccountId: string, params: { type: 'BUY' | 'SELL'; symbol: string; quantity: number; orderType: string; limitPrice: number | null; reference: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks placeOrder failed: ${res.status} ${text}`);
  }
  return res.json(); // { orderId, status, filledQuantity, filledPrice, fee, totalAmount }
}

// Get user portfolio
export async function getPortfolio(subAccountId: string) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/portfolio`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getPortfolio failed: ${res.status} ${text}`);
  }
  return res.json(); // { totalValueUsd, cashBalanceUsd, holdings: [...] }
}

// Get order history
export async function getOrderHistory(subAccountId: string, params?: { status?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/orders?${query.toString()}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getOrderHistory failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Get dividend calendar
export async function getDividendCalendar() {
  const res = await fetch(`${MYSTOCKS_API_URL}/dividends/calendar`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getDividendCalendar failed: ${res.status} ${text}`);
  }
  return res.json(); // [{ symbol, exchange, amount, currency, exDate, payDate, partnerEligible }]
}

// Subscribe to bond/fund/pre-IPO
export async function subscribe(subAccountId: string, params: { opportunityId: string; amount: number; currency: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/subscribe`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks subscribe failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Get available bonds
export async function getBonds() {
  const res = await fetch(`${MYSTOCKS_API_URL}/bonds`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getBonds failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Get available funds
export async function getFunds() {
  const res = await fetch(`${MYSTOCKS_API_URL}/funds`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getFunds failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Get available opportunities (pre-IPO, private credit)
export async function getOpportunities() {
  const res = await fetch(`${MYSTOCKS_API_URL}/opportunities`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks getOpportunities failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Withdraw from sub-account
export async function withdraw(subAccountId: string, params: { amount: number; currency: string; reference: string }) {
  const res = await fetch(`${MYSTOCKS_API_URL}/users/${subAccountId}/withdraw`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mystocks withdraw failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}

// Check if mystocks is configured (has API key)
export function isConfigured(): boolean {
  return !!MYSTOCKS_API_KEY && MYSTOCKS_API_KEY.startsWith('sk_');
}