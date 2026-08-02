/**
 * Schema validation + admin seeding for PostgreSQL (Supabase).
 *
 * On Postgres the schema is persistent — tables survive restarts.
 * We just verify the schema exists and seed the admin if needed.
 * Admin seeding is race-safe: a concurrent unique-constraint violation
 * is treated as "already seeded" instead of crashing.
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
    await db.sender.count()
    ensured = true
  } catch (e: any) {
    console.error('[ensureDb] Schema probe failed — tables may not exist. Run: npx prisma db push', e.message)
    throw new Error('Database not ready — schema tables are missing. Run `npx prisma db push` against your Postgres database.')
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
      console.log('[ensureAdminSeeded] Admin user seeded successfully')
    } else {
      console.log('[ensureAdminSeeded] Admin user exists, skipping seed')
    }
    adminEnsured = true
  } catch (e: any) {
    // Race-safe: if two requests both try to create the admin simultaneously,
    // the second one hits a unique-constraint violation. That's fine — admin exists.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      console.log('[ensureAdminSeeded] Admin already exists (concurrent create), treating as success')
      adminEnsured = true
      return
    }
    console.error('[ensureAdminSeeded] Admin seed failed:', e.message)
    throw new Error(`Admin initialization failed: ${e.message}`)
  }
}
