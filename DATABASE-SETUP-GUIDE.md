# AfriSpine — Database & Auth Setup Reference

> **This document is your insurance policy.** If you ever lose the database, switch
> Supabase projects, or need to set up a fresh Vercel deployment, follow the steps
> below. Nothing else in the codebase needs to change.

---

## Architecture at a Glance

```
User Browser
    │
    ▼
Vercel (Next.js Serverless)
    │
    ├── POST /api/auth/signup   ──► Supabase PostgreSQL (Sender table)
    ├── POST /api/auth/login    ──► Supabase PostgreSQL (Sender table)
    ├── POST /api/auth/admin/login ─► Supabase PostgreSQL (AdminUser table)
    ├── GET  /api/auth/me       ──► JWT cookie verification
    ├── GET  /api/health        ──► DB connectivity check
    └── GET  /api/setup-db      ──► Creates ALL tables (one-time bootstrap)
```

---

## Required Environment Variables

Set these in **Vercel → Settings → Environment Variables**:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Pooled connection (Prisma runtime) | `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | Direct connection (prisma db push) | `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-eu-west-1.supabase.co:5432/postgres` |
| `JWT_SENDER_SECRET` | Signs user JWT tokens | Any random 32+ char string |
| `JWT_ADMIN_SECRET` | Signs admin JWT tokens | Any random 32+ char string |

### Where to find connection strings in Supabase

1. Go to **supabase.com** → your project → **Settings** → **Database**
2. **DATABASE_URL** (pooled) = "Connection pooling" → Transaction mode URL (port 6543)
3. **DIRECT_URL** (direct) = "Connection string" → URI tab (port 5432)
4. Both use the same password (your **database password**, NOT the project ID)

---

## Critical Files (do not delete these)

### 1. `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Why dual URL:**
- `url` (DATABASE_URL) = pooled connection via Supavisor. Used by Prisma Client at
  runtime. Handles many concurrent serverless connections efficiently.
- `directUrl` (DIRECT_URL) = straight TCP to Postgres. Used ONLY by `prisma db push`
  and `prisma migrate`. The pooler doesn't support Prisma's prepared statements,
  so schema management needs a direct connection.

### 2. `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Why `globalThis`:** In development, Next.js hot-reloads modules. Without the
singleton pattern, each reload would create a new PrismaClient and exhaust the
connection pool.

### 3. `src/lib/ensure-db.ts`

Probes the database by running `db.sender.count()`. If it fails (table doesn't
exist), it throws. This is called at the start of every auth request.

Also contains `ensureAdminSeeded()` which auto-creates the default admin account
(admin@afrispine.com / Admin@2024) on first admin login. Race-safe.

### 4. `src/lib/auth.ts`

Handles:
- Password hashing (bcrypt, 12 rounds)
- JWT signing/verification (7 days for users, 8 hours for admins)
- Cookie extraction helpers (`afrispine_session`, `afrispine_admin_session`)
- `requireAuth()` and `requireAdmin()` guards for protected API routes

### 5. `src/app/api/auth/[...slug]/route.ts`

Single file handling all auth routes:
- `POST /api/auth/signup` — creates Sender, returns JWT cookie
- `POST /api/auth/login` — verifies credentials, returns JWT cookie
- `POST /api/auth/admin/login` — verifies admin, seeds if first time, returns JWT

### 6. `src/app/api/setup-db/route.ts` ⭐ MOST IMPORTANT

**This is your recovery endpoint.** It creates ALL 58 tables, 32 indexes, and 7
foreign keys using raw SQL with `IF NOT EXISTS`. Completely idempotent — safe
to run any number of times.

