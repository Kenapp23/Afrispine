/**
 * Database client — PostgreSQL via Supabase.
 *
 * HARDENED: This module validates DATABASE_URL at import time to prevent
 * the class of bugs where a shell env override (e.g. an SQLite file URL)
 * silently replaces the real Postgres connection. The app will CRASH on
 * startup with a clear message rather than failing mysteriously at login.
 *
 * No SQLite, no /tmp, no Turso — just a persistent Postgres connection.
 */
import { PrismaClient } from '@prisma/client'

// ─── Runtime guard: DATABASE_URL must be PostgreSQL ───────────────
const dbUrl = process.env.DATABASE_URL ?? ''

if (!dbUrl) {
  throw new Error(
    '[db] FATAL: DATABASE_URL is not set. ' +
    'The app requires a persistent PostgreSQL connection (e.g. Supabase). ' +
    'Set DATABASE_URL in your .env file or hosting environment before starting the server.'
  )
}

if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
  throw new Error(
    '[db] FATAL: DATABASE_URL must start with postgres:// or postgresql://. ' +
    `Got: "${dbUrl.slice(0, 30)}...". ` +
    'This usually means a shell environment variable is overriding your .env file ' +
    'with a non-PostgreSQL URL (e.g. SQLite). Unset the shell var or fix the .env value.'
  )
}

// Warn if pgbouncer=true is missing on pooled connections (port 6543)
if (dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
  console.warn(
    '[db] WARNING: DATABASE_URL uses port 6543 (Supabase pooler) without ?pgbouncer=true. ' +
    'This can cause "prepared statement already exists" (42P05) errors. ' +
    'Add ?pgbouncer=true to your DATABASE_URL.'
  )
}

// ─── Append connection timeout to prevent indefinite hangs ───────
// If the DB is unreachable, fail fast (15s) rather than hanging forever.
const urlWithTimeout = dbUrl.includes('?')
  ? `${dbUrl}&connect_timeout=15`
  : `${dbUrl}?connect_timeout=15`

// ─── PrismaClient singleton ──────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithTimeout,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
