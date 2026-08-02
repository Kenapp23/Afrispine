/**
 * Database client — supports two backends:
 *
 * 1. **Turso / libSQL** (production on Vercel)
 *    Set TURSO_DATABASE_URL (+ optionally TURSO_AUTH_TOKEN) in Vercel env vars.
 *    This gives a persistent SQLite-compatible database that survives serverless cold starts.
 *
 * 2. **Local SQLite** (development / no Turso configured)
 *    Uses DATABASE_URL (must start with "file:").
 *    Falls back to file:/tmp/prisma.db if unset — this is EPHEMERAL on Vercel.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Resolve local SQLite URL ────────────────────────────────
function resolveLocalUrl(): string {
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    return process.env.DATABASE_URL
  }
  if (process.env.DATABASE_URL) {
    console.warn(
      `[db] DATABASE_URL does not start with "file:" — falling back to /tmp/prisma.db. `
    )
  } else {
    console.warn('[db] No DATABASE_URL set — using file:/tmp/prisma.db (ephemeral on Vercel).')
  }
  return 'file:/tmp/prisma.db'
}

// ─── Create client ────────────────────────────────────────────
// When TURSO_DATABASE_URL is set, we create the PrismaClient with the
// libSQL adapter. Otherwise, we use the local SQLite file.
let _db: PrismaClient

if (process.env.TURSO_DATABASE_URL) {
  // Turso path — dynamic import to avoid bundling issues when not used.
  // NOTE: The named export is `PrismaLibSql` (lowercase 'ql').
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require('@prisma/adapter-libsql')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@libsql/client')
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  })
  const adapter = new PrismaLibSql(libsql)
  _db = new PrismaClient({ adapter, log: ['error'] })
  console.log('[db] Using Turso/libSQL persistent backend')
} else {
  _db = new PrismaClient({
    datasourceUrl: resolveLocalUrl(),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? _db
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
