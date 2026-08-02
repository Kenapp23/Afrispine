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
 *
 * Architecture: `db` is a Proxy that transparently routes all calls to the
 * active backend.  When Turso is configured, `ensureDb()` calls `initTurso()`
 * which swaps the backend.  All existing `import { db }` just work.
 */
import { PrismaClient } from '@prisma/client'

// ─── Resolve local SQLite URL ────────────────────────────────
function resolveLocalUrl(): string {
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    return process.env.DATABASE_URL
  }
  if (process.env.DATABASE_URL) {
    console.warn(`[db] DATABASE_URL does not start with "file:" — falling back to /tmp/prisma.db.`)
  } else {
    console.warn('[db] No DATABASE_URL set — using file:/tmp/prisma.db (ephemeral on Vercel).')
  }
  return 'file:/tmp/prisma.db'
}

// ─── Backend instances ──────────────────────────────────────
const _localClient = new PrismaClient({
  datasourceUrl: resolveLocalUrl(),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

let _activeClient: PrismaClient = _localClient
let _tursoReady = false

/** Current backend — may change after initTurso() */
function getClient(): PrismaClient {
  return _activeClient
}

// ─── Turso lazy initialisation (async, ESM-only packages) ──
export async function initTurso(): Promise<void> {
  if (_tursoReady || !process.env.TURSO_DATABASE_URL) return

  try {
    const [{ PrismaLibSql }, { createClient }] = await Promise.all([
      import('@prisma/adapter-libsql'),
      import('@libsql/client'),
    ])

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSql(libsql)
    _activeClient = new PrismaClient({ adapter, log: ['error'] })
    _tursoReady = true
    console.log('[db] Turso/libSQL backend initialised successfully')
  } catch (err: any) {
    console.error('[db] Turso/libSQL initialisation FAILED:', err.message)
    // Fall back to local SQLite so the app doesn't crash
  }
}

// ─── Export a Proxy so all `db.xxx()` calls route to active backend ──
export const db = new Proxy(_localClient, {
  get(_target, prop, _receiver) {
    const client = getClient()
    const value = (client as any)[prop]
    // Bind methods so `this` points to the real PrismaClient
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
  has(_target, prop) {
    return prop in getClient()
  },
}) as unknown as PrismaClient

// Reuse in dev across hot-reloads (keeps the proxy reference stable)
if (process.env.NODE_ENV !== 'production') {
  ;(globalThis as any).__afrispine_db_proxy = db
}
