import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Provider-specific payload parsers ────────────────────────────────
// Each provider sends webhook payloads with different field names.
// The parser extracts a normalised { providerReference, status, reason } tuple.

interface ParsedWebhook {
  providerReference: string | null;
  status: string | null;   // 'delivered' | 'failed' | null
  reason: string | null;
}

function str(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

function nestedStr(obj: unknown, key: string): string | null {
  if (obj && typeof obj === 'object') {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'string' ? val : null;
  }
  return null;
}

function toStatus(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'completed' || lower === 'successful' || lower === 'success') return 'delivered';
  if (lower === 'failed' || lower === 'rejected') return 'failed';
  return null;
}

function parseLemfi(body: Record<string, unknown>): ParsedWebhook {
  return {
    providerReference: str(body.reference),
    status: toStatus(str(body.status)),
    reason: str(body.failureReason),
  };
}

function parseYellowCard(body: Record<string, unknown>): ParsedWebhook {
  return {
    providerReference: str(body.sequenceId),
    status: toStatus(str(body.status)),
    reason: str(body.errorMessage),
  };
}

function parseAfricasTalking(body: Record<string, unknown>): ParsedWebhook {
  const meta = body.requestMetadata;
  return {
    providerReference: meta && typeof meta === 'object' ? nestedStr(meta, 'externalId') : null,
    status: toStatus(str(body.status)),
    reason: str(body.errorMessage) ?? str(body.failureReason),
  };
}

function parseMfsAfrica(body: Record<string, unknown>): ParsedWebhook {
  return {
    providerReference: str(body.externalId),
    status: toStatus(str(body.transactionStatus)),
    reason: str(body.failureReason) ?? str(body.errorMessage),
  };
}

function parseEcobank(body: Record<string, unknown>): ParsedWebhook {
  return {
    providerReference: str(body.transactionReference),
    status: toStatus(str(body.transactionStatus)),
    reason: str(body.failureReason) ?? str(body.errorMessage),
  };
}

const parsers: Record<string, (body: Record<string, unknown>) => ParsedWebhook> = {
  'lemfi': parseLemfi,
  'yellow-card': parseYellowCard,
  'africas-talking': parseAfricasTalking,
  'mfs-africa': parseMfsAfrica,
  'ecobank': parseEcobank,
};

// ── Route handler ────────────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  // 1. Return 200 immediately so provider doesn't retry
  const body = await request.json().catch(() => ({}));
  const { slug } = await params;

  // Process asynchronously (fire-and-forget from provider's perspective)
  processWebhook(slug, body).catch((err: unknown) => {
    console.error(`[Webhook:${slug}] Background processing error:`, err);
  });

  return NextResponse.json({ received: true });
}

async function processWebhook(slug: string, body: Record<string, unknown>) {
  // 2. Find the provider by slug
  const provider = await db.provider.findUnique({ where: { slug } });
  if (!provider) {
    console.warn(`[Webhook] Unknown provider slug: ${slug}`);
    return;
  }

  // 3. Parse provider-specific payload
  const parser = parsers[slug];
  if (!parser) {
    console.warn(`[Webhook] No parser for provider slug: ${slug}`);
    return;
  }

  const parsed = parser(body);
  if (!parsed.providerReference || !parsed.status) {
    console.warn(
      `[Webhook:${slug}] Could not extract providerReference or status from payload`,
      JSON.stringify(body).slice(0, 500),
    );
    return;
  }

  // 4. Find the transaction by providerReference
  const transaction = await db.transaction.findFirst({
    where: { providerRef: parsed.providerReference },
  });
  if (!transaction) {
    console.warn(
      `[Webhook:${slug}] No transaction found with providerRef: ${parsed.providerReference}`,
    );
    return;
  }

  // 5. Update transaction status
  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: parsed.status,
  };
  if (parsed.status === 'delivered') {
    updateData.deliveredAt = now;
  } else if (parsed.status === 'failed') {
    updateData.failedAt = now;
    updateData.failureReason = parsed.reason ?? 'Provider reported failure';
  }

  await db.transaction.update({
    where: { id: transaction.id },
    data: updateData,
  });

  // 6. Log the webhook event
  await db.transactionEvent.create({
    data: {
      transactionId: transaction.id,
      eventType: `webhook_${parsed.status}`,
      payload: JSON.stringify(body).slice(0, 4000),
      actor: `provider:${slug}`,
    },
  });

  // Also log to provider log
  await db.providerLog.create({
    data: {
      providerId: provider.id,
      transactionId: transaction.id,
      eventType: 'webhook_received',
      direction: 'inbound',
      payload: JSON.stringify({ providerReference: parsed.providerReference, status: parsed.status, reason: parsed.reason }),
      statusCode: 200,
    },
  });

  console.log(
    `[Webhook:${slug}] Transaction ${transaction.reference} → ${parsed.status}` +
    (parsed.reason ? ` (reason: ${parsed.reason})` : ''),
  );
}