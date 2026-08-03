import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/*
 * ONE-SHOT SCHEMA BOOTSTRAPPER
 * ─────────────────────────────
 * Creates EVERY table from prisma/schema.prisma in Supabase.
 * Idempotent — safe to call multiple times.
 * Uses Prisma $executeRawUnsafe through Supabase's connection pooler.
 */

// ─── All CREATE TABLE statements (with IF NOT EXISTS) ──────────
const TABLES: string[] = [
  // ── Auth Models ──
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

  // ── Core Business Models ──
  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sendCurrency" TEXT NOT NULL,
    "sendAmount" DOUBLE PRECISION NOT NULL,
    "receiveCurrency" TEXT NOT NULL,
    "receiveAmount" DOUBLE PRECISION,
    "fxRate" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCharged" DOUBLE PRECISION,
    "corridor" TEXT,
    "rail" TEXT,
    "providerSlug" TEXT,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "recipientBank" TEXT,
    "recipientAccount" TEXT,
    "matchType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "TransactionEvent" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "provider" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionEvent_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Recipient" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
  )`,

  // ── Provider & Config Models ──
  `CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "slug" TEXT NOT NULL,
    "apiBaseUrl" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookSecret" TEXT,
    "supportedRails" TEXT,
    "supportedCorridors" TEXT,
    "weightSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
    "weightCost" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
    "weightReliability" DOUBLE PRECISION NOT NULL DEFAULT 0.34,
    "billingModel" TEXT,
    "billingRate" DOUBLE PRECISION,
    "billingEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "successRate30d" INTEGER NOT NULL DEFAULT 0,
    "avgDeliverySec30d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ProviderLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "direction" TEXT,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "payload" TEXT,
    "response" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderLog_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SettlementConfig" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "registeredAddress" TEXT,
    "companyRegNumber" TEXT,
    "vatNumber" TEXT,
    "settlementAccounts" TEXT,
    "sweepCurrency" TEXT,
    "sweepAccountId" TEXT,
    "sweepSchedule" TEXT,
    "sweepMinimum" DOUBLE PRECISION,
    "sweepNotifyEmail" TEXT,
    "flwAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SettlementConfig_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "FxMarginOverride" (
    "id" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "marginPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FxMarginOverride_pkey" PRIMARY KEY ("id")
  )`,

  // ── Additional Models ──
  `CREATE TABLE IF NOT EXISTS "Corridor" (
    "id" TEXT NOT NULL,
    "sendCountry" TEXT,
    "receiveCountry" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Corridor_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "RevenueRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "corridor" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RevenueRecord_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "providerName" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SplitRule" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "corridor" TEXT,
    "percentage" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SplitRule_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "RateAlert" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "corridor" TEXT,
    "targetRate" DOUBLE PRECISION,
    "direction" TEXT,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateAlert_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "RecurringSend" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientId" TEXT,
    "sendCurrency" TEXT,
    "sendAmount" DOUBLE PRECISION,
    "receiveCurrency" TEXT,
    "frequency" TEXT,
    "nextExecution" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringSend_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT,
    "referredId" TEXT,
    "code" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "sendAmount" DOUBLE PRECISION,
    "receiveAmount" DOUBLE PRECISION,
    "fxRate" DOUBLE PRECISION,
    "feePct" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "GroupSend" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroupSend_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "GroupSendContribution" (
    "id" TEXT NOT NULL,
    "groupSendId" TEXT,
    "senderId" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSendContribution_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "GiftVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "senderId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "recipientEmail" TEXT,
    "redeemedBy" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "FamilyPool" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FamilyPool_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "BillPayment" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "provider" TEXT,
    "billType" TEXT,
    "accountNumber" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerType" TEXT,
    "currency" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "AmlFlag" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "senderId" TEXT,
    "ruleCode" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmlFlag_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SenderNote" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "authorId" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SenderNote_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "WhatsAppOptIn" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppOptIn_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SenderSubscription" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SenderSubscription_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SenderPaystackAuth" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "authCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SenderPaystackAuth_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "PepCheck" (
    "id" TEXT NOT NULL,
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
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PepCheck_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "BusinessAccount" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "registrationNumber" TEXT,
    "email" TEXT,
    "contactName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "BusinessTransaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "sellCurrency" TEXT,
    "buyCurrency" TEXT,
    "sellAmount" DOUBLE PRECISION,
    "buyAmount" DOUBLE PRECISION,
    "fxRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessTransaction_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "DigestIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DigestIssue_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "DigestSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigestSubscription_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "InvestmentAccount" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "InvestmentOrder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "type" TEXT,
    "assetCode" TEXT,
    "quantity" DOUBLE PRECISION,
    "pricePerUnit" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvestmentOrder_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "FxOrder" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "sellCurrency" TEXT,
    "buyCurrency" TEXT,
    "sellAmount" DOUBLE PRECISION,
    "buyAmount" DOUBLE PRECISION,
    "fxRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FxOrder_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "DividendPayment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DividendPayment_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "AumFeeCharge" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AumFeeCharge_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ChinaCorridorPayment" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "sendAmount" DOUBLE PRECISION,
    "sendCurrency" TEXT,
    "receiveAmount" DOUBLE PRECISION,
    "receiveCurrency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChinaCorridorPayment_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "PapssSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PapssSession_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "RippleSettlement" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RippleSettlement_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "LiquidityProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiquidityProvider_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "PlatformConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "AchievementCard" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AchievementCard_pkey" PRIMARY KEY ("id")
  )`,

  // ── Gift Card Models ──
  `CREATE TABLE IF NOT EXISTS "GiftCardBrand" (
    "id" TEXT NOT NULL,
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
    "minAmount" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "maxAmount" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "supportedCurrencies" TEXT NOT NULL DEFAULT '["KES","NGN","GHS","ZAR","UGX","TZS"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GiftCardBrand_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "qrCodeData" TEXT NOT NULL,
    "blockchainTxHash" TEXT,
    "smartContractRef" TEXT,
    "message" TEXT,
    "occasion" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "GiftCardTransaction" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "performedBy" TEXT,
    "performedByRole" TEXT,
    "blockchainTxHash" TEXT,
    "smartContractEvent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftCardTransaction_pkey" PRIMARY KEY ("id")
  )`,

  // ── Equity / NSE Models ──
  `CREATE TABLE IF NOT EXISTS "EquityOrder" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "ticker" TEXT,
    "side" TEXT,
    "quantity" DOUBLE PRECISION,
    "pricePerShare" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT,
    "idempotencyKey" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EquityOrder_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "DiasporaNseLedger" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "ticker" TEXT,
    "side" TEXT,
    "quantity" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "status" TEXT,
    "fee" DOUBLE PRECISION,
    "currency" TEXT,
    "exchange" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiasporaNseLedger_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "IpoRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "interestAmountUsd" DOUBLE PRECISION,
    "ipoSlug" TEXT NOT NULL DEFAULT 'dangote-refinery',
    "status" TEXT NOT NULL DEFAULT 'waitlisted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IpoRegistration_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "FeeMatrix" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "recipient" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeMatrix_pkey" PRIMARY KEY ("id")
  )`,

  // ── Settlement Engine Models ──
  `CREATE TABLE IF NOT EXISTS "PartnerConfig" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configJson" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerConfig_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SettlementRule" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SettlementRule_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "SettlementTransaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "senderId" TEXT,
    "ruleId" TEXT,
    "grossAmountUsd" DOUBLE PRECISION NOT NULL,
    "afriSpineFeeUsd" DOUBLE PRECISION NOT NULL,
    "partnerFeeUsd" DOUBLE PRECISION NOT NULL,
    "netAssetUsd" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "afriSpineTxRef" TEXT,
    "partnerTxRef" TEXT,
    "brokerTxRef" TEXT,
    "cscsNominee" TEXT,
    "assetCode" TEXT,
    "quantity" DOUBLE PRECISION,
    "pricePerUnit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SettlementTransaction_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "CompanyConfig" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
  )`,

  // ── Legacy scaffold tables ──
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
  )`,
];

