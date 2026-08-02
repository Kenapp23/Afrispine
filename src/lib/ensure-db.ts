/**
 * Ensures the database schema exists.
 *
 * With Turso/libSQL (TURSO_DATABASE_URL set): schema is persistent across cold starts.
 * With local SQLite: schema is re-created on each serverless cold start (ephemeral).
 *
 * The SQL schema is embedded directly in this file (not read from disk)
 * because Vercel serverless functions may not include arbitrary files from the
 * repo in the runtime bundle.
 */
import { db } from './db'
import bcrypt from 'bcryptjs'

let ensured = false
let adminEnsured = false

// ─── Embedded DDL ───────────────────────────────────────────────
// Generated via: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
// DO NOT edit manually — regenerate from schema.prisma if models change.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Sender" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "dailyLimitGbp" REAL NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sendCurrency" TEXT NOT NULL,
    "sendAmount" REAL NOT NULL,
    "receiveCurrency" TEXT NOT NULL,
    "receiveAmount" REAL,
    "fxRate" REAL,
    "feeAmount" REAL NOT NULL DEFAULT 0,
    "totalCharged" REAL,
    "corridor" TEXT,
    "rail" TEXT,
    "providerSlug" TEXT,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "recipientBank" TEXT,
    "recipientAccount" TEXT,
    "matchType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TransactionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "provider" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Recipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "accountNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipient_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "slug" TEXT NOT NULL,
    "apiBaseUrl" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookSecret" TEXT,
    "supportedRails" TEXT,
    "supportedCorridors" TEXT,
    "weightSpeed" REAL NOT NULL DEFAULT 0.33,
    "weightCost" REAL NOT NULL DEFAULT 0.33,
    "weightReliability" REAL NOT NULL DEFAULT 0.34,
    "billingModel" TEXT,
    "billingRate" REAL,
    "billingEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "successRate30d" INTEGER NOT NULL DEFAULT 0,
    "avgDeliverySec30d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "ProviderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT,
    "direction" TEXT,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "payload" TEXT,
    "response" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT,
    "body" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SettlementConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "registeredAddress" TEXT,
    "companyRegNumber" TEXT,
    "vatNumber" TEXT,
    "settlementAccounts" TEXT,
    "sweepCurrency" TEXT,
    "sweepAccountId" TEXT,
    "sweepSchedule" TEXT,
    "sweepMinimum" REAL,
    "sweepNotifyEmail" TEXT,
    "flwAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "FxMarginOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corridor" TEXT NOT NULL,
    "marginPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Corridor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sendCountry" TEXT,
    "receiveCountry" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "RevenueRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "corridor" TEXT,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT,
    "providerName" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SplitRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "corridor" TEXT,
    "percentage" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "RateAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "corridor" TEXT,
    "targetRate" REAL,
    "direction" TEXT,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "RecurringSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "recipientId" TEXT,
    "sendCurrency" TEXT,
    "sendAmount" REAL,
    "receiveCurrency" TEXT,
    "frequency" TEXT,
    "nextExecution" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT,
    "referredId" TEXT,
    "code" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "sendAmount" REAL,
    "receiveAmount" REAL,
    "fxRate" REAL,
    "feePct" REAL,
    "feeAmount" REAL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "GroupSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "GroupSendContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupSendId" TEXT,
    "senderId" TEXT,
    "amount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSendContribution_groupSendId_fkey" FOREIGN KEY ("groupSendId") REFERENCES "GroupSend" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "GiftVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "senderId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "recipientEmail" TEXT,
    "redeemedBy" TEXT,
    "redeemedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "FamilyPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "BillPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "provider" TEXT,
    "billType" TEXT,
    "accountNumber" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "ownerType" TEXT,
    "currency" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "AmlFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "senderId" TEXT,
    "ruleCode" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SenderNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "authorId" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "WhatsAppOptIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "SenderSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "SenderPaystackAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "authCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "PepCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dobStart" TEXT,
    "dobEnd" TEXT,
    "isPep" BOOLEAN NOT NULL DEFAULT false,
    "isSanctioned" BOOLEAN NOT NULL DEFAULT false,
    "pepCount" INTEGER NOT NULL DEFAULT 0,
    "sanctionCount" INTEGER NOT NULL DEFAULT 0,
    "rawResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "BusinessAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "registrationNumber" TEXT,
    "email" TEXT,
    "contactName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "BusinessTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "sellCurrency" TEXT,
    "buyCurrency" TEXT,
    "sellAmount" REAL,
    "buyAmount" REAL,
    "fxRate" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DigestIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DigestSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "InvestmentAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "InvestmentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "type" TEXT,
    "assetCode" TEXT,
    "quantity" REAL,
    "pricePerUnit" REAL,
    "totalAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "FxOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "sellCurrency" TEXT,
    "buyCurrency" TEXT,
    "sellAmount" REAL,
    "buyAmount" REAL,
    "fxRate" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DividendPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "AumFeeCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ChinaCorridorPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "sendAmount" REAL,
    "sendCurrency" TEXT,
    "receiveAmount" REAL,
    "receiveCurrency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "PapssSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "RippleSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "LiquidityProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "PlatformConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT
);
CREATE TABLE IF NOT EXISTS "AchievementCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "GiftCardBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "description" TEXT,
    "website" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "kycDocuments" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "smartContractHash" TEXT,
    "smartContractAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" REAL NOT NULL DEFAULT 5,
    "maxAmount" REAL NOT NULL DEFAULT 500,
    "supportedCurrencies" TEXT NOT NULL DEFAULT '["KES","NGN","GHS","ZAR","UGX","TZS"]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "qrCodeData" TEXT NOT NULL,
    "blockchainTxHash" TEXT,
    "smartContractRef" TEXT,
    "message" TEXT,
    "occasion" TEXT,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" DATETIME,
    "redeemedBy" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GiftCard_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "GiftCardBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "GiftCardTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftCardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "performedBy" TEXT,
    "performedByRole" TEXT,
    "blockchainTxHash" TEXT,
    "smartContractEvent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftCardTransaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EquityOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "ticker" TEXT,
    "side" TEXT,
    "quantity" REAL,
    "pricePerShare" REAL,
    "totalAmount" REAL,
    "currency" TEXT,
    "status" TEXT,
    "idempotencyKey" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DiasporaNseLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "ticker" TEXT,
    "side" TEXT,
    "quantity" REAL,
    "price" REAL,
    "totalValue" REAL,
    "status" TEXT,
    "fee" REAL,
    "currency" TEXT,
    "exchange" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "FeeMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "type" TEXT,
    "description" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "recipient" TEXT,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "PartnerConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configJson" TEXT NOT NULL,
    "lastVerifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SettlementRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL DEFAULT 'equity',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "afriSpineFeeBps" INTEGER NOT NULL DEFAULT 235,
    "partnerFeeBps" INTEGER NOT NULL DEFAULT 75,
    "brokerFeeBps" INTEGER NOT NULL DEFAULT 0,
    "afriSpineWallet" TEXT,
    "partnerEndpoint" TEXT,
    "brokerAccount" TEXT,
    "settlementWindowMin" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SettlementTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "senderId" TEXT,
    "ruleId" TEXT,
    "grossAmountUsd" REAL NOT NULL,
    "afriSpineFeeUsd" REAL NOT NULL,
    "partnerFeeUsd" REAL NOT NULL,
    "netAssetUsd" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "afriSpineTxRef" TEXT,
    "partnerTxRef" TEXT,
    "brokerTxRef" TEXT,
    "cscsNominee" TEXT,
    "assetCode" TEXT,
    "quantity" REAL,
    "pricePerUnit" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "CompanyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configKey" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sender_email_key" ON "Sender"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_reference_key" ON "Transaction"("reference");
