# AfriSpine Platform — Important Materials & Documentation

**Version:** 1.2.0  
**Date:** August 2025  
**Confidentiality:** PROPRIETARY — AfriSpine Financial Technologies  

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Setup & Deployment Guide](#4-setup--deployment-guide)
5. [Database Schema](#5-database-schema)
6. [Database Persistence Fix (v1.2.0)](#6-database-persistence-fix-v120)
7. [Authentication System](#7-authentication-system)
8. [Partner Key Management](#8-partner-key-management)
9. [Automated Settlement Flow](#9-automated-settlement-flow)
10. [Gift Card System](#10-gift-card-system)
11. [Admin Testing Dashboard](#11-admin-testing-dashboard)
12. [API Reference](#12-api-reference)
13. [Security Measures](#13-security-measures)
14. [Environment Variables](#14-environment-variables)
15. [File Structure](#15-file-structure)

---

## 1. Platform Overview

AfriSpine is a bank-grade diaspora remittance and wealth management platform serving African diaspora communities worldwide. It enables:

- **Cross-border remittances** to Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania
- **Equity/stock investment** in African exchanges (NSE, NSE Kenya) via CSCS nominee accounts
- **Gift card marketplace** with 122+ African brand partners and blockchain-based QR codes
- **Business FX** and corporate treasury services
- **Bill payments** (airtime, DStV, GoTV, KPLC, Nairobi Water)
- **Group sends** (Chamas/Savings circles)
- **Intra-Africa PAPSS** and **China corridor** payments

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
│                   (Single Page App)                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Landing  │  │  Auth    │  │  Sender  │  │  Admin  ││
│  │  Pages   │  │  Flow    │  │  Portal  │  │  Panel  ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘│
│       │              │              │              │     │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐│
│  │              Zustand Store (app.ts)                  ││
│  │           Hash-based SPA Routing                     ││
│  └──────────────────────┬──────────────────────────────┘│
│                          │                               │
│  ┌───────────────────────┴──────────────────────────────┐│
│  │              API Routes (/api/*)                      ││
│  │  • Auth (login, signup, logout, me)                  ││
│  │  • Admin (partners, settlement, gift-cards)          ││
│  │  • Gift Cards (purchase, redeem, brands)             ││
│  │  • Wealth (bonds, prices/movers)                     ││
│  │  • KYC (PEP checks)                                  ││
│  │  • Digest, Chama, Merchants                          ││
│  └───────────────────────┬──────────────────────────────┘│
│                          │                               │
│  ┌───────────────────────┴──────────────────────────────┐│
│  │           Prisma ORM + SQLite                        ││
│  │         (Persistent: db/custom.db)                   ││
│  │                                                      ││
│  │  40+ Models: Sender, AdminUser, Transaction,         ││
│  │  GiftCard, SettlementTransaction, PartnerConfig,     ││
│  │  EquityOrder, DiasporaNseLedger, FeeMatrix, etc.     ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

External Integrations:
├── Flutterwave (Fincra) — Payment Rails
├── M-Pesa (Daraja) — Mobile Money Kenya
├── MyStocks Africa — Equity Clearing Partner
├── PEP Checker — AML/KYC Compliance
├── Smile ID — Identity Verification
├── Africa's Talking — SMS/Notifications
└── Blockchain — Gift Card QR/Smart Contracts
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Runtime | Bun |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style) |
| Icons | Lucide React |
| State Management | Zustand (client) |
| Server State | TanStack Query |
| Authentication | Custom JWT (httpOnly cookies) |
| Password Hashing | bcryptjs |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |

---

## 4. Setup & Deployment Guide

### Prerequisites
- Node.js 18+ or Bun latest
- Git

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Kenapp23/Afrispine.git
cd Afrispine

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Initialize database
bun run db:push

# 5. Start development server
bun run dev

# 6. Access at http://localhost:3000
```

### Admin Login
- **Email:** admin@afrispine.com
- **Password:** Admin@2024

### Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard:
# DATABASE_URL = file:/tmp/prisma.db (for serverless)
# Or use Turso/libSQL for persistent production DB
```

---

## 5. Database Schema

### Core Models (40+)

**Auth:**
- `Sender` — End user accounts (name, email, KYC status, limits)
- `AdminUser` — Admin panel users (role, active status)

**Transactions:**
- `Transaction` — Remittance transfers (FX, corridors, rails)
- `TransactionEvent` — Status change audit trail
- `Recipient` — Beneficiary details (bank, mobile money)

**Providers:**
- `Provider` — Payment rail configs (Flutterwave, Fincra, etc.)
- `ProviderLog` — API call audit logs

**Gift Cards:**
- `GiftCardBrand` — 122+ African brands (logo, KYC, smart contract)
- `GiftCard` — Individual gift cards (QR code, blockchain hash)
- `GiftCardTransaction` — Purchase/redeem audit trail

**Settlement Engine:**
- `SettlementRule` — Fee split rules (AfriSpine 235bps, Partner 75bps)
- `SettlementTransaction` — Settlement ledger entries
- `PartnerConfig` — Partner API keys and endpoints
- `CompanyConfig` — AfriSpine company/bank/tax details

**Wealth/Equity:**
- `EquityOrder` — Stock buy/sell orders
- `DiasporaNseLedger` — NSE trading ledger
- `FeeMatrix` — Fee breakdown per order

**Platform Config:**
- `PlatformSetting` — Key-value store for platform settings
- `PlatformConfig` — Alternate config store
- `SettlementConfig` — Settlement sweep configuration

---

## 6. Database Persistence Fix (v1.2.0)

### Problem
All `CREATE TABLE` and `CREATE INDEX` statements in `src/lib/ensure-db.ts` were missing `IF NOT EXISTS`. When the dev server restarted and the schema probe failed (e.g., during hot-reload cascading errors), `createSchema()` would re-execute all DDL statements, causing table-already-exists errors. While these were caught, the retry logic at line 787-788 would reset `ensured = false`, potentially causing cascading issues.

### Fix
- All 58 `CREATE TABLE` statements now use `CREATE TABLE IF NOT EXISTS`
- All 19 `CREATE INDEX` statements now use `CREATE INDEX IF NOT EXISTS` / `CREATE UNIQUE INDEX IF NOT EXISTS`
- This ensures that re-running `createSchema()` on server restart is completely safe and never destroys existing data

### Verification
```bash
# Confirm all statements have IF NOT EXISTS
grep -c 'CREATE TABLE IF NOT EXISTS' src/lib/ensure-db.ts  # Should be 58
grep 'CREATE.*INDEX' src/lib/ensure-db.ts | grep -v 'IF NOT EXISTS' | wc -l  # Should be 0
```

---

## 7. Authentication System

### Custom JWT Authentication (NOT NextAuth)

**Login Flow:**
1. User submits email + password to `/api/auth/login`
2. Server verifies credentials against bcrypt hash
3. Server generates JWT with `cuid()` as `jti` (idempotency)
4. JWT stored in httpOnly cookie (`afrispine-session` for senders, `afrispine-admin` for admins)
5. Cookie flags: `httpOnly`, `secure`, `sameSite=strict`, `path=/`, `maxAge=86400`

**Session Restore:**
- `/api/auth/me` endpoint restores session from cookie on page load
- Zustand store updated via `useAppStore.setState()`
- Works across page refreshes and server restarts

**Admin vs Sender:**
- Separate cookies: `afrispine-session` (sender) vs `afrispine-admin` (admin)
- Different JWT payloads and verification functions
- Admin access restricted to `superadmin` and `admin` roles

---

## 8. Partner Key Management

### PartnerConfig Model

```prisma
model PartnerConfig {
  id              String   @id @default(cuid())
  partnerId       String   @unique   // e.g., "mystocks-africa"
  partnerName     String              // "MyStocks Africa"
  purpose         String              // "equity-clearing"
  environment     String   @default("production")
  isActive        Boolean  @default(true)
  configJson      String              // JSON with secretKey, testKey, etc.
  lastVerifiedAt  DateTime?
  verifiedBy      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### API Endpoints
- `GET /api/admin/partners` — List all partner configs (admin only)
- `POST /api/admin/partners` — Create partner config
- `PUT /api/admin/partners/[id]` — Update partner config
- `POST /api/admin/partners/switch-env` — Toggle sandbox/production

### Supported Partners
- **MyStocks Africa** — Equity clearing (NSE, NSE Kenya)
- **Flutterwave/Fincra** — Payment rails
- **M-Pesa (Daraja)** — Mobile money
- **PEP Checker** — AML compliance
- **Smile ID** — Identity verification
- **Africa's Talking** — SMS/notifications

---

## 9. Automated Settlement Flow

### Payment Split Engine

When a diaspora user invests in African equities:

```
User Pays:  $1,031.00 USD (equivalent)
     │
     ▼
┌─────────────────────────────────┐
│       AfriSpine Platform         │
│                                   │
│  Net Profit:        $16.00       │
│  FX Markup (2.5bps):  $7.50      │
│  ─────────────────────────────── │
│  AfriSpine Total:   $23.50      │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│     MyStocks Africa              │
│                                   │
│  Clearing Fee (0.75%):  $7.50   │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│     Lagos Broker Desk            │
│                                   │
│  Net to Broker:    $1,000.00    │
│  → CSCS Nominee Registration    │
│  → Share Registration           │
└─────────────────────────────────┘
```

### Fee Breakdown (per $1,000 net investment)

| Party | Amount | Basis |
|-------|--------|-------|
| User Pays (gross) | $1,031.00 | $1,000 + $31 fees |
| AfriSpine Fee | $23.50 | 235 bps ($16 net + $7.50 FX markup) |
| MyStocks Fee | $7.50 | 75 bps (0.75% clearing) |
| Net to Broker | $1,000.00 | For share purchase |

### 15-Minute Locked-Window Settlement Loop

1. User submits equity order → status: `locked`
2. 15-minute window opens for payment confirmation
3. On payment confirmed:
   - AfriSpine fee ($23.50) retained
   - MyStocks receives $1,007.50, retains $7.50
   - Broker receives $1,000.00
   - Shares registered under CSCS nominee account
4. Settlement transaction created with all references
5. If window expires → status: `expired`, funds returned

### Database Models

```prisma
model SettlementRule {
  ruleName            String   // "NSE Equity Default"
  afriSpineFeeBps     Int      @default(235)   // 2.35%
  partnerFeeBps       Int      @default(75)    // 0.75%
  brokerFeeBps        Int      @default(0)
  settlementWindowMin Int      @default(15)
  afriSpineWallet     String?  // AfriSpine wallet address
  partnerEndpoint     String?  // MyStocks API endpoint
  brokerAccount       String?  // Broker settlement account
  cscsNominee         String?  // CSCS nominee account number
}

model SettlementTransaction {
  reference       String   @unique
  grossAmountUsd  Float    // $1,031.00
  afriSpineFeeUsd Float    // $23.50
  partnerFeeUsd   Float    // $7.50
  netAssetUsd     Float    // $1,000.00
  status          String   // pending, locked, settled, expired
  cscsNominee     String?  // Nominee account for share registration
  assetCode       String?  // e.g., "DANGCEM"
  quantity        Float?   // Number of shares
}
```

---

## 10. Gift Card System

### 122+ African Brand Partners

Brands include: Netflix, Spotify, Amazon, Uber, Airbnb, Apple, Google Play, DStV, GoTV, Showmax, Jumia, Takealot, Pick n Pay, and 100+ more across Kenya, Nigeria, Ghana, South Africa, Uganda, Tanzania.

### Key Partners with Custom Logos
- **MyStocks Africa** (`mystocks.co.ke`)
- **Africa's Talking** (`africastalking.com`)

### Blockchain Features
- Each gift card has a unique blockchain-based QR code
- Smart contract hash for legal and automated reconciliation
- Immutable transaction trail on blockchain

### API Endpoints
- `GET /api/gift-cards/brands` — List available brands
- `POST /api/gift-cards/purchase` — Purchase a gift card
- `POST /api/gift-cards/redeem` — Redeem a gift card
- `GET /api/gift-cards/my` — User's purchased gift cards
- `GET /api/gift-cards/[code]` — Get gift card details
- `POST /api/gift-cards/brand/onboard` — Brand onboarding
- `POST /api/gift-cards/seed-brands` — Seed 122 brands

---

## 11. Admin Testing Dashboard

### 4 Simulation Scenarios

1. **Happy Path** — Normal equity purchase flow
2. **Replay Attack** — Duplicate idempotency key detection
3. **Timeout Dropout** — 15-minute window expiry
4. **Oversubscription** — Order exceeds available quantity

### API
- `POST /api/admin/v1/test/inject-scenario` — Run a test scenario

---

## 12. API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Sender login |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/signup` | Sender registration |
| GET | `/api/auth/me` | Session restore |
| POST | `/api/auth/logout` | Sender logout |
| POST | `/api/auth/admin/logout` | Admin logout |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/partners` | List partner configs |
| POST | `/api/admin/partners` | Create partner |
| PUT | `/api/admin/partners/[id]` | Update partner |
| POST | `/api/admin/partners/switch-env` | Toggle sandbox |
| GET | `/api/admin/company/[key]` | Get company config |
| PUT | `/api/admin/company/[key]` | Update company config |
| GET | `/api/admin/gift-cards/brands` | List gift card brands |
| GET | `/api/admin/gift-cards/stats` | Gift card statistics |
| PUT | `/api/admin/gift-cards/brands/[id]/verify` | Verify brand |
| GET | `/api/admin/gift-cards/brands/[id]/contract` | Get smart contract |
| GET | `/api/admin/settlement/rules` | List settlement rules |
| GET | `/api/admin/settlement/transactions` | Settlement ledger |
| GET | `/api/admin/settlement/stats` | Settlement statistics |

### Gift Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gift-cards/brands` | Public brand listing |
| POST | `/api/gift-cards/purchase` | Purchase gift card |
| POST | `/api/gift-cards/redeem` | Redeem gift card |
| GET | `/api/gift-cards/my` | My gift cards |
| GET | `/api/gift-cards/[code]` | Card details |

---

## 13. Security Measures

1. **Password Hashing:** bcryptjs with 12 salt rounds
2. **JWT Tokens:** httpOnly, secure, sameSite=strict cookies
3. **Idempotency:** 120-second in-memory cache for duplicate prevention
4. **HMAC-SHA256:** Webhook signature verification
5. **Admin-Only Endpoints:** JWT role verification on all admin routes
6. **Input Validation:** Zod schemas on all API inputs
7. **CORS:** Configured for specific origins
8. **Rate Limiting:** Per-user daily limits (default £1,000 GBP)
9. **PEP/Sanctions Screening:** Automatic checks on all users
10. **Audit Trail:** TransactionEvent logs for all state changes

---

## 14. Environment Variables

```env
# Database (REQUIRED)
DATABASE_URL=file:./db/custom.db

# For production, use Turso/libSQL:
# DATABASE_URL=libsql://your-db.turso.io

# Optional
IS_SANDBOX=true
```

---

## 15. File Structure

```
my-project/
├── .env                          # Environment variables
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── components.json               # shadcn/ui configuration
├── vercel.json                   # Vercel deployment config
├── worklog.md                    # Development work log
│
├── prisma/
│   ├── schema.prisma             # Database schema (40+ models)
│   └── schema.sql                # Generated SQL
│
├── db/
│   └── custom.db                 # SQLite database file (persistent)
│
├── public/
│   ├── logo.svg                  # AfriSpine logo
│   ├── afrispine-logo.jpg        # AfriSpine branded logo
│   ├── favicon.ico               # Favicon files
│   ├── gift-*.png                # Gift card brand logos
│   ├── partner-*.png             # Partner logos
│   ├── bill-*.png                # Bill payment provider logos
│   └── afrispine-full-source-v1.2.0.zip  # Full source archive
│
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout
    │   ├── page.tsx              # SPA entry (hash router)
    │   ├── globals.css           # Global styles
    │   └── api/
    │       ├── auth/             # Auth endpoints
    │       ├── admin/            # Admin endpoints
    │       ├── gift-cards/       # Gift card endpoints
    │       ├── wealth/           # Wealth/Equity endpoints
    │       ├── kyc/              # KYC/PEP endpoints
    │       ├── digest/           # Digest endpoints
    │       ├── chama/            # Chama/Savings circle endpoints
    │       ├── merchants/        # Merchant data
    │       └── seed/             # Database seeding
    │
    ├── components/
    │   ├── ui/                   # shadcn/ui components
    │   ├── pages/                # Page components (legacy)
    │   └── afrispine/
    │       ├── auth/             # Login, signup, forgot-password
    │       ├── common/           # Landing, footer, layout, pages
    │       ├── sender/           # Sender dashboard, transfers, KYC
    │       ├── admin/            # Admin panel components
    │       ├── wealth/           # Wealth/Equity pages
    │       ├── gifts/            # Gift card hub, send, redeem
    │       ├── digest/           # Digest magazine
    │       ├── seo/              # SEO landing pages
    │       ├── Auth.tsx          # Auth container
    │       ├── Landing.tsx       # Landing page
    │       ├── SendFlow.tsx      # Send money flow
    │       ├── dashboard.tsx     # Sender dashboard
    │       └── ...               # Other components
    │
    ├── stores/
    │   └── app.ts                # Zustand global state + hash router
    │
    ├── hooks/
    │   ├── use-toast.ts          # Toast hook
    │   └── use-mobile.ts         # Mobile detection
    │
    └── lib/
        ├── db.ts                # Prisma client (persistent)
        ├── ensure-db.ts          # Schema initialization (FIXED v1.2.0)
        ├── auth.ts               # Sender JWT auth
        ├── admin-auth.ts         # Admin JWT auth
        ├── utils.ts              # Utility functions
        ├── merchants.ts          # 122+ African merchant data
        ├── seed.ts               # Database seed script
        ├── daraja.ts             # M-Pesa Daraja integration
        ├── i18n.ts               # Internationalization
        ├── wealth-data.ts        # Stock/wealth mock data
        ├── savings-circle-names.ts # Chama name generator
        └── idempotency.ts        # Idempotency key cache
```

---

## GitHub Repository

**Repository:** `Kenapp23/Afrispine.git`  
**Branch:** `main`  

```bash
git clone https://github.com/Kenapp23/Afrispine.git
```

---

*This document is part of the AfriSpine v1.2.0 release package.*
*For support, contact the AfriSpine engineering team.*