// ─── All UNIQUE and regular indexes (with IF NOT EXISTS) ───────
const INDEXES: string[] = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "Sender_email_key" ON "Sender"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_reference_key" ON "Transaction"("reference")`,
  `CREATE INDEX IF NOT EXISTS "Transaction_senderId_idx" ON "Transaction"("senderId")`,
  `CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status")`,
  `CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "TransactionEvent_transactionId_idx" ON "TransactionEvent"("transactionId")`,
  `CREATE INDEX IF NOT EXISTS "Recipient_senderId_idx" ON "Recipient"("senderId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Provider_slug_key" ON "Provider"("slug")`,
  `CREATE INDEX IF NOT EXISTS "ProviderLog_providerId_idx" ON "ProviderLog"("providerId")`,
  `CREATE INDEX IF NOT EXISTS "ProviderLog_createdAt_idx" ON "ProviderLog"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_trigger_key" ON "NotificationTemplate"("trigger")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "FxMarginOverride_corridor_key" ON "FxMarginOverride"("corridor")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSetting_key_key" ON "PlatformSetting"("key")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GiftVoucher_code_key" ON "GiftVoucher"("code")`,
  `CREATE INDEX IF NOT EXISTS "PepCheck_senderId_idx" ON "PepCheck"("senderId")`,
  `CREATE INDEX IF NOT EXISTS "PepCheck_status_idx" ON "PepCheck"("status")`,
  `CREATE INDEX IF NOT EXISTS "PepCheck_createdAt_idx" ON "PepCheck"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PlatformConfig_key_key" ON "PlatformConfig"("key")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCardBrand_slug_key" ON "GiftCardBrand"("slug")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_code_key" ON "GiftCard"("code")`,
  `CREATE INDEX IF NOT EXISTS "GiftCard_brandId_idx" ON "GiftCard"("brandId")`,
  `CREATE INDEX IF NOT EXISTS "GiftCard_senderId_idx" ON "GiftCard"("senderId")`,
  `CREATE INDEX IF NOT EXISTS "GiftCard_status_idx" ON "GiftCard"("status")`,
  `CREATE INDEX IF NOT EXISTS "GiftCard_code_idx" ON "GiftCard"("code")`,
  `CREATE INDEX IF NOT EXISTS "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId")`,
  `CREATE INDEX IF NOT EXISTS "GiftCardTransaction_type_idx" ON "GiftCardTransaction"("type")`,
  `CREATE INDEX IF NOT EXISTS "GiftCardTransaction_createdAt_idx" ON "GiftCardTransaction"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PartnerConfig_partnerId_key" ON "PartnerConfig"("partnerId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SettlementTransaction_reference_key" ON "SettlementTransaction"("reference")`,
  `CREATE INDEX IF NOT EXISTS "SettlementTransaction_senderId_idx" ON "SettlementTransaction"("senderId")`,
  `CREATE INDEX IF NOT EXISTS "SettlementTransaction_status_idx" ON "SettlementTransaction"("status")`,
  `CREATE INDEX IF NOT EXISTS "SettlementTransaction_createdAt_idx" ON "SettlementTransaction"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyConfig_configKey_key" ON "CompanyConfig"("configKey")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
];

// ─── Foreign keys (plain ALTER TABLE, catch duplicate_object) ───────
const FOREIGN_KEYS: string[] = [
  `ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "TransactionEvent" ADD CONSTRAINT "TransactionEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProviderLog" ADD CONSTRAINT "ProviderLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "GroupSendContribution" ADD CONSTRAINT "GroupSendContribution_groupSendId_fkey" FOREIGN KEY ("groupSendId") REFERENCES "GroupSend"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "GiftCardBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

