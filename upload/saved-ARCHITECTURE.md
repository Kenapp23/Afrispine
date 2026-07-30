# AfriSpine — Living Architecture Document

> **This file is the single source of truth for what exists, what's in progress, and what was deferred.**
> Updated continuously. Anyone (human or AI) should be able to read this and understand the full platform state.
>
> Last updated: 2025-07-28 (post-loss restoration audit)

---

## Platform Identity

**AfriSpine** is a wealth management platform built specifically for the **African diaspora** — people abroad who support and invest in Africa. Core use cases: family financial support (remittances, bill payments), investment access (stock exchanges), and financial inclusion.

**Domain:** https://afri-spine.com
**Admin:** https://afri-spine.com/admin
**Vercel Project:** `afrispine` (team: komsonmedia-8677s-projects)
**GitHub:** https://github.com/Kenapp23/Afrispine

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | TypeScript, Turbopack |
| Styling | Tailwind CSS 4 + shadcn/ui | New York style, Lucide icons |
| Database | Prisma ORM + SQLite | Client-only SQLite for dev; Vercel Postgres needed for prod |
| State | Zustand (client), TanStack Query (server) | |
| Auth | NextAuth.js v4 | Available, not yet configured |
| AI | z-ai-web-dev-sdk | Backend only, not client-side |

---

## Current Database Schema (Prisma)

```
User           — id, email, name, createdAt, updatedAt  (scaffold only)
Post           — id, title, content, published, authorId  (scaffold only)
ApiCredential  — id, provider(uniq), apiKey, secretKey, environment, baseUrl
DigestStory    — id, title, country, ticker, exchange, summary, content, imageUrl, imageCredit, imageSource, published
```

**Missing models (previously existed, lost):** Investor profiles, Transactions, 2FA tokens, MatchingEngine records, Subscription flows. Need to be rebuilt.

---

## API Routes — Current State

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/wealth/health` | GET | ✅ Working | Checks MyStocks, Fincra, Openverse health |
| `/api/wealth/config` | GET/POST | ✅ Working | CRUD for provider API credentials |
| `/api/wealth/digest/fetch-image` | GET | ✅ Working | Openverse image search |
| `/api` | GET | ⚠️ Placeholder | Unknown purpose, needs review |
| `/api/stocks` | GET | ❌ Missing | MyStocks data fetching |
| `/api/payments` | GET | ❌ Missing | Fincra/Eversend payment operations |

---

## Service Integrations

### MyStocks (mystocks.africa)
- **Status:** Health check only. No actual stock data fetching.
- **Endpoints defined:** Health Ping, Market Data, Top Gainers, Top Losers, Market Indices, Portfolio Summary
- **Auth:** Bearer token via API key
- **Missing:** Actual data retrieval for NSE, NGX, JSE stock display. Currently homepage shows hardcoded mock data.

### Fincra
- **Status:** Health check only. No actual payment operations.
- **Endpoints defined:** Account Balance, Verify Account, Create Transfer, Transaction History, Exchange Rates
- **Auth:** `api-key` header + `x-business-id` header
- **Missing:** Transfer creation, balance checking, FX conversion for production use.

### Eversend
- **Status:** ❌ Not integrated at all.
- **Priority:** High — preferred payout rail for Kenya, just-in-time stablecoin funding aligns with AfriSpine's non-custodial architecture.
- **Reference:** Partnership letter and Zai integration prompt exist (shared by owner). Needs client_id/client_secret flow, Payouts API, Collections API.

### Openverse
- **Status:** ✅ Working — free public API, no auth needed.
- **Purpose:** African-relevant image sourcing for digest content.

### Flutterwave
- **Status:** ⚠️ Mentioned on homepage as payment partner. No service file, no integration code.
- **Decision needed:** Owner must confirm whether Flutterwave is an actual current integration partner or a leftover from the restored snapshot that predates the Fincra-only direction.

---

## Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Platform homepage | ✅ Live (generic positioning, needs diaspora rebuild) |
| `/admin` | Admin dashboard — API health monitor | ✅ Live |

**Missing pages (previously existed, lost):**
- Digest/article pages
- Investment/stock trading pages
- Payment/transfer pages
- User auth pages (login, register, 2FA setup)
- IPO subscription flows

---

## Known Bugs (Live, User-Facing)

1. **Stat counters show "0+" and "0.9%"** — Counter animation component likely not rendering targets correctly. Should show: "3+ African Exchanges", "50M+ Stocks Accessible", "30+ Currencies", "99.9% Uptime".
2. **All stocks shown in KES** — NGX stocks (Nigeria) should show NGN, JSE stocks (South Africa) should show ZAR. Currently hardcoded currency prefix.
3. **Flutterwave listed as partner** — Needs owner confirmation before keeping or removing.

---

## Rebuild Sequence (In Order)

### ✅ Complete
- [x] Section 0: Git discipline, remote repo, audit
- [x] Section 1: Fix stat counters
- [x] Section 1: Fix currency mapping
- [x] Section 1: Document Flutterwave status

### 🔄 In Progress
- [ ] Section 2.1: Re-establish diaspora positioning
- [ ] Section 2.2: Confirm and stabilize payments layer
- [ ] Section 2.3: Confirm and stabilize investment layer

### ⏳ Pending
- [ ] Section 2.4: Rebuild digest/content layer
- [ ] Section 2.5: Add 2FA
- [ ] Section 2.6: Add demand-supply matching engine
- [ ] Section 2.7: Full platform audit (security, stress, UX)
- [ ] Section 2.8: Re-confirm Dangote IPO readiness

---

## Environment Variables

| Variable | Purpose | Where Used | Status |
|----------|---------|-----------|--------|
| `DATABASE_URL` | SQLite connection string | Prisma/DB | ✅ Configured |
| `MYSTOCKS_API_KEY` | MyStocks API key | mystocks.ts (health) | ❌ Not set |
| `FINCRA_API_KEY` | Fincra API key | fincra.ts (health) | ❌ Not set |
| `FINCRA_BUSINESS_ID` | Fincra business ID | fincra.ts (health) | ❌ Not set |
| `EVERSEND_CLIENT_ID` | Eversend OAuth client | (not built yet) | ❌ Not set |
| `EVERSEND_CLIENT_SECRET` | Eversend OAuth secret | (not built yet) | ❌ Not set |
| `NEXTAUTH_SECRET` | NextAuth session encryption | (not configured) | ❌ Not set |
| `NEXTAUTH_URL` | NextAuth base URL | (not configured) | ❌ Not set |
| `GITHUB_TOKEN` | GitHub push auth | Git operations | ✅ Configured |
| `VERCEL_TOKEN` | Vercel deployment auth | Vercel CLI | ✅ Configured |

---

## Deployment History

| Date | Tag | Commit | What Changed |
|------|-----|--------|-------------|
| 2025-07-28 | v0.2.0-post-audit | (pending) | Section 0+1 fixes: git discipline, ARCHITECTURE.md, stat counters, currency mapping, Flutterwave documented |
| 2025-07-12 | v0.1.0-snapshot | — | Initial restored snapshot (pre-loss backup) |
