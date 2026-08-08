/**
 * Payment Provider Adapter
 *
 * Abstracts payment operations behind a common interface so the
 * rest of the app doesn't need to know whether it's talking to
 * MockProvider (dev/demo) or EversendProvider (production).
 *
 * The factory function `getProvider()` reads PlatformSetting
 * 'payment_provider' and returns the appropriate implementation.
 * Default: MockProvider (works without any credentials).
 */

import { EversendClient } from '@/lib/eversend';

// ─── Shared Types ────────────────────────────────────────────────────────

export interface CollectionParams {
  amount: number;
  currency: string;
  method: 'card' | 'bank_transfer';
  email?: string;
  country?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface CollectionResult {
  providerId: string;
  status: string;
  checkoutUrl?: string;
  reference?: string;
}

export interface PayoutParams {
  amount: number;
  currency: string;
  rail: string;
  phone?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PayoutResult {
  providerId: string;
  status: string;
  amount: number;
  currency: string;
  rail: string;
  reference?: string;
}

export interface TransactionStatusResult {
  type: 'collection' | 'payout';
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
}

export interface PaymentProvider {
  name: string;
  initializeCollection(params: CollectionParams): Promise<CollectionResult>;
  executePayout(params: PayoutParams): Promise<PayoutResult>;
  getTransactionStatus(id: string): Promise<TransactionStatusResult>;
  verifyWebhook(rawBody: string, signature: string): WebhookPayload;
}

// ─── In-memory mock store (survives hot reload) ─────────────────────────

type MockEntry = {
  id: string;
  reference: string;
  type: 'collection' | 'payout';
  status: string;
  amount: number;
  currency: string;
  rail?: string;
  createdAt: number;
  metadata?: Record<string, string>;
};

declare global {
  var __mockPaymentStore: Map<string, MockEntry> | undefined;
}

function getMockStore(): Map<string, MockEntry> {
  if (!globalThis.__mockPaymentStore) {
    globalThis.__mockPaymentStore = new Map();
  }
  return globalThis.__mockPaymentStore;
}

// ─── Mock Provider ──────────────────────────────────────────────────────

export class MockProvider implements PaymentProvider {
  name = 'mock';

  async initializeCollection(params: CollectionParams): Promise<CollectionResult> {
    const id = `mock_col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const reference = params.metadata?.reference || id;
    const store = getMockStore();
    store.set(reference, {
      id,
      reference,
      type: 'collection',
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      createdAt: Date.now(),
      metadata: params.metadata,
    });
    return {
      providerId: id,
      status: 'pending',
      checkoutUrl: `/api/webhooks/mock/complete?ref=${encodeURIComponent(reference)}`,
      reference,
    };
  }

  async executePayout(params: PayoutParams): Promise<PayoutResult> {
    const id = `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const reference = params.metadata?.reference || id;
    const store = getMockStore();
    store.set(reference, {
      id,
      reference,
      type: 'payout',
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      rail: params.rail,
      createdAt: Date.now(),
      metadata: params.metadata,
    });
    return {
      providerId: id,
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      rail: params.rail,
      reference,
    };
  }

  async getTransactionStatus(id: string): Promise<TransactionStatusResult> {
    const store = getMockStore();
    // Try by reference first, then by id
    let entry = store.get(id);
    if (!entry) {
      for (const e of store.values()) {
        if (e.id === id) { entry = e; break; }
      }
    }
    if (!entry) {
      return { type: 'collection', id, status: 'unknown' };
    }
    return {
      type: entry.type,
      id: entry.id,
      status: entry.status,
    };
  }

  verifyWebhook(rawBody: string, _signature: string): WebhookPayload {
    return JSON.parse(rawBody) as WebhookPayload;
  }

  /**
   * Simulate the provider firing a webhook after the user "completes payment".
   * Called by the /api/webhooks/mock/complete route.
   */
  simulateWebhook(ref: string): WebhookPayload {
    const store = getMockStore();
    const entry = store.get(ref);
    if (!entry) {
      return {
        event: 'collection.failed',
        data: { id: ref, status: 'failed' },
      };
    }
    // Update status to completed
    entry.status = 'completed';
    return {
      event: 'collection.completed',
      data: {
        id: entry.id,
        status: 'completed',
        amount: entry.amount,
        currency: entry.currency,
        metadata: entry.metadata,
      },
    };
  }
}

// ─── Eversend Provider ──────────────────────────────────────────────────

export class EversendProvider implements PaymentProvider {
  name = 'eversend';
  private client: EversendClient;

