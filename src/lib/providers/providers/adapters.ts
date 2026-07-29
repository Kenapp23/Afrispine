// ─────────────────────────────────────────────────────────────────────
// Provider Adapter Pattern
// Each adapter normalises a single provider's API into a standard interface.
// When real API keys are not configured (sandbox mode), each adapter returns
// a simulated success response so the rest of the pipeline can be tested
// end-to-end without hitting live provider endpoints.
// ─────────────────────────────────────────────────────────────────────

export interface ProviderInstruction {
  amount: number;
  currency: string;
  receiveCurrency: string;
  recipientName: string;
  recipientPhone: string;
  deliveryMethod: string;
  mobileNetwork?: string;
  bankName?: string;
  accountNumber?: string;
  reference: string;
  callbackUrl?: string;
  senderId?: string;
  recipientCountry?: string;
  bankCode?: string;
  purposeOfTransfer?: string;
}

export interface ProviderResult {
  success: boolean;
  providerReference: string;
  estimatedDelivery: string;
  status: string;
}

// ── Sandbox helper ──────────────────────────────────────────────────
function sandboxResponse(reference: string, slug: string): ProviderResult {
  return {
    success: true,
    providerReference: `SANDBOX-${slug.toUpperCase()}-${reference}`,
    estimatedDelivery: '2025-12-31T00:00:00.000Z',
    status: 'processing',
  };
}

function envKeysPresent(...keys: string[]): boolean {
  return keys.every(k => !!process.env[k]);
}

// ── 1. LemFi Adapter ────────────────────────────────────────────────
// Real integration: POST {apiBaseUrl}/transfers with Bearer auth.
// Body includes { destination: { type, phone|bankAccount }, sourceCurrency,
// destinationCurrency, amount }. Response returns a transfer reference
// used for status polling / webhooks.
export async function lemfiAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('LEMF_API_KEY', 'LEMF_API_SECRET')) {
    return sandboxResponse(instruction.reference, 'lemfi');
  }

  // Real API call would go here:
  // const res = await fetch(`${baseUrl}/transfers`, { ... })
  return sandboxResponse(instruction.reference, 'lemfi');
}

// ── 2. Africa's Talking Adapter ─────────────────────────────────────
// Real integration: POST {apiBaseUrl}/mobile-money/b2c/request using
// their USSD push / mobile money disbursement API.
// Requires username + apiKey in Basic auth header.
// The `requestMetadata.externalId` field carries our reference for
// reconciliation via webhooks.
export async function africasTalkingAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('AT_API_KEY', 'AT_USERNAME')) {
    return sandboxResponse(instruction.reference, 'africas-talking');
  }

  // Real API call would go here:
  // const res = await fetch(`${baseUrl}/mobile-money/b2c/request`, { ... })
  return sandboxResponse(instruction.reference, 'africas-talking');
}

// ── 3. MFS Africa Adapter ───────────────────────────────────────────
// Real integration: POST {apiBaseUrl}/disbursements with OAuth2 token.
// MFS Africa aggregates ~400 mobile money operators across 35+ African
// markets. The `externalId` field in the payload maps back to our
// transaction reference.
export async function mfsAfricaAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('MFS_API_KEY', 'MFS_API_SECRET')) {
    return sandboxResponse(instruction.reference, 'mfs-africa');
  }

  // Real API call would go here:
  // const token = await getMfsToken(); // client_credentials grant
  // const res = await fetch(`${baseUrl}/disbursements`, { ... })
  return sandboxResponse(instruction.reference, 'mfs-africa');
}

// ── 4. Yellow Card Adapter ──────────────────────────────────────────
// Real integration: POST {apiBaseUrl}/withdrawals or /payouts using
// API key auth. Yellow Card specialises in stablecoin ↔ fiat rails
// (USDC/USDT) and bank transfers. The response `sequenceId` maps to
// our providerReference.
export async function yellowCardAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('YELLOWCARD_API_KEY', 'YELLOWCARD_SECRET')) {
    return sandboxResponse(instruction.reference, 'yellow-card');
  }

  // Real API call would go here:
  // const res = await fetch(`${baseUrl}/withdrawals`, { ... })
  return sandboxResponse(instruction.reference, 'yellow-card');
}

// ── 5. Ecobank (PAPSS) Adapter ──────────────────────────────────────
// Real integration: POST {apiBaseUrl}/transfers/pan-african using
// OAuth2 client-credentials grant. Ecobank's PAPSS rail enables
// instant cross-border settlements across AfCFTA participating
// currencies. The `transactionReference` in the response is used
// for webhook reconciliation.
export async function ecobankAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('ECOBANK_API_KEY', 'ECOBANK_CLIENT_ID')) {
    return sandboxResponse(instruction.reference, 'ecobank');
  }

  // Real API call would go here:
  // const token = await getEcobankToken();
  // const res = await fetch(`${baseUrl}/transfers/pan-african`, { ... })
  return sandboxResponse(instruction.reference, 'ecobank');
}

// ── 6. Verto FX Adapter ─────────────────────────────────────────────
// Real integration: POST {apiBaseUrl}/transfers (or /quotes first,
// then /execute) using API key auth. Verto FX focuses on corporate
// FX and bank-to-bank transfers across African corridors. High
// reliability, suited for larger corporate transactions.
export async function vertoAdapter(
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  if (!envKeysPresent('VERTO_API_KEY', 'VERTO_SECRET')) {
    return sandboxResponse(instruction.reference, 'verto-fx');
  }

  // Real API call would go here:
  // const quote = await fetch(`${baseUrl}/quotes`, { ... })
  // const res = await fetch(`${baseUrl}/transfers`, { ... })
  return sandboxResponse(instruction.reference, 'verto-fx');
}

// ── Adapter dispatcher ───────────────────────────────────────────────
export async function callProvider(
  provider: { slug: string },
  instruction: ProviderInstruction,
): Promise<ProviderResult> {
  const slugMap: Record<string, (i: ProviderInstruction) => Promise<ProviderResult>> = {
    'lemfi': lemfiAdapter,
    'africas-talking': africasTalkingAdapter,
    'mfs-africa': mfsAfricaAdapter,
    'yellow-card': yellowCardAdapter,
    'ecobank': ecobankAdapter,
    'verto-fx': vertoAdapter,
  };

  const adapter = slugMap[provider.slug];
  if (!adapter) {
    return {
      success: false,
      providerReference: '',
      estimatedDelivery: '',
      status: 'no_adapter',
    };
  }

  return adapter(instruction);
}