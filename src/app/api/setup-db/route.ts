import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Tables needed for auth to work — created one by one via raw SQL
// Uses IF NOT EXISTS so it's safe to run multiple times
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Sender" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "dailyLimitGbp" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Sender_email_key" ON "Sender"("email")`,
  `CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email")`,
];

export async function GET() {
  const results: string[] = [];
  for (const sql of STATEMENTS) {
    try {
      await db.$executeRawUnsafe(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] || sql.match(/CREATE UNIQUE INDEX IF NOT EXISTS "(\w+)"/)?.[1] || 'unknown';
      results.push(`OK: ${tableName}`);
    } catch (e: any) {
      results.push(`ERROR: ${e.message}`);
    }
  }
  return NextResponse.json({ results });
}