CREATE INDEX IF NOT EXISTS "Transaction_senderId_idx" ON "Transaction"("senderId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "TransactionEvent_transactionId_idx" ON "TransactionEvent"("transactionId");
CREATE INDEX IF NOT EXISTS "Recipient_senderId_idx" ON "Recipient"("senderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_slug_key" ON "Provider"("slug");
CREATE INDEX IF NOT EXISTS "ProviderLog_providerId_idx" ON "ProviderLog"("providerId");
CREATE INDEX IF NOT EXISTS "ProviderLog_createdAt_idx" ON "ProviderLog"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_trigger_key" ON "NotificationTemplate"("trigger");
CREATE UNIQUE INDEX IF NOT EXISTS "FxMarginOverride_corridor_key" ON "FxMarginOverride"("corridor");
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSetting_key_key" ON "PlatformSetting"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "GiftVoucher_code_key" ON "GiftVoucher"("code");
CREATE INDEX IF NOT EXISTS "PepCheck_senderId_idx" ON "PepCheck"("senderId");
CREATE INDEX IF NOT EXISTS "PepCheck_status_idx" ON "PepCheck"("status");
CREATE INDEX IF NOT EXISTS "PepCheck_createdAt_idx" ON "PepCheck"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformConfig_key_key" ON "PlatformConfig"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerConfig_partnerId_key" ON "PartnerConfig"("partnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "SettlementTransaction_reference_key" ON "SettlementTransaction"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyConfig_configKey_key" ON "CompanyConfig"("configKey");
CREATE INDEX IF NOT EXISTS "SettlementTransaction_senderId_idx" ON "SettlementTransaction"("senderId");
CREATE INDEX IF NOT EXISTS "SettlementTransaction_status_idx" ON "SettlementTransaction"("status");
CREATE INDEX IF NOT EXISTS "SettlementTransaction_createdAt_idx" ON "SettlementTransaction"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "GiftCardBrand_slug_key" ON "GiftCardBrand"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_code_key" ON "GiftCard"("code");
CREATE INDEX IF NOT EXISTS "GiftCard_brandId_idx" ON "GiftCard"("brandId");
CREATE INDEX IF NOT EXISTS "GiftCard_senderId_idx" ON "GiftCard"("senderId");
CREATE INDEX IF NOT EXISTS "GiftCard_status_idx" ON "GiftCard"("status");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_type_idx" ON "GiftCardTransaction"("type");
CREATE INDEX IF NOT EXISTS "GiftCardTransaction_createdAt_idx" ON "GiftCardTransaction"("createdAt");
`

async function createSchema() {
  // Split on semicolons, filter out empty/comment-only statements
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let executed = 0
  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt)
      executed++
    } catch (e: any) {
      // Log but don't throw — some statements may fail if tables already exist
      // (e.g. on a warm instance where schema was partially created)
      console.error(`[ensureDb] Statement failed (${executed}/${statements.length}): ${stmt.slice(0, 80)}...`, e.message)
    }
  }
  console.log(`[ensureDb] Executed ${executed}/${statements.length} schema statements`)
}

export async function ensureDb(): Promise<void> {
  if (ensured) return
  try {
    // Quick probe: if this succeeds, the schema exists
    await db.sender.count()
    ensured = true
  } catch (probeError: any) {
    // Schema missing — create it from embedded SQL
    console.warn('[ensureDb] Schema probe failed, creating from embedded SQL...', probeError.message)
    await createSchema()
    // Verify the schema was actually created
    try {
      await db.sender.count()
      ensured = true
      console.log('[ensureDb] Schema created and verified successfully')
    } catch (verifyError: any) {
      console.error('[ensureDb] Schema creation completed but verification failed:', verifyError.message)
      // Reset flag so we retry on next request
      ensured = false
      throw verifyError
    }
  }
}

/** Ensure DB + seed the admin user if none exists */
export async function ensureAdminSeeded(): Promise<void> {
  // Always re-verify schema if not yet ensured
  if (!ensured) {
    await ensureDb()
  }
  // Reset admin flag on every call to handle ephemeral Vercel filesystem
  if (!adminEnsured) {
    try {
      const count = await db.adminUser.count()
      if (count === 0) {
        console.log('[ensureAdminSeeded] No admin found, creating default admin...')
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
        console.log('[ensureAdminSeeded] Admin user seeded successfully')
      } else {
        console.log('[ensureAdminSeeded] Admin user exists, skipping seed')
      }
      adminEnsured = true
    } catch (e: any) {
      console.error('[ensureAdminSeeded] Admin seed failed, resetting flags:', e.message)
      // Reset both flags to force full retry on next request
      ensured = false
      adminEnsured = false
      // Try once more with fresh state
      try {
        await ensureDb()
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
          console.log('[ensureAdminSeeded] Admin user seeded on retry')
        }
        adminEnsured = true
      } catch (retryErr: any) {
        console.error('[ensureAdminSeeded] Retry also failed:', retryErr.message)
        throw new Error(`Admin database initialization failed: ${retryErr.message}`)
      }
    }
  }
}
