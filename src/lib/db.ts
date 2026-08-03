/**
 * Database client — PostgreSQL via Supabase.
 *
 * Requires DATABASE_URL pointing to a real Postgres instance.
 * No SQLite, no /tmp, no Turso — just a persistent Postgres connection.
 */
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. The app requires a persistent Postgres connection ' +
    '(e.g. Supabase). Set DATABASE_URL in your environment before starting the server.'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
