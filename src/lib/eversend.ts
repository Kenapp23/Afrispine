/**
 * Eversend API Client
 *
 * Handles authentication, collections (charging the sender),
 * payouts (paying the recipient), beneficiaries, and webhook verification.
 *
 * Base URLs:
 *   Sandbox: https://sandbox.eversend.co
 *   Live:    https://api.eversend.co
 *
 * Auth: OAuth2 client_credentials grant with clientId/clientSecret.
 *   POST /v1/auth/token → { access_token, expires_in }
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────

export interface EversendConfig {
  clientId: string;
  clientSecret: string;
  /** Override base URL. Defaults to sandbox. */
  baseUrl?: string;
  webhookSecret?: string;
}

export interface EversendToken {
  accessToken: string;
  expiresAt: number; // Unix ms
}

export interface EversendCollectionRequest {
  amount: number;
  currency: string; // ISO 4217 e.g. "USD", "GBP"
  method: 'card' | 'bank_transfer' | 'stablecoin';
  /** Sender phone number (E.164) — required for mobile money methods */
  phone?: string;
  /** Sender email — used for card payment receipts */
  email?: string;
  /** Optional 3-letter ISO country code for routing */
  country?: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
  /** Idempotency key — prevents double-charges */
  idempotencyKey?: string;
}

export interface EversendCollectionResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  method: string;
  createdAt: string;
  /** For card payments, a hosted checkout URL */
  checkoutUrl?: string;
  /** Reference for reconciliation */
  reference?: string;
}

export interface EversendPayoutRequest {
  amount: number;
  currency: string; // Recipient currency e.g. "KES", "NGN", "GHS"
  /** Payout rail: mpesa, airtel_money, mtn_momo, bank_transfer */
  rail: string;
  /** Recipient phone (E.164) — for mobile money rails */
  phone?: string;
  /** Recipient bank code — for bank_transfer rail */
  bankCode?: string;
  /** Recipient account number — for bank_transfer rail */
  accountNumber?: string;
  /** Recipient account name — for bank_transfer rail */
  accountName?: string;
  /** Pre-created beneficiary ID */
  beneficiaryId?: string;
  /** How to fund the payout (default: stablecoin) */
  fund?: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
  /** Idempotency key */
  idempotencyKey?: string;
}

export interface EversendPayoutResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  rail: string;
  fundedBy: string;
  createdAt: string;
  reference?: string;
}

export interface EversendPayoutQuotationRequest {
  amount: number;
  currency: string; // Recipient currency
  rail: string;
  country?: string;
}

export interface EversendPayoutQuotationResponse {
  id: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  rate: number;
  fee: number;
  feeCurrency: string;
}

export interface EversendBeneficiaryRequest {
  name: string;
  type: 'mobile_money' | 'bank';
  country: string; // ISO 3166-1 alpha-2 e.g. "KE", "NG"
  phone?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  metadata?: Record<string, string>;
}

export interface EversendBeneficiary {
  id: string;
  name: string;
  type: string;
  country: string;
  phone?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface EversendWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
}

// ─── Client ────────────────────────────────────────────────────────────

// In-memory token cache (survives hot reloads in dev)
let tokenCache: {
  configHash: string;
  token: EversendToken;
} | null = null;

function configHash(config: EversendConfig): string {
  return `${config.clientId.slice(0, 8)}|${config.baseUrl || 'default'}`;
}

export class EversendClient {
  private config: EversendConfig;
  private baseUrl: string;

  constructor(config: EversendConfig) {
    this.config = config;
    this.baseUrl = (config.baseUrl || 'https://sandbox.eversend.co').replace(/\/+$/, '');
  }

  // ─── Auth ───────────────────────────────────────────────────────