// ─── Extract table name for logging ───────────────────────────
function extractName(sql: string): string {
  const m = sql.match(/(?:CREATE TABLE|CREATE UNIQUE INDEX|CREATE INDEX) IF NOT EXISTS \"(\w+)\"/);
  if (m) return m[1];
  const fk = sql.match(/ALTER TABLE \"(\w+)\" ADD CONSTRAINT \"(\w+)\"/);
  if (fk) return `FK ${fk[1]}.${fk[2]}`;
  return 'unknown';
}

export async function GET() {
  const results: { statement: string; status: string; detail?: string }[] = [];
  let okCount = 0;
  let errCount = 0;

  // Phase 1: Create all tables
  for (const sql of TABLES) {
    try {
      await db.$executeRawUnsafe(sql);
      const name = extractName(sql);
      results.push({ statement: `TABLE ${name}`, status: 'OK' });
      okCount++;
    } catch (e: any) {
      const name = extractName(sql);
      results.push({ statement: `TABLE ${name}`, status: 'ERROR', detail: e.message?.substring(0, 200) });
      errCount++;
    }
  }

  // Phase 2: Create all indexes
  for (const sql of INDEXES) {
    try {
      await db.$executeRawUnsafe(sql);
      const name = extractName(sql);
      results.push({ statement: `INDEX ${name}`, status: 'OK' });
      okCount++;
    } catch (e: any) {
      const name = extractName(sql);
      results.push({ statement: `INDEX ${name}`, status: 'ERROR', detail: e.message?.substring(0, 200) });
      errCount++;
    }
  }

  // Phase 3: Add foreign keys (duplicate_object = already exists = OK)
  for (const sql of FOREIGN_KEYS) {
    try {
      await db.$executeRawUnsafe(sql);
      const name = extractName(sql);
      results.push({ statement: name, status: 'OK' });
      okCount++;
    } catch (e: any) {
      const name = extractName(sql);
      // Error code 42710 = duplicate_object (constraint already exists) — that's fine
      if (e.code === '42710') {
        results.push({ statement: name, status: 'OK (already existed)' });
        okCount++;
      } else {
        results.push({ statement: name, status: 'ERROR', detail: e.message?.substring(0, 200) });
        errCount++;
      }
    }
  }

  return NextResponse.json({
    total: results.length,
    ok: okCount,
    errors: errCount,
    results,
  });
}