**When to use:**
- Fresh Supabase project (tables don't exist yet)
- After accidentally dropping tables
- After switching to a new database
- Any time you see "table does not exist" errors

**How to use:** Visit `https://afrispine.vercel.app/api/setup-db` in your browser.

### 7. `src/app/api/health/route.ts`

Quick check: `GET /api/health` returns `{ status: 'ok', db: 'connected', senderCount: N }`
or an error if the database is unreachable.

### 8. `package.json` (critical entry)

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

**Why:** Vercel runs `npm install` (which triggers `postinstall`) during builds.
Without this, Prisma Client is never generated and ALL database operations fail.

---

## Setup a Fresh Supabase Project (Step by Step)

### Step 1: Create the Supabase project
1. Go to supabase.com → New Project
2. Set name, region (closest to your users), database password
3. **SAVE THE PASSWORD** — you'll need it for connection strings
4. Wait for the project to be ready

### Step 2: Get the connection strings
1. Go to Settings → Database
2. Copy the **Connection pooling** URL (port 6543) → this is `DATABASE_URL`
3. Copy the **Connection string** → URI tab (port 5432) → this is `DIRECT_URL`

### Step 3: Set environment variables in Vercel
1. Go to Vercel → your project → Settings → Environment Variables
2. Add `DATABASE_URL` = (pooled URL from Step 2)
3. Add `DIRECT_URL` = (direct URL from Step 2)
4. Add `JWT_SENDER_SECRET` = (any long random string)
5. Add `JWT_ADMIN_SECRET` = (any long random string)
6. **Redeploy** the app (Deployments → Redeploy)

### Step 4: Bootstrap the database
1. Wait for the Vercel deployment to complete (green ✅)
2. Visit `https://afrispine.vercel.app/api/setup-db` in your browser
3. Confirm you see `"ok": 100, "errors": 0`
4. That's it — all 58 tables are created

### Step 5: Test
1. Visit `https://afrispine.vercel.app/api/health` → should show `"status": "ok"`
2. Try signing up on the app
3. Try logging in as admin (admin@afrispine.com / Admin@2024)

---

## Disaster Recovery

### "Table does not exist" error
→ Visit `/api/setup-db` in your browser. All tables will be recreated.

### "Can't reach database" (P1001)
→ Check that `DATABASE_URL` is correct in Vercel env vars.
→ Make sure the Supabase project is not paused.

### "Invalid credentials" on admin login
→ The first admin login auto-seeds the admin account.
→ Email: `admin@afrispine.com`, Password: `Admin@2024`
→ If it still fails, check the AdminUser table exists via `/api/setup-db`.

### Switching to a new Supabase project
1. Create the new project in Supabase
2. Update `DATABASE_URL` and `DIRECT_URL` in Vercel env vars
3. Redeploy on Vercel
4. Visit `/api/setup-db` to create all tables in the new database
5. All existing user data will be gone (new empty database). If you need to
   migrate data, export from old Supabase and import via SQL Editor.

### Resetting the entire database
→ Go to Supabase Dashboard → SQL Editor → run:
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO public;
  ```
→ Then visit `/api/setup-db` to recreate everything.

---

## What NOT to do

- ❌ Do NOT use SQLite or `/tmp` for the database — data is lost on every Vercel cold start
- ❌ Do NOT put `DATABASE_URL` or `DIRECT_URL` in `.env` files that get committed to git
- ❌ Do NOT try to run `prisma db push` from your local machine if it can't reach Supabase
- ❌ Do NOT paste large SQL (1000+ lines) into the Supabase SQL Editor — it truncates
- ❌ Do NOT delete `src/app/api/setup-db/route.ts` — it's your recovery lifeline
- ❌ Do NOT remove `"postinstall": "prisma generate"` from package.json
- ❌ Do NOT remove `directUrl` from prisma/schema.prisma

---

## Auth Flow Summary

```
SIGNUP:
  POST /api/auth/signup { fullName, email, phone, password }
  → Hash password with bcrypt (12 rounds)
  → Create Sender row in PostgreSQL
  → Sign JWT (7 day expiry)
  → Set httpOnly cookie: afrispine_session
  → Return { success, sender, token }

LOGIN:
  POST /api/auth/login { email, password }
  → Find Sender by email
  → Verify password with bcrypt
  → Sign JWT (7 day expiry)
  → Set httpOnly cookie: afrispine_session
  → Return { success, sender, token }

ADMIN LOGIN:
  POST /api/auth/admin/login { email, password }
  → Auto-seed admin if no AdminUser exists
  → Find AdminUser by email
  → Verify password with bcrypt
  → Update lastLoginAt
  → Sign JWT (8 hour expiry)
  → Set httpOnly cookie: afrispine_admin_session
  → Return { success, admin, token }

SESSION CHECK:
  GET /api/auth/me (reads cookies automatically)
  → Check afrispine_session cookie → verify JWT → return sender
  → OR check afrispine_admin_session cookie → verify JWT → return admin
  → OR return 401

LOGOUT:
  POST /api/auth/logout (sender)
  POST /api/auth/admin/logout (admin)
  → Clear the respective cookie
```

---

## Default Admin Credentials

| Field | Value |
|---|---|
| Email | admin@afrispine.com |
| Password | Admin@2024 |
| Role | superadmin |

> **Change this password** after first login via the admin settings page.

---

Generated: 2026-08-03 — AfriSpine Platform