  /**
   * Exchange clientId/clientSecret for a bearer token.
   * Tokens are cached in-memory and auto-refreshed when expired.
   */
  async authenticate(): Promise<EversendToken> {
    const hash = configHash(this.config);

    // Return cached token if still valid (with 60s buffer)
    if (tokenCache && tokenCache.configHash === hash && tokenCache.token.expiresAt > Date.now() + 60_000) {
      return tokenCache.token;
    }

    const res = await fetch(`${this.baseUrl}/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new EversendError(`Authentication failed (${res.status}): ${body}`, res.status);
    }

    const data = await res.json();
    const expiresIn = data.expires_in || 3600;
    const token: EversendToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    tokenCache = { configHash: hash, token };
    return token;
  }

  /** Get Authorization header value */
  private async authHeader(): Promise<string> {
    const token = await this.authenticate();
    return `Bearer ${token.accessToken}`;
  }

  // ─── Collections (charging the sender) ────────────────────────────

  /**
   * Initiate a collection — charge the sender's card or bank account.
   * Returns a collection object, potentially with a checkoutUrl for card flows.
   */
  async createCollection(req: EversendCollectionRequest): Promise<EversendCollectionResponse> {
    const auth = await this.authHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: auth,
    };
    if (req.idempotencyKey) headers['Idempotency-Key'] = req.idempotencyKey;

    const body: Record<string, unknown> = {
      amount: req.amount,
      currency: req.currency,
      method: req.method,
    };
    if (req.phone) body.phone = req.phone;
    if (req.email) body.email = req.email;
    if (req.country) body.country = req.country;
    if (req.metadata) body.metadata = req.metadata;

    const res = await fetch(`${this.baseUrl}/v1/collections`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Collection failed (${res.status}): ${errBody}`, res.status);
    }

