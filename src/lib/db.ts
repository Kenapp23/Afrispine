import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Default to /tmp/prisma.db for Vercel serverless (writable tmpfs)
// Falls back to local dev path only when explicitly set via .env
const databaseUrl = process.env.DATABASE_URL || 'file:/tmp/prisma.db'

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL not set — using default: file:/tmp/prisma.db. ' +
    'For production on Vercel, set DATABASE_URL to a persistent database URL (e.g. Turso/libSQL).'
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// In development, reuse the Prisma Client across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
