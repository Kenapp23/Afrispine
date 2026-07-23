/**
 * Credential Store — Vercel-compatible storage adapter.
 * 
 * Strategy:
 * 1. If Prisma/SQLite is available (local dev), use the database
 * 2. If Prisma fails (Vercel serverless), fall back to:
 *    a. Vercel environment variables for reading
 *    b. In-memory Map for writes within the same cold-start
 * 
 * This ensures the config UI never crashes, and credentials set as
 * Vercel env vars are always read correctly.
 */

import { db } from '@/lib/db';

interface StoredCredential {
  provider: string;
  apiKey: string;
  secretKey?: string | null;
  environment: string;
  baseUrl?: string | null;
  updatedAt: string;
}

// In-memory fallback for Vercel serverless (persists within a single cold start)
const memoryStore = new Map<string, StoredCredential>();

let dbAvailable: boolean | null = null;

async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await db.apiCredential.findFirst({ take: 1 });
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

export async function getCredential(provider: string): Promise<StoredCredential | null> {
  // Priority 1: Environment variable
  const envKey = process.env[`${provider.toUpperCase()}_PUBLIC_KEY`] 
    || process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey) {
    return {
      provider,
      apiKey: envKey.trim(),
      secretKey: process.env[`${provider.toUpperCase()}_SECRET_KEY`]?.trim() || null,
      environment: (process.env[`${provider.toUpperCase()}_ENVIRONMENT`] as string) || 'sandbox',
      baseUrl: process.env[`${provider.toUpperCase()}_BASE_URL`]?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
  }

  // Priority 2: Prisma database
  if (await isDbAvailable()) {
    try {
      const cred = await db.apiCredential.findUnique({ where: { provider } });
      if (cred) {
        return {
          provider: cred.provider,
          apiKey: cred.apiKey,
          secretKey: cred.secretKey,
          environment: cred.environment,
          baseUrl: cred.baseUrl,
          updatedAt: cred.updatedAt.toISOString(),
        };
      }
    } catch {
      dbAvailable = false;
    }
  }

  // Priority 3: In-memory fallback
  return memoryStore.get(provider) || null;
}

export async function listCredentials(): Promise<{ provider: string; environment: string; updatedAt: string; source: string }[]> {
  const results: { provider: string; environment: string; updatedAt: string; source: string }[] = [];

  const providers = ['mystocks', 'fincra', 'openverse', 'flutterwave'];

  for (const p of providers) {
    const cred = await getCredential(p);
    if (cred) {
      const source = process.env[`${p.toUpperCase()}_PUBLIC_KEY`] 
        || process.env[`${p.toUpperCase()}_API_KEY`] ? 'environment' 
        : memoryStore.has(p) ? 'memory' 
        : 'database';
      results.push({
        provider: cred.provider,
        environment: cred.environment,
        updatedAt: cred.updatedAt,
        source,
      });
    }
  }

  return results;
}

export async function saveCredential(data: {
  provider: string;
  apiKey: string;
  secretKey?: string;
  environment: string;
  baseUrl?: string;
}): Promise<{ success: boolean; provider: string; source: string }> {
  const { provider, apiKey, secretKey, environment, baseUrl } = data;
  const envKey = process.env[`${provider.toUpperCase()}_PUBLIC_KEY`] 
    || process.env[`${provider.toUpperCase()}_API_KEY`];

  // If this provider uses env vars, update the in-memory store
  // (env vars can't be changed at runtime, but we shadow them in memory)
  if (envKey) {
    memoryStore.set(provider, {
      provider,
      apiKey,
      secretKey: secretKey || null,
      environment: environment || 'sandbox',
      baseUrl: baseUrl || null,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, provider, source: 'memory' };
  }

  // Try Prisma first
  if (await isDbAvailable()) {
    try {
      await db.apiCredential.upsert({
        where: { provider },
        update: {
          apiKey: String(apiKey),
          secretKey: secretKey ? String(secretKey) : null,
          environment: String(environment || 'sandbox'),
          baseUrl: baseUrl ? String(baseUrl) : null,
        },
        create: {
          provider,
          apiKey: String(apiKey),
          secretKey: secretKey ? String(secretKey) : null,
          environment: String(environment || 'sandbox'),
          baseUrl: baseUrl ? String(baseUrl) : null,
        },
      });
      return { success: true, provider, source: 'database' };
    } catch {
      dbAvailable = false;
    }
  }

  // Fallback to in-memory
  memoryStore.set(provider, {
    provider,
    apiKey,
    secretKey: secretKey || null,
    environment: environment || 'sandbox',
    baseUrl: baseUrl || null,
    updatedAt: new Date().toISOString(),
  });
  return { success: true, provider, source: 'memory' };
}
