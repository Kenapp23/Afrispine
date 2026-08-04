/* ------------------------------------------------------------------ */
/*  AfriSpine Daraja B2B — M-Pesa Business-to-Business Integration    */
/*  Supports Till (BuyGoods) & Paybill disbursements via Safaricom   */
/* ------------------------------------------------------------------ */

// ─── Environment ─────────────────────────────────────────────────
const DARAJA_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY ?? '';
const CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET ?? '';
const B2B_SHORTCODE = process.env.DARAJA_B2B_SHORTCODE ?? '';
const PASSKEY = process.env.DARAJA_PASSKEY ?? '';

// ─── Types ───────────────────────────────────────────────────────

/** Supported payout method types */
export type PayoutMethodType =
  | 'mpesa_till'
  | 'mpesa_paybill'
  | 'bank_ke'
  | 'bank_ng'
  | 'momo_mtn'
  | 'opay'
  | 'palm_pay'
  | 'bank_gh'
  | 'eft_za'
  | 'payfast'
  | 'ozow'
  | 'airtel_money'
  | 'bank_ug'
  | 'mpesa_tz'
  | 'tigo_pesa'
  | 'crdb_bank'
  | 'orange_money'
  | 'wave'
  | 'bank_sn';

/** A payout method attached to a merchant */
export interface PayoutMethod {
  id: string;                       // client-side UUID
  type: PayoutMethodType;
  country: string;                  // KE, NG, GH, UG, etc.
  isPrimary: boolean;
  verified: boolean;

  // M-Pesa Till
  tillNumber?: string;
  tillBusinessName?: string;

  // M-Pesa Paybill
  paybillNumber?: string;
  accountReference?: string;

  // Kenyan Bank
  bankNameKe?: string;
  accountNameKe?: string;
  accountNumberKe?: string;
  branchCodeKe?: string;

  // Nigerian Bank
  bankNameNg?: string;
  accountNumberNg?: string;
  accountNameNg?: string;

  // MTN MoMo
  momoNumber?: string;
  momoCountry?: string;

  // OPay (Nigeria)
  opayMerchantNumber?: string;

  // PalmPay (Nigeria)
  palmPayMerchantId?: string;

  // Ghana Bank
  bankNameGh?: string;
  accountNumberGh?: string;
  accountNameGh?: string;

  // South Africa EFT
  bankNameZa?: string;
  accountNumberZa?: string;
  accountNameZa?: string;
  branchCodeZa?: string;

  // PayFast
  payfastMerchantId?: string;
  payfastEmail?: string;

  // Ozow
  ozowBankId?: string;
  ozowAccountNumber?: string;
  ozowAccountName?: string;

  // Airtel Money
  airtelNumber?: string;

  // Uganda Bank
  bankNameUg?: string;
  accountNumberUg?: string;
  accountNameUg?: string;

  // M-Pesa Tanzania
  mpesaTzNumber?: string;
  mpesaTzBusinessName?: string;

  // Tigo Pesa
  tigoPesaNumber?: string;

  // CRDB Bank
  crdbAccountNumber?: string;
  crdbAccountName?: string;
  crdbBranchCode?: string;

  // Orange Money
  orangeMoneyNumber?: string;

  // Wave
  waveNumber?: string;
  waveBusinessName?: string;

  // Senegal Bank
  bankNameSn?: string;
  accountNumberSn?: string;
  accountNameSn?: string;
}

/** Daraja B2B transfer type enum */
export type DarajaB2BCommand =
  | 'BusinessBuyGoods'   // Till number disbursement
  | 'BusinessPayBill';   // Paybill disbursement

/** Parameters for initiating a B2B payment */
export interface DarajaB2BRequest {
  /** Amount to disburse in KES */
  amount: number;
  /** Recipient Till or Paybill number */
  recipientShortcode: string;
  /** M-Pesa account reference (e.g. invoice number) */
  accountReference: string;
  /** Command type: BusinessBuyGoods (Till) or BusinessPayBill (Paybill) */
  command: DarajaB2BCommand;
  /** Caller short code (your B2B shortcode) */
  initiatorShortcode?: string;
  /** Optional remarks for the transaction */
  remarks?: string;
  /** Unique conversation ID for idempotency */
  conversationId?: string;
  /** Originator conversation ID */
  originatorConversationId?: string;
}

/** Response from Daraja B2B API */
export interface DarajaB2BResponse {
  success: boolean;
  data?: {
    conversationId: string;
    originatorConversationId: string;
    responseCode: string;
    responseDescription: string;
  };
  error?: string;
}

/** Callback payload from Daraja B2B (sent to your callback URL) */
export interface DarajaB2BCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

/** OAuth token response */
interface DarajaTokenResponse {
  access_token: string;
  expires_in: number;
}

// ─── Token Cache ─────────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate an OAuth access token from Daraja API.
 * Results are cached in-memory until expiry.
 */
