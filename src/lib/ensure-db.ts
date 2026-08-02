/**
 * Ensures the Postgres schema exists and the default admin is seeded.
 *
 * Schema is NOT auto-created here anymore. It must be pushed once with
 * `npx prisma db push` (or `prisma migrate deploy`) against DATABASE_URL,
 * or by visiting the /api/setup-db bootstrap endpoint.
 *
 * The previous version of this file embedded raw SQLite DDL and silently
 * re-created an empty schema on every serverless cold start — that's what
 * caused admin/user data (including password changes) to keep disappearing.
 */
import { db } from './db'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

let ensured = false
let adminEnsured = false

/** Verify the schema is reachable. Throws if not. */
export async function ensureDb(): Promise<void> {
  if (ensured) return
  try {
    // Quick probe: if this succeeds, the schema exists in the persistent Postgres DB.
    // With a real Postgres database, the schema should already exist from a one-time
    // `npx prisma db push` (or `prisma migrate deploy`) run against DATABASE_URL,
    // or from visiting the /api/setup-db bootstrap endpoint.
    await db.sender.count()
    ensured = true
  } catch (e: any) {
    // We deliberately do NOT auto-create tables here anymore — the previous embedded
    // SQLite DDL fallback silently re-created an empty schema on every cold start,
    // which is what caused admin/user data to keep disappearing.
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
          email: 'admin@afrispine.com',
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
    // P2002 = unique constraint violation. With a persistent DB, this only happens if
    // two concurrent requests both saw count === 0 and both tried to seed at once —
    // that's fine, it means an admin now exists either way, not a real failure.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      console.log('[ensureAdminSeeded] Admin already seeded by a concurrent request — continuing')
      adminEnsured = true
      return
    }
    console.error('[ensureAdminSeeded] Admin seed failed:', e.message)
    throw new Error(`Admin database initialization failed: ${e.message}`)
  }
}
