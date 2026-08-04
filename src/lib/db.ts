/**
 * Database client — PostgreSQL via Supabase.
 *
 * RESILIENT: This module reads .env directly to recover from shell env
 * poisoning (e.g. sandbox injecting DATABASE_URL=file:...sqlite).
 *
 * A bad DATABASE_URL does NOT crash the server or build.
 * Instead, `dbReady` is exported as `false` and API routes that
 * import `db` should check `dbReady` before querying.
 *
 * On Vercel (production), the env vars are always correct, so this
 * guard never fires.
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── Bootstrap .env with override:true for DB URLs only ─────────
// Next.js loads .env with override:false (shell wins). We re-read
// .env and force-set DATABASE_URL/DIRECT_URL so a stale shell var
// can't point us at SQLite.
try {
  const envLines = readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split('\n')
  for (const raw of envLines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^[\'\"]|[\'\"]$/g, '')
    if (key === 'DATABASE_URL' || key === 'DIRECT_URL') {
      process.env[key] = val
    }
  }
} catch {
  // .env not readable — use whatever env vars are already set
}

// ─── Validate DATABASE_URL ─────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? ''
const isPostgres = /^postgres(ql)?:\/\//i.test(dbUrl)

if (dbUrl && !isPostgres) {
  console.warn(
    '[db] WARN: DATABASE_URL is not PostgreSQL (got "' + dbUrl.slice(0, 40) + '"). ' +
    'API routes will fail gracefully. ' +
    (process.env.NODE_ENV === 'production'
      ? 'On Vercel this should never happen — check your Vercel env vars.'
      : 'Fix your .env or unset the shell env var.')
  )
}

if (!dbUrl) {
  console.warn('[db] WARN: DATABASE_URL is not set. API routes will fail gracefully.')
}

// Warn if pgbouncer=true is missing on pooled connections (port 6543)
if (isPostgres && dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
  console.warn(
    '[db] WARNING: DATABASE_URL uses port 6543 (Supabase pooler) without ?pgbouncer=true. ' +
    'This can cause "prepared statement already exists" (42P05) errors. ' +
    'Add ?pgbouncer=true to your DATABASE_URL.'
  )
}

// ─── Connection URL ────────────────────────────────────────────
const urlWithTimeout = isPostgres
  ? (dbUrl.includes('?')
      ? `${dbUrl}&connect_timeout=15`
      : `${dbUrl}?connect_timeout=15`)
  : dbUrl

// ─── PrismaClient singleton ──────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: urlWithTimeout } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * `true` when the database URL is a valid PostgreSQL connection string.
 * API routes should check this before querying; if `false`, return
 * fallback data or a clear error — do NOT let the query throw.
 */
export const dbReady = isPostgres
