---
Task ID: 1
Agent: Main Agent
Task: Delete public artifacts and add persistent DB support for Vercel

Work Log:
- Deleted src/app/api/download-source/route.ts
- Deleted public/AFRISPINE-IMPORTANT-MATERIALS.md
- Deleted public/afrispine-v1.1.0-verified-baseline.zip
- Deleted public/afrispine-full-source-v1.2.0.zip
- Removed empty src/app/api/download-source/ directory
- Installed @prisma/adapter-libsql and @libsql/client for Turso support
- Rewrote src/lib/db.ts to support dual backends: Turso/libSQL (persistent) and local SQLite
- Updated src/lib/ensure-db.ts comment to reflect dual-backend architecture
- Updated src/app/api/health/route.ts to show backend type and warn about ephemeral storage
- Discovered and fixed CRITICAL BUG: wrong import name `PrismaLibSQL` (should be `PrismaLibSql`) caused entire DB layer to crash
  - This top-level import failure broke EVERY API route that imports db.ts
  - Fixed by using require() inside conditional block so libSQL packages only load when TURSO_DATABASE_URL is set
- Pushed 2 commits to GitHub (d142a9e and 9f55884)

Stage Summary:
- Files deleted: 4 artifacts removed from public/ and API routes
- DB layer now supports Turso/libSQL for persistent storage on Vercel
- Critical import bug fixed that was breaking all database operations
- Admin email change feature already exists in both backend (API) and frontend (admin-settings-page.tsx)
- Remaining: User needs to set up Turso database and add TURSO_DATABASE_URL + TURSO_AUTH_TOKEN to Vercel env vars