export async function generateDarajaToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
    'base64',
  );

  const res = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error');
    throw new Error(`Daraja token generation failed (${res.status}): ${text}`);
  }

  const data: DarajaTokenResponse = await res.json();

  if (!data.access_token) {
    throw new Error('Daraja returned empty access_token');
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// ─── Security Credential (Lipa Na M-Pesa Online) ─────────────────

/**
 * Generate the base64-encoded security credential.
 * Combines shortcode + passkey + timestamp.
 */
function generateSecurityCredential(timestamp: string): string {
  const raw = `${B2B_SHORTCODE}${PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

// ─── B2B Payment Initiation ───────────────────────────────────────

/**
 * Initiate a B2B payment to a Till or Paybill number via Daraja.
 *
 * Flow: generate token → build request → POST to /mpesa/b2b/v1/paymentrequest
 * Daraja sends an async callback to the configured URL.
 */
export async function initiateB2BPayment(
  params: DarajaB2BRequest,
): Promise<DarajaB2BResponse> {
  const token = await generateDarajaToken();

  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
  const securityCredential = generateSecurityCredential(timestamp);

  const conversationId =
    params.conversationId ?? `ASPB2B_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const originatorConversationId =
    params.originatorConversationId ?? `ORIG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const body = {
    Initiator: 'apitest',  // Typically configured in Daraja portal
    SecurityCredential: securityCredential,
    CommandID: params.command,
    Amount: params.amount,
    PartyA: params.initiatorShortcode ?? B2B_SHORTCODE,
    PartyB: params.recipientShortcode,
    Remarks: params.remarks ?? `AfriSpine B2B ${params.command} payout`,
    QueueTimeOutURL: `${process.env.APP_URL ?? 'https://afrispine.com'}/api/daraja/b2b/timeout`,
    ResultURL: `${process.env.APP_URL ?? 'https://afrispine.com'}/api/daraja/b2b/result`,
    AccountReference: params.accountReference,
    ConversationID: conversationId,
    OriginatorConversationID: originatorConversationId,
  };

  const res = await fetch(`${DARAJA_BASE_URL}/mpesa/b2b/v1/paymentrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  // Daraja responds with { ConversationID, OriginatorConversationID, ResponseCode, ResponseDescription }
  if (res.ok && data.ResponseCode === '0') {
    return {
      success: true,
      data: {
        conversationId: data.ConversationID ?? conversationId,
        originatorConversationId: data.OriginatorConversationID ?? originatorConversationId,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
      },
    };
  }

  return {
    success: false,
    error: data.ResponseDescription ?? `Daraja B2B error: ${res.status}`,
    data: {
      conversationId: data.ConversationID ?? conversationId,
      originatorConversationId: data.OriginatorConversationID ?? originatorConversationId,
      responseCode: data.ResponseCode ?? '-1',
      responseDescription: data.ResponseDescription ?? 'Unknown error',
    },
  };
}

// ─── Utility: Determine Daraja command from payout method ─────────

/**
 * Maps a payout method type to the appropriate Daraja B2B command.
 */
export function getDarajaCommand(
  methodType: PayoutMethodType,
): DarajaB2BCommand | null {
  switch (methodType) {
    case 'mpesa_till':
      return 'BusinessBuyGoods';
    case 'mpesa_paybill':
      return 'BusinessPayBill';
    default:
      return null; // Bank and MoMo don't use Daraja
  }
}

/**
 * Returns the recipient shortcode for a given payout method.
 */
export function getRecipientShortcode(method: PayoutMethod): string | null {
  switch (method.type) {
    case 'mpesa_till':
      return method.tillNumber ?? null;
    case 'mpesa_paybill':
      return method.paybillNumber ?? null;
    default:
      return null;
  }
}

// ─── Utility: Available payout methods by country ────────────────

export const COUNTRY_PAYOUT_METHODS: Record<string, PayoutMethodType[]> = {
  KE: ['mpesa_till', 'mpesa_paybill', 'bank_ke'],
  NG: ['bank_ng', 'opay', 'palm_pay'],
  GH: ['momo_mtn', 'bank_gh'],
  ZA: ['eft_za', 'payfast', 'ozow'],
  UG: ['momo_mtn', 'airtel_money', 'bank_ug'],
  TZ: ['mpesa_tz', 'tigo_pesa', 'crdb_bank'],
  SN: ['orange_money', 'wave', 'bank_sn'],
};

/**
 * Returns which payout method types are available for a given country.
 */
export function getAvailablePayoutMethods(country: string): PayoutMethodType[] {
  return COUNTRY_PAYOUT_METHODS[country] ?? [];
}

/**
 * Human-readable label for a payout method type.
 */
export function getPayoutMethodLabel(type: PayoutMethodType): string {
  const labels: Record<PayoutMethodType, string> = {
    mpesa_till: 'M-Pesa Till Payment',
    mpesa_paybill: 'M-Pesa Paybill (Buy Goods)',
    bank_ke: 'Kenyan Bank Transfer',
    bank_ng: 'Bank Transfer (NGN)',
    momo_mtn: 'Mobile Money (MTN/Vodafone Cash)',
    opay: 'OPay',
    palm_pay: 'PalmPay',
    bank_gh: 'Bank Transfer (GHS)',
    eft_za: 'EFT / Bank Transfer (ZAR)',
    payfast: 'PayFast',
    ozow: 'Ozow',
    airtel_money: 'Airtel Money',
    bank_ug: 'Bank Transfer (UGX)',
    mpesa_tz: 'M-Pesa Tanzania',
    tigo_pesa: 'Tigo Pesa',
    crdb_bank: 'CRDB Bank Transfer',
    orange_money: 'Orange Money',
    wave: 'Wave',
    bank_sn: 'Bank Transfer (XOF)',
  };
  return labels[type];
}

/**
 * Generate a client-side UUID for payout method cards.
 */
export function generatePayoutId(): string {
  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}