import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';

export async function GET() {
  const info: Record<string, any> = { timestamp: new Date().toISOString() };

  // Test 1: Environment
  info.env = {
    DATABASE_URL: process.env.DATABASE_URL || '(not set — using default /tmp/prisma.db)',
    NODE_ENV: process.env.NODE_ENV || 'not set',
  };

  // Test 2: Database connectivity & schema
  try {
    await ensureDb();
    const senderCount = await db.sender.count();
    const adminCount = await db.adminUser.count();
    info.db = { ok: true, senders: senderCount, admins: adminCount };
  } catch (e: any) {
    info.db = { ok: false, error: e.message };
  }

  const hasIssue = info.db?.ok === false;
  return NextResponse.json(info, { status: hasIssue ? 503 : 200 });
}