    return res.json();
  }

  /** Get collection status by ID */
  async getCollection(id: string): Promise<EversendCollectionResponse> {
    const auth = await this.authHeader();
    const res = await fetch(`${this.baseUrl}/v1/collections/${id}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Get collection failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  // ─── Payouts (paying the recipient) ───────────────────────────────

  /**
   * Get a quote for a payout — tells you the exact amount and fee.
   */
  async getPayoutQuotation(req: EversendPayoutQuotationRequest): Promise<EversendPayoutQuotationResponse> {
    const auth = await this.authHeader();
    const body: Record<string, unknown> = {
      amount: req.amount,
      currency: req.currency,
      rail: req.rail,
    };
    if (req.country) body.country = req.country;

    const res = await fetch(`${this.baseUrl}/v1/payouts/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Payout quotation failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  /**
   * Create a payout — deliver funds to the recipient via mobile money or bank.
   * If no beneficiaryId is provided, one may be created automatically.
   */
  async createPayout(req: EversendPayoutRequest): Promise<EversendPayoutResponse> {
    const auth = await this.authHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: auth,
    };
    if (req.idempotencyKey) headers['Idempotency-Key'] = req.idempotencyKey;

    const body: Record<string, unknown> = {
      amount: req.amount,
      currency: req.currency,
      rail: req.rail,
    };
    if (req.phone) body.phone = req.phone;
    if (req.bankCode) body.bank_code = req.bankCode;
    if (req.accountNumber) body.account_number = req.accountNumber;
    if (req.accountName) body.account_name = req.accountName;
    if (req.beneficiaryId) body.beneficiary_id = req.beneficiaryId;
    if (req.fund) body.fund = req.fund;
    if (req.metadata) body.metadata = req.metadata;

    const res = await fetch(`${this.baseUrl}/v1/payouts`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Payout failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  /** Get payout status by ID */
  async getPayout(id: string): Promise<EversendPayoutResponse> {
    const auth = await this.authHeader();
    const res = await fetch(`${this.baseUrl}/v1/payouts/${id}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Get payout failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  // ─── Beneficiaries ───────────────────────────────────────────────

  /**
   * Create a beneficiary — required for some payout rails.
   */
  async createBeneficiary(req: EversendBeneficiaryRequest): Promise<EversendBeneficiary> {
    const auth = await this.authHeader();
    const body: Record<string, unknown> = {
      name: req.name,
      type: req.type,
      country: req.country,
    };
    if (req.phone) body.phone = req.phone;
    if (req.bankCode) body.bank_code = req.bankCode;
    if (req.accountNumber) body.account_number = req.accountNumber;
    if (req.accountName) body.account_name = req.accountName;
    if (req.metadata) body.metadata = req.metadata;

    const res = await fetch(`${this.baseUrl}/v1/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`Create beneficiary failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  /** List beneficiaries */
  async listBeneficiaries(params?: { country?: string; type?: string; page?: number; limit?: number }): Promise<{ data: EversendBeneficiary[] }> {
    const auth = await this.authHeader();
    const query = new URLSearchParams();
    if (params?.country) query.set('country', params.country);
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${this.baseUrl}/v1/beneficiaries${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new EversendError(`List beneficiaries failed (${res.status}): ${errBody}`, res.status);
    }
    return res.json();
  }

  // ─── Webhook Verification ────────────────────────────────────────

  /**
   * Verify an incoming webhook signature.
   * Eversend sends an `eversend-signature` header containing the HMAC-SHA256
   * hex digest of the raw request body, keyed by the webhook secret.
   *
   * @param rawBody - The raw request body as a string/buffer (NOT parsed JSON)
   * @param signature - Value of the `eversend-signature` header
   * @returns true if the signature is valid
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = this.config.webhookSecret;
    if (!secret) {
      console.warn('[Eversend] Webhook secret not configured — skipping signature verification');
      return true; // Allow through in dev without secret
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    // Constant-time comparison to prevent timing attacks
    try {
      return timingSafeEqualStr(expected, signature);
    } catch {
      return false;
    }
  }

  /**
   * Parse and verify a webhook request. Returns the typed payload or throws.
   */
  parseWebhook(rawBody: string, signature: string): EversendWebhookPayload {
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new EversendError('Invalid webhook signature', 401);
    }
    return JSON.parse(rawBody) as EversendWebhookPayload;
  }

  // ─── Factory ─────────────────────────────────────────────────────

  /**
   * Create an EversendClient from PlatformSetting keys in the database.
   * This is the primary way to instantiate the client in API routes.
   */
  static async fromSettings(): Promise<EversendClient | null> {
    const { db, dbReady } = await import('@/lib/db');

    // Try partner config first, then fall back to PlatformSetting
    let clientId = '';
    let clientSecret = '';
    let webhookSecret = '';
    let baseUrl = '';

    if (dbReady) {
      try {
        const partner = await db.partnerConfig.findUnique({ where: { partnerId: 'eversend' } });
        if (partner?.configJson) {
          try {
            const parsed = JSON.parse(partner.configJson);
            clientId = parsed.clientId || '';
            clientSecret = parsed.clientSecret || '';
            webhookSecret = parsed.webhookSecret || '';
          } catch {
            // ignore parse errors
          }
        }
      } catch {
        // DB query failed — fall through to PlatformSetting
      }

      if (!clientId) {
        const setting = (key: string) =>
          db.platformSetting.findUnique({ where: { key } }).then((r) => r?.value || '');

        clientId = await setting('eversend_client_id');
        clientSecret = await setting('eversend_client_secret');
        webhookSecret = await setting('eversend_webhook_secret');
        baseUrl = await setting('eversend_base_url');
      }
    }

    // Detect sandbox vs live from client ID
    if (!baseUrl) {
      baseUrl = clientId.includes('live') ? 'https://api.eversend.co' : 'https://sandbox.eversend.co';
    }

    if (!clientId || !clientSecret) return null;

    return new EversendClient({ clientId, clientSecret, webhookSecret, baseUrl });
  }
}

// ─── Error ──────────────────────────────────────────────────────────

export class EversendError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'EversendError';
    this.status = status;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Constant-time string comparison (prevents timing attacks on HMAC) */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return timingSafeEqual(bufA, bufB);
}

/** Map AfriSpine rail IDs to Eversend rail identifiers */
export const RAIL_MAP: Record<string, string> = {
  mpesa: 'mpesa',
  airtel_money: 'airtel_money',
  momo_mtn: 'mtn_momo',
  mtn_momo: 'mtn_momo',
  bank_ke: 'bank_transfer',
  bank_ng: 'bank_transfer',
  bank_gh: 'bank_transfer',
  bank_ug: 'bank_transfer',
  bank_za: 'bank_transfer',
  eft_za: 'bank_transfer',
  opay: 'bank_transfer',
  palm_pay: 'bank_transfer',
  ozow: 'bank_transfer',
  payfast: 'bank_transfer',
};

/** Map AfriSpine currency to Eversend collection currency */
export const SENDER_CURRENCY_MAP: Record<string, string> = {
  GBP: 'GBP',
  USD: 'USD',
  EUR: 'EUR',
};

/** Map destination country code to currency */
export const COUNTRY_CURRENCY: Record<string, string> = {
  KE: 'KES',
  NG: 'NGN',
  GH: 'GHS',
  UG: 'UGX',
  TZ: 'TZS',
  RW: 'RWF',
  ZA: 'ZAR',
  CI: 'XOF',
  BF: 'XOF',
  CM: 'XAF',
  SN: 'XOF',
  ZM: 'ZMW',
};
