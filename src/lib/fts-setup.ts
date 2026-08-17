/**
 * FTS5 Virtual Table Setup for SQLite
 *
 * Creates a full-text search virtual table over Video titles, descriptions,
 * and categories. Called lazily on first search query.
 *
 * In production (PostgreSQL/Supabase), this is a no-op —
 * the search route falls back to Prisma contains, and eventually
 * pg_trgm + pgvector handle search natively.
 */

import { db, dbReady } from '@/lib/db';

let ftsInitialized = false;

/**
 * Ensures the video_fts virtual table exists (SQLite only).
 * Safe to call multiple times — no-op after first success.
 */
export async function ensureFtsTable(): Promise<boolean> {
  if (ftsInitialized) return true;
  if (!dbReady) return false;

  try {
    // Check if we're on SQLite (Postgres will error on CREATE VIRTUAL TABLE)
    await db.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE IF NOT EXISTS video_fts
      USING fts5(
        video_id,
        title,
        description,
        category,
        content='video',
        content_rowid='rowid',
        tokenize='porter unicode61'
      )
    `);
    ftsInitialized = true;
    console.log('[fts] video_fts virtual table ready');
    return true;
  } catch (e: any) {
    // If this is Postgres, CREATE VIRTUAL TABLE will fail — that's expected
    if (e.message?.includes('virtual') || e.message?.includes('FTS') || e.code === '42P07') {
      console.log('[fts] Skipping FTS setup (not SQLite or table exists)');
      ftsInitialized = true; // don't retry
      return false;
    }
    console.warn('[fts] Failed to create FTS table:', e.message);
    return false;
  }
}

/**
 * Rebuilds the FTS index from current Video rows.
 * Call after seeding or uploading new videos.
 */
export async function rebuildFtsIndex(): Promise<void> {
  if (!dbReady) return;

  try {
    await db.$executeRawUnsafe(`DELETE FROM video_fts`);
    await db.$executeRawUnsafe(`
      INSERT INTO video_fts (video_id, title, description, category)
      SELECT id, title, COALESCE(description, ''), category
      FROM Video
      WHERE status = 'live'
    `);
    console.log('[fts] Index rebuilt');
  } catch (e: any) {
    console.warn('[fts] Failed to rebuild index:', e.message);
  }
}