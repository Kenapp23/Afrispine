/**
 * Ensures the Postgres schema exists and the default admin is seeded.
 *
 * When dbReady is false, this is a no-op (DB not reachable).
 */
import { db, dbReady } from './db'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

let ensured = false
let adminEnsured = false

/** Verify the schema is reachable. Throws if not. */
export async function ensureDb(): Promise<void> {
  if (!dbReady) {
    throw new Error('Database not reachable (DATABASE_URL is not PostgreSQL)')
  }
  if (ensured) return
  try {
    await db.sender.count()
    ensured = true
  } catch (e: any) {
    console.error(
      '[ensureDb] Schema probe failed — tables likely do not exist yet on this database. ' +
      'Run `npx prisma db push` against DATABASE_URL once to create them, or visit /api/setup-db.',
      e.message
    )
    throw new Error(
      'Database schema not initialized. Run `npx prisma db push` against your Postgres DATABASE_URL, then retry.'
    )
  }
}

/** Ensure admin user exists. Race-safe. */
export async function ensureAdminSeeded(): Promise<void> {
  if (!dbReady) {
    throw new Error('Database not reachable')
  }
  if (!ensured) {
    await ensureDb()
  }
  if (adminEnsured) return

  try {
    const count = await db.adminUser.count()
    if (count === 0) {
      console.log('[ensureAdminSeeded] No admin found, creating default admin...')
      const hash = await bcrypt.hash('Admin@2024', 12)
      await db.adminUser.create({
        data: {
          email: 'admin@afri-spine.com',
          passwordHash: hash,
          fullName: 'AfriSpine Admin',
          role: 'superadmin',
          isActive: true,
        },
      })
      console.log('[ensureAdminSeeded] Admin user seeded successfully — CHANGE THE DEFAULT PASSWORD IMMEDIATELY')
    }
    adminEnsured = true
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      console.log('[ensureAdminSeeded] Admin already seeded by a concurrent request — continuing')
      adminEnsured = true
      return
    }
    console.error('[ensureAdminSeeded] Admin seed failed:', e.message)
    throw new Error(`Admin database initialization failed: ${e.message}`)
  }
}
