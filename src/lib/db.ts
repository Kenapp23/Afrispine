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
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Determine backend ───────────────────────────────────────
const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuth = process.env.TURSO_AUTH_TOKEN

function createPrismaClient(): PrismaClient {
  // ── Turso / libSQL: persistent SQLite on Vercel ───────────
  if (tursoUrl) {
    console.log(`[db] Using Turso/libSQL: ${tursoUrl.replace(/:[^/@]+@/, ':***@')}`)
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuth || undefined,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      log: ['error'],
    })
  }

  // ── Local SQLite (development) ─────────────────────────────
  let databaseUrl: string
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    databaseUrl = process.env.DATABASE_URL
  } else {
    if (process.env.DATABASE_URL) {
      console.warn(
        `[db] DATABASE_URL does not start with "file:" — falling back to /tmp/prisma.db. ` +
        'Set TURSO_DATABASE_URL for persistent storage on Vercel.'
      )
    } else {
      console.warn(
        '[db] No DATABASE_URL set — using file:/tmp/prisma.db (ephemeral on Vercel). ' +
        'For production, set TURSO_DATABASE_URL.'
      )
    }
    databaseUrl = 'file:/tmp/prisma.db'
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Reuse Prisma Client across hot reloads in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