  constructor(client: EversendClient) {
    this.client = client;
  }

  async initializeCollection(params: CollectionParams): Promise<CollectionResult> {
    const res = await this.client.createCollection({
      amount: params.amount,
      currency: params.currency,
      method: params.method,
      email: params.email,
      country: params.country,
      metadata: params.metadata,
      idempotencyKey: params.idempotencyKey,
    });
    return {
      providerId: res.id,
      status: res.status,
      checkoutUrl: res.checkoutUrl,
      reference: res.reference || res.id,
    };
  }

  async executePayout(params: PayoutParams): Promise<PayoutResult> {
    const res = await this.client.createPayout({
      amount: params.amount,
      currency: params.currency,
      rail: params.rail,
      phone: params.phone,
      bankCode: params.bankCode,
      accountNumber: params.accountNumber,
      accountName: params.accountName,
      metadata: params.metadata,
      idempotencyKey: params.idempotencyKey,
    });
    return {
      providerId: res.id,
      status: res.status,
      amount: res.amount,
      currency: res.currency,
      rail: res.rail,
      reference: res.reference || res.id,
    };
  }

  async getTransactionStatus(id: string): Promise<TransactionStatusResult> {
    // Try payout first, then collection
    try {
      const payout = await this.client.getPayout(id);
      return {
        type: 'payout',
        id: payout.id,
        status: payout.status,
      };
    } catch {
      // Not a payout, try collection
    }
    try {
      const collection = await this.client.getCollection(id);
      return {
        type: 'collection',
        id: collection.id,
        status: collection.status,
      };
    } catch {
      return { type: 'collection', id, status: 'unknown' };
    }
  }

  verifyWebhook(rawBody: string, signature: string): WebhookPayload {
    return this.client.parseWebhook(rawBody, signature);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────

/**
 * Get the active payment provider.
 *
 * Reads PlatformSetting 'payment_provider' (values: 'mock', 'eversend').
 * If 'mock' or no setting found, returns MockProvider.
 * If 'eversend', tries to create EversendClient.fromSettings().
 * If 'eversend' but credentials are missing/invalid, THROWS ProviderInitializationError
 *   (never silently falls back to Mock — see Task 1 rationale).
 */
export class ProviderInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderInitializationError';
  }
}

export async function getProvider(): Promise<PaymentProvider | null> {
  const mock = new MockProvider();

  try {
    const { db, dbReady } = await import('@/lib/db');
    if (!dbReady) {
      // No DB → can't read setting → mock is acceptable in dev
      console.warn('[payments/adapter] DB not ready — using MockProvider');
      return mock;
    }

    const setting = await db.platformSetting.findUnique({ where: { key: 'payment_provider' } });
    const configuredProvider = setting?.value || 'mock';

    if (configuredProvider === 'eversend') {
      const client = await EversendClient.fromSettings();
      if (client) {
        return new EversendProvider(client);
      }
      // FAIL LOUD: eversend is explicitly configured but credentials are missing or invalid.
      // Never silently fall back to Mock — a payment looking like it succeeded when it
      // actually went to a fake provider is worse than an honest 5xx.
      throw new ProviderInitializationError(
        'Eversend is configured as the payment provider but credentials are missing or invalid. ' +
        'Set eversend_client_id and eversend_client_secret in PlatformSetting (or PartnerConfig).' +
        ' If you want Mock mode, set payment_provider to "mock".'
      );
    }

    // payment_provider is 'mock' or unset → MockProvider is the intended provider
    return mock;
  } catch (err) {
    if (err instanceof ProviderInitializationError) throw err;
    // DB read errors during provider selection → acceptable to fall back to mock
    console.warn('[payments/adapter] Error determining provider, using MockProvider:', err);
    return mock;
  }
}
