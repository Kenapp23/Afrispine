import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Resolve the actual database URL:
// 1. If DATABASE_URL starts with "file:" → use it (correct for SQLite)
// 2. If DATABASE_URL is set but NOT a file: URL → the Prisma schema uses
//    provider = "sqlite" which requires file: protocol. Override to /tmp/prisma.db
//    for Vercel serverless compatibility.
// 3. If DATABASE_URL is not set at all → fall back to /tmp/prisma.db
let databaseUrl: string
if (process.env.DATABASE_URL?.startsWith('file:')) {
  databaseUrl = process.env.DATABASE_URL
} else {
  if (process.env.DATABASE_URL) {
    console.warn(
      `[db] DATABASE_URL is set but does not start with "file:" (got: ${process.env.DATABASE_URL.slice(0, 30)}...). ` +
      'Prisma provider is "sqlite" which requires file: protocol. Overriding to file:/tmp/prisma.db.'
    )
  } else {
    console.warn(
      '[db] DATABASE_URL not set — using default: file:/tmp/prisma.db. ' +
      'For production on Vercel, set DATABASE_URL to a persistent database URL (e.g. Turso/libSQL).'
    )
  }
  databaseUrl = 'file:/tmp/prisma.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// In development, reuse the Prisma Client across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
