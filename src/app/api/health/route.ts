import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET() {
  const info: Record<string, any> = { timestamp: new Date().toISOString() };

  // Backend detection
  const usingTurso = !!process.env.TURSO_DATABASE_URL;
  info.backend = usingTurso ? 'turso' : 'local-sqlite';
  info.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 40)}...` : '(not set)',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? 'configured' : '(not set)',
    NODE_ENV: process.env.NODE_ENV || 'not set',
  };

  // Database connectivity & schema
  try {
    await ensureDb();
    const senderCount = await db.sender.count();
    const adminCount = await db.adminUser.count();
    info.db = { ok: true, senders: senderCount, admins: adminCount };

    // Warn if on Vercel without Turso
    if (!usingTurso && process.env.NODE_ENV === 'production') {
      info.warning = 'Running with local SQLite on Vercel — data is EPHEMERAL and lost on cold starts. Set TURSO_DATABASE_URL for persistent storage.';
    }
  } catch (e: any) {
    info.db = { ok: false, error: e.message };
  }

  const hasIssue = info.db?.ok === false;
  return NextResponse.json(info, { status: hasIssue ? 503 : 200 });
}
