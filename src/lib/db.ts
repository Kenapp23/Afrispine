/**
 * Database client — PostgreSQL via Supabase.
 *
 * Requires DATABASE_URL pointing to a real Postgres instance.
 * No SQLite, no /tmp, no Turso — just a persistent Postgres connection.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
