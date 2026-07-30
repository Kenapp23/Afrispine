import * as crypto from 'node:crypto';
import {
  fetchWithContentTypeGuard,
  errorResult,
  healthyResult,
  ApiError,
  ContentTypeGuardError,
} from './http-helpers';
import type { EndpointCheck } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.eversend.co',
  production: 'https://api.eversend.co',
};

// ---------------------------------------------------------------------------
// Token Management (OAuth2 Client Credentials)
// ---------------------------------------------------------------------------

interface TokenEntry {
  accessToken: string;
  expiresAt: number; // Unix ms
}

/** Module-level token cache keyed by (clientId + environment) */
const tokenCache = new Map<string, TokenEntry>();

/**
 * Obtain an OAuth2 access token via client-credentials flow.
 * POST {baseUrl}/v1/auth/token with client_id + client_secret as JSON body.
 * Caches the token in memory and refreshes automatically 60 s before expiry.
 */
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  environment: 'sandbox' | 'production',
  baseUrl?: string,
): Promise<string> {
  const resolvedBaseUrl = baseUrl ?? BASE_URLS[environment] ?? BASE_URLS.sandbox;
  const cacheKey = `${clientId}::${environment}`;
  const cached = tokenCache.get(cacheKey);

  // Return cached token if still valid (with 60 s buffer before expiry)
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.accessToken;
  }

  // Fetch a new token
  const response = await fetchWithContentTypeGuard(`${resolvedBaseUrl}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    accessToken?: string;
    expiresIn?: number;
  };

  const accessToken = data.access_token ?? data.accessToken;
  if (!accessToken) {
    throw new ApiError(response.status, 'Eversend token response missing access_token');
  }

  const expiresInMs = (data.expires_in ?? data.expiresIn ?? 3600) * 1000;
  tokenCache.set(cacheKey, {
    accessToken,
    expiresAt: Date.now() + expiresInMs,
  });

  return accessToken;
}

// ---------------------------------------------------------------------------
// Internal authenticated fetch helpers
// ---------------------------------------------------------------------------

async function eversendPost(
  baseUrl: string,
  token: string,
  path: string,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const response = await fetchWithContentTypeGuard(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function eversendGet(
  baseUrl: string,
  token: string,
  path: string,
): Promise<unknown> {
  const response = await fetchWithContentTypeGuard(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.json();
}

// ---------------------------------------------------------------------------
// Health Checks
// ---------------------------------------------------------------------------

async function checkEversendEndpoint(
  baseUrl: string,
  token: string,
  name: string,
  path: string,
): Promise<EndpointCheck> {
  const start = Date.now();
  try {
    const url = `${baseUrl}${path}`;
    const response = await fetchWithContentTypeGuard(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      method: 'GET',
    });
    const latencyMs = Date.now() - start;
    return { name, result: healthyResult(latencyMs, `${name}: OK (${response.status})`) };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof ContentTypeGuardError) {
      return { name, result: { status: 'error' as const, latencyMs, message: err.message } };
    }
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        return {
          name,
          result: { status: 'error' as const, latencyMs, message: `${name}: Auth failed (${err.status}). Check API key.` },
        };
      }
      return { name, result: errorResult('unhealthy', `${name}: ${err.message}`, latencyMs) };
    }
    return { name, result: errorResult('error', `${name}: ${(err as Error).message}`, latencyMs) };
  }
}

/**
 * Run health checks against the five core Eversend endpoints.
 *
 * @param apiKey       Eversend client_id
 * @param clientSecret Eversend client_secret
 * @param environment  'sandbox' | 'production'
 * @param baseUrl      Optional override (from credentials)
 */
export async function checkEversendHealth(
  apiKey: string,
  clientSecret: string,
  environment: 'sandbox' | 'production',
  baseUrl?: string,
): Promise<EndpointCheck[]> {
  const resolvedBaseUrl = baseUrl ?? BASE_URLS[environment] ?? BASE_URLS.sandbox;

  // First obtain a token — this doubles as the "Authentication" check
  const startAuth = Date.now();
  let token: string;
  const authCheck: EndpointCheck = {
    name: 'Authentication',
    result: errorResult('error', 'Authentication: not attempted', 0),
  };

  try {
    token = await getAccessToken(apiKey, clientSecret, environment, resolvedBaseUrl);
    const latencyMs = Date.now() - startAuth;
    authCheck.result = healthyResult(latencyMs, 'Authentication: OK (token obtained)');
  } catch (err) {
    const latencyMs = Date.now() - startAuth;
    if (err instanceof ApiError) {
      authCheck.result = errorResult('error', `Authentication: ${err.message}`, latencyMs);
    } else if (err instanceof ContentTypeGuardError) {
      authCheck.result = { status: 'error' as const, latencyMs, message: err.message };
    } else {
      authCheck.result = errorResult('error', `Authentication: ${(err as Error).message}`, latencyMs);
    }
    // Without a token we cannot check the remaining endpoints
    return [authCheck];
  }

  const endpointChecks = [
    { name: 'KYC', path: '/v1/kyc/requirements' },
    { name: 'Collections', path: '/v1/collections/fees?country=KE&currency=KES' },
    { name: 'Payouts', path: '/v1/payouts/fees?country=KE&currency=KES' },
    { name: 'Exchange Rates', path: '/v1/rates?from=USD&to=KES' },
  ];

  const results = await Promise.allSettled(
    endpointChecks.map((c) => checkEversendEndpoint(resolvedBaseUrl, token, c.name, c.path)),
  );

  const endpointResults = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      name: endpointChecks[i].name,
      result: errorResult('error', `${endpointChecks[i].name}: ${(r.reason as Error).message}`),
    };
  });

  return [authCheck, ...endpointResults];
}

// ---------------------------------------------------------------------------
// Collections API
// ---------------------------------------------------------------------------

export interface MobileMoneyCollectionParams {
  phone: string;
  amount: number;
  currency: string;
  country: string;
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl?: string;
}

export interface BankTransferCollectionParams {
  accountNumber: string;
  bankCode: string;
  amount: number;
  currency: string;
  country: string;
  callbackUrl: string;
  accountName: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl?: string;
}

/**
 * Initiate a mobile-money collection.
 * POST /v1/collections/mobile-money
 */
export async function createMobileMoneyCollection(
  params: MobileMoneyCollectionParams,
): Promise<unknown> {
  const baseUrl = params.baseUrl ?? BASE_URLS[params.environment] ?? BASE_URLS.sandbox;
  const token = await getAccessToken(params.clientId, params.clientSecret, params.environment, baseUrl);
  const { clientId: _c, clientSecret: _s, environment: _e, baseUrl: _b, ...body } = params;
  return eversendPost(baseUrl, token, '/v1/collections/mobile-money', body as Record<string, unknown>);
}

/**
 * Initiate a bank-transfer collection.
 * POST /v1/collections/bank-transfer
 */
export async function createBankTransferCollection(
  params: BankTransferCollectionParams,
): Promise<unknown> {
  const baseUrl = params.baseUrl ?? BASE_URLS[params.environment] ?? BASE_URLS.sandbox;
  const token = await getAccessToken(params.clientId, params.clientSecret, params.environment, baseUrl);
  const { clientId: _c, clientSecret: _s, environment: _e, baseUrl: _b, ...body } = params;
  return eversendPost(baseUrl, token, '/v1/collections/bank-transfer', body as Record<string, unknown>);
}

/**
 * Fetch the status of a collection.
 * POST /v1/collections/{id}
 */
export async function getCollectionStatus(
  collectionId: string,
  clientId: string,
  clientSecret: string,
  environment: 'sandbox' | 'production',
  baseUrl?: string,
): Promise<unknown> {
  const resolvedBaseUrl = baseUrl ?? BASE_URLS[environment] ?? BASE_URLS.sandbox;
  const token = await getAccessToken(clientId, clientSecret, environment, resolvedBaseUrl);
  const response = await fetchWithContentTypeGuard(`${resolvedBaseUrl}/v1/collections/${collectionId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.json();
}

// ---------------------------------------------------------------------------
// Payouts API
// ---------------------------------------------------------------------------

export interface CreatePayoutParams {
  payoutMethod: 'mobile-money' | 'bank-transfer';
  destination: string;
  amount: number;
  currency: string;
  country: string;
  callbackUrl: string;
  idempotencyKey: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl?: string;
}

/**
 * Create a payout (mobile-money or bank-transfer).
 * POST /v1/payouts/{payoutMethod}
 * Includes X-Idempotency-Key header.
 */
export async function createPayout(
  params: CreatePayoutParams,
): Promise<unknown> {
  const baseUrl = params.baseUrl ?? BASE_URLS[params.environment] ?? BASE_URLS.sandbox;
  const token = await getAccessToken(params.clientId, params.clientSecret, params.environment, baseUrl);
  const { clientId: _c, clientSecret: _s, environment: _e, baseUrl: _b, payoutMethod, ...body } = params;
  const path = `/v1/payouts/${payoutMethod}`;
  return eversendPost(
    baseUrl,
    token,
    path,
    body as Record<string, unknown>,
    { 'X-Idempotency-Key': params.idempotencyKey },
  );
}

/**
 * Fetch the status of a payout.
 * GET /v1/payouts/{id}
 */
export async function getPayoutStatus(
  payoutId: string,
  clientId: string,
  clientSecret: string,
  environment: 'sandbox' | 'production',
  baseUrl?: string,
): Promise<unknown> {
  const resolvedBaseUrl = baseUrl ?? BASE_URLS[environment] ?? BASE_URLS.sandbox;
  const token = await getAccessToken(clientId, clientSecret, environment, resolvedBaseUrl);
  return eversendGet(resolvedBaseUrl, token, `/v1/payouts/${payoutId}`);
}

// ---------------------------------------------------------------------------
// Webhook Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verify the X-Eversend-Signature header value against the raw payload body.
 *
 * Computes HMAC-SHA256 of the raw payload body using the webhook secret
 * and compares with the signature from the X-Eversend-Signature header.
 * Uses Node.js crypto module with timing-safe comparison.
 *
 * @param rawPayload    The raw string body of the incoming request
 * @param signature     The value from the X-Eversend-Signature header
 * @param webhookSecret The webhook signing secret configured in Eversend
 */
export function verifyWebhookSignature(
  rawPayload: string,
  signature: string,
  webhookSecret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawPayload, 'utf8')
    .digest('hex');
  try {
    const bufA = Buffer.from(expected, 'hex');
    const bufB = Buffer.from(signature, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Reconciliation Helpers
// ---------------------------------------------------------------------------

export interface LedgerEntry {
  id: string;
  type: 'collection' | 'payout';
  provider: 'eversend';
  amount: number;
  currency: string;
  country: string;
  status: string;
  reference: string;
  fees: number;
  createdAt: string;
  raw: Record<string, unknown>;
}

/**
 * Map an Eversend collection response to a standardised ledger entry.
 */
export function mapCollectionToLedger(eversendCollection: Record<string, unknown>): LedgerEntry {
  return {
    id: String(eversendCollection.id ?? ''),
    type: 'collection',
    provider: 'eversend',
    amount: Number(eversendCollection.amount ?? 0),
    currency: String(eversendCollection.currency ?? ''),
    country: String(eversendCollection.country ?? ''),
    status: String(eversendCollection.status ?? 'unknown'),
    reference: String(eversendCollection.reference ?? eversendCollection.id ?? ''),
    fees: Number(eversendCollection.fees ?? eversendCollection.fee ?? 0),
    createdAt: String(eversendCollection.createdAt ?? eversendCollection.created_at ?? new Date().toISOString()),
    raw: eversendCollection,
  };
}

/**
 * Map an Eversend payout response to a standardised ledger entry.
 */
export function mapPayoutToLedger(eversendPayout: Record<string, unknown>): LedgerEntry {
  return {
    id: String(eversendPayout.id ?? ''),
    type: 'payout',
    provider: 'eversend',
    amount: Number(eversendPayout.amount ?? 0),
    currency: String(eversendPayout.currency ?? ''),
    country: String(eversendPayout.country ?? ''),
    status: String(eversendPayout.status ?? 'unknown'),
    reference: String(eversendPayout.reference ?? eversendPayout.id ?? ''),
    fees: Number(eversendPayout.fees ?? eversendPayout.fee ?? 0),
    createdAt: String(eversendPayout.createdAt ?? eversendPayout.created_at ?? new Date().toISOString()),
    raw: eversendPayout,
  };
}
