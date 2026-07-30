# AfriSpine — Living Architecture & Changelog

> **This file is the single source of truth for what exists, what's in progress, and what's deferred.**
> Update it with every meaningful change. Never let it drift out of sync with the code.

---

## Platform Identity

**AfriSpine** is a wealth management platform built for the **African diaspora** — people abroad who support families, pay bills, and invest back home in Africa. It is NOT a generic trading platform.

- **Primary users:** African diaspora (Europe, US, Middle East, elsewhere)
- **Core value:** Invest in African stocks + send money home + track wealth — from one account
- **Brand tone:** Trust, clarity, diaspora identity, regulatory compliance

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Turbopack, TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui | New York style, Lucide icons |
| Database | Prisma ORM + SQLite (dev) | Serverless-hosted DB needed for production |
| Auth | NextAuth.js v4 (available) | Not yet integrated |
| State | Zustand + TanStack Query | Available but not yet used |
| Animations | Framer Motion | In use on homepage |
| Deployment | Vercel | Project: `afrispine` under `komsonmedia` team |
| Domain | afri-spine.com | Vercel-managed DNS |
| Git | GitHub: Kenapp23/Afrispine | **Remote is now source of truth** |

## Vercel Project

- **Project name:** `afrispine` (NOT `my-project`)
- **Team:** `komsonmedia-8677s-projects`
- **Production URL:** https://afri-spine.com
- **Domains:** afri-spine.com, www.afri-spine.com, api.afri-spine.com, digest.afri-spine.com

## File Structure

```
src/
  app/
    page.tsx                    # Public homepage (diaspora landing)
    layout.tsx                  # Root layout + metadata
    admin/
      page.tsx                  # Admin dashboard (API health monitor)
    api/
      route.ts                  # Catch-all API (status)
      wealth/
        health/route.ts         # GET: provider health status
        config/route.ts         # GET/POST: credential management
        digest/
          fetch-image/route.ts  # GET: Openverse image proxy
  lib/
    db.ts                       # Prisma client singleton
    credential-store.ts         # 3-tier credential storage
    services/
      types.ts                  # Shared TypeScript types
      http-helpers.ts           # Fetch wrappers, content-type guards
      mystocks.ts               # MyStocks API service
      fincra.ts                 # Fincra API service
      openverse.ts              # Openverse image service
  components/ui/                # shadcn/ui components (standard set)
prisma/
  schema.prisma                # Database schema
```

## Database Schema (Prisma/SQLite)

| Model | Purpose | Status |
|-------|---------|--------|
| User | User accounts | Scaffold — needs rebuild for auth |
| Post | Blog posts | Scaffold — may be replaced by DigestStory |
| ApiCredential | Provider API keys | Active, in use by admin config UI |
| DigestStory | Market digest articles | Schema exists, no UI/pages yet |

**Missing models (needed):** Transaction, Portfolio, InvestmentOrder, User2FA, AuditLog

## API Integrations

| Provider | Service File | Status | Notes |
|----------|-------------|--------|-------|
| MyStocks | `mystocks.ts` | Health-check only | No stocks data endpoint exposed to frontend |
| Fincra | `fincra.ts` | Health-check only | No payments endpoint exposed to frontend |
| Openverse | `openverse.ts` | Active | Image fetch API working |
| Flutterwave | ❌ None | **Ghost reference** | Referenced in homepage + metadata but no service file exists |
| Eversend | ❌ None | Not integrated | Partnership letter + integration prompt written, not yet coded |

## API Routes

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/wealth/health` | GET | Provider health monitoring | ✅ Working |
| `/api/wealth/config` | GET/POST | Credential management | ✅ Working |
| `/api/wealth/digest/fetch-image` | GET | Openverse image proxy | ✅ Working |
| `/api/stocks` | — | Stock market data | ❌ Doesn't exist (homepage uses mock data) |
| `/api/payments` | — | Payment operations | ❌ Doesn't exist |

## Environment Variables

| Variable | Purpose | Where Used |
|----------|---------|-------------|
| DATABASE_URL | SQLite connection string | Prisma |
| MYSTOCKS_API_KEY | MyStocks API key | credential-store.ts fallback |
| FINCRA_API_KEY | Fincra API key | credential-store.ts fallback |
| FINCRA_BUSINESS_ID | Fincra business ID | credential-store.ts fallback |
| NEXTAUTH_SECRET | NextAuth encryption | Not yet configured |
| NEXTAUTH_URL | NextAuth callback URL | Not yet configured |

## Rebuild Progress

### Completed
- [x] Section 0: Git remote configured (Kenapp23/Afrispine)
- [x] Section 0: Production baseline tagged (v0.1.0-snapshot)
- [x] Section 0: This architecture document created

### In Progress
- [ ] Section 1: Fix stat counters showing "0+"
- [ ] Section 1: Fix currency mapping (NGX→NGN, JSE→ZAR)
- [ ] Section 1: Remove Flutterwave ghost references

### Pending (Section 2)
- [ ] 2.1: Re-establish diaspora positioning on homepage
- [ ] 2.2: Stabilize payments layer (Fincra confirmed, Eversend integration)
- [ ] 2.3: Stabilize investment layer (MyStocks endpoint verification)
- [ ] 2.4: Rebuild digest/content layer
- [ ] 2.5: Add 2FA
- [ ] 2.6: Build demand-supply matching engine
- [ ] 2.7: Full platform audit (security, stress, UX)
- [ ] 2.8: Dangote IPO readiness verification

## Version Tags

| Tag | Date | Description |
|-----|------|-------------|
| v0.1.0-snapshot | 2025-07-28 | Pre-rebuild baseline. Restored landing + admin. Known bugs present. |

## Deployment Log

| Date | Tag | Vercel Deployment ID | Notes |
|------|-----|---------------------|-------|
| 2025-07-28 | v0.1.0-snapshot | dpl_* (check Vercel) | Deployed to afrispine project, afri-spine.com live |

---

*Last updated: 2025-07-28. Update with every commit.*
