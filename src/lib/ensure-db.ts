/**
 * Ensures the SQLite database schema exists for the current serverless function instance.
 * On Vercel, each function has its own ephemeral filesystem, so the database
 * must be initialized on first use within each instance.
 */
import { db } from './db'
import bcrypt from 'bcryptjs'

let ensured = false

async function createSchema() {
  // Read the SQL schema file generated at build time
  const { readFileSync } = await import('fs')
  const { join } = await import('path')
  const sqlPath = join(process.cwd(), 'prisma', 'schema.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  // Execute each statement separately (SQLite doesn't support multiple statements in one call)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    await db.$executeRawUnsafe(stmt)
  }
  console.log(`[ensureDb] Created ${statements.length} schema statements`)
}

export async function ensureDb(): Promise<void> {
  if (ensured) return
  try {
    // Quick probe: if this succeeds, the schema exists
    await db.sender.count()
    ensured = true
  } catch {
 // Schema missing — create it
    console.warn('[ensureDb] Schema missing, creating from prisma/schema.sql ...')
    await createSchema()
    ensured = true
  }
}

/** Ensure DB + seed the admin user if none exists */
export async function ensureAdminSeeded(): Promise<void> {
  await ensureDb()
  try {
    const count = await db.adminUser.count()
    if (count === 0) {
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
      console.log('[ensureDb] Admin user seeded')
    }
  } catch (e: any) {
    console.error('[ensureDb] Admin seed failed:', e.message)
  }
}
