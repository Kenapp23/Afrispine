DROP TABLE IF EXISTS "GiftCardTransaction" CASCADE;
DROP TABLE IF EXISTS "GiftCard" CASCADE;
DROP TABLE IF EXISTS "GiftCardBrand" CASCADE;
DROP TABLE IF EXISTS "EquityOrder" CASCADE;
DROP TABLE IF EXISTS "DiasporaNseLedger" CASCADE;
DROP TABLE IF EXISTS "FeeMatrix" CASCADE;
DROP TABLE IF EXISTS "SettlementTransaction" CASCADE;
DROP TABLE IF EXISTS "SettlementRule" CASCADE;
DROP TABLE IF EXISTS "PartnerConfig" CASCADE;
DROP TABLE IF EXISTS "CompanyConfig" CASCADE;
DROP TABLE IF EXISTS "AumFeeCharge" CASCADE;
DROP TABLE IF EXISTS "DividendPayment" CASCADE;
DROP TABLE IF EXISTS "FxOrder" CASCADE;
DROP TABLE IF EXISTS "InvestmentOrder" CASCADE;
DROP TABLE IF EXISTS "InvestmentAccount" CASCADE;
DROP TABLE IF EXISTS "DigestSubscription" CASCADE;
DROP TABLE IF EXISTS "DigestIssue" CASCADE;
DROP TABLE IF EXISTS "BusinessTransaction" CASCADE;
DROP TABLE IF EXISTS "BusinessAccount" CASCADE;
DROP TABLE IF EXISTS "PepCheck" CASCADE;
DROP TABLE IF EXISTS "SenderPaystackAuth" CASCADE;
DROP TABLE IF EXISTS "SenderSubscription" CASCADE;
DROP TABLE IF EXISTS "WhatsAppOptIn" CASCADE;
DROP TABLE IF EXISTS "SenderNote" CASCADE;
DROP TABLE IF EXISTS "AmlFlag" CASCADE;
DROP TABLE IF EXISTS "Wallet" CASCADE;
DROP TABLE IF EXISTS "BillPayment" CASCADE;
DROP TABLE IF EXISTS "FamilyPool" CASCADE;
DROP TABLE IF EXISTS "GiftVoucher" CASCADE;
DROP TABLE IF EXISTS "GroupSendContribution" CASCADE;
DROP TABLE IF EXISTS "GroupSend" CASCADE;
DROP TABLE IF EXISTS "Quote" CASCADE;
DROP TABLE IF EXISTS "Referral" CASCADE;
DROP TABLE IF EXISTS "RecurringSend" CASCADE;
DROP TABLE IF EXISTS "RateAlert" CASCADE;
DROP TABLE IF EXISTS "PlatformSetting" CASCADE;
DROP TABLE IF EXISTS "SplitRule" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "RevenueRecord" CASCADE;
DROP TABLE IF EXISTS "Corridor" CASCADE;
DROP TABLE IF EXISTS "FxMarginOverride" CASCADE;
DROP TABLE IF EXISTS "SettlementConfig" CASCADE;
DROP TABLE IF EXISTS "NotificationTemplate" CASCADE;
DROP TABLE IF EXISTS "ProviderLog" CASCADE;
DROP TABLE IF EXISTS "Provider" CASCADE;
DROP TABLE IF EXISTS "Recipient" CASCADE;
DROP TABLE IF EXISTS "TransactionEvent" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "AdminUser" CASCADE;
DROP TABLE IF EXISTS "Sender" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "PlatformConfig" CASCADE;
DROP TABLE IF EXISTS "AchievementCard" CASCADE;
DROP TABLE IF EXISTS "ChinaCorridorPayment" CASCADE;
DROP TABLE IF EXISTS "PapssSession" CASCADE;
DROP TABLE IF EXISTS "RippleSettlement" CASCADE;
DROP TABLE IF EXISTS "LiquidityProvider" CASCADE;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Sender" (
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
);

-- CreateTable
CREATE TABLE "AdminUser" (
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
);

-- CreateTable
CREATE TABLE "Transaction" (
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
);

-- CreateTable
CREATE TABLE "TransactionEvent" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "provider" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
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
);

-- CreateTable
CREATE TABLE "Provider" (
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
);

-- CreateTable
CREATE TABLE "ProviderLog" (
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
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementConfig" (
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
);

-- CreateTable
CREATE TABLE "FxMarginOverride" (
    "id" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "marginPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxMarginOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corridor" (
    "id" TEXT NOT NULL,
    "sendCountry" TEXT,
    "receiveCountry" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Corridor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "corridor" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
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
);

-- CreateTable
CREATE TABLE "SplitRule" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "corridor" TEXT,
    "percentage" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateAlert" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "corridor" TEXT,
    "targetRate" DOUBLE PRECISION,
    "direction" TEXT,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSend" (
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
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT,
    "referredId" TEXT,
    "code" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
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
);

-- CreateTable
CREATE TABLE "GroupSend" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSendContribution" (
    "id" TEXT NOT NULL,
    "groupSendId" TEXT,
    "senderId" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSendContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftVoucher" (
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
);

-- CreateTable
CREATE TABLE "FamilyPool" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillPayment" (
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
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerType" TEXT,
    "currency" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmlFlag" (
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
);

-- CreateTable
CREATE TABLE "SenderNote" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "authorId" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SenderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppOptIn" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderSubscription" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SenderSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderPaystackAuth" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "authCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SenderPaystackAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PepCheck" (
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
);

-- CreateTable
CREATE TABLE "BusinessAccount" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "registrationNumber" TEXT,
    "email" TEXT,
    "contactName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessTransaction" (
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
);

-- CreateTable
CREATE TABLE "DigestIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigestIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAccount" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentOrder" (
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
);

-- CreateTable
CREATE TABLE "FxOrder" (
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
);

-- CreateTable
CREATE TABLE "DividendPayment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DividendPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AumFeeCharge" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AumFeeCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChinaCorridorPayment" (
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
);

-- CreateTable
CREATE TABLE "PapssSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PapssSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RippleSettlement" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RippleSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementCard" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCardBrand" (
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
);

-- CreateTable
CREATE TABLE "GiftCard" (
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
);

-- CreateTable
CREATE TABLE "GiftCardTransaction" (
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
);

-- CreateTable
CREATE TABLE "EquityOrder" (
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
);

-- CreateTable
CREATE TABLE "DiasporaNseLedger" (
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
);

-- CreateTable
CREATE TABLE "FeeMatrix" (
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
);

-- CreateTable
CREATE TABLE "PartnerConfig" (
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
);

-- CreateTable
CREATE TABLE "SettlementRule" (
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
);

-- CreateTable
CREATE TABLE "SettlementTransaction" (
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
);

-- CreateTable
CREATE TABLE "CompanyConfig" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sender_email_key" ON "Sender"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_senderId_idx" ON "Transaction"("senderId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionEvent_transactionId_idx" ON "TransactionEvent"("transactionId");

-- CreateIndex
CREATE INDEX "Recipient_senderId_idx" ON "Recipient"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE INDEX "ProviderLog_providerId_idx" ON "ProviderLog"("providerId");

-- CreateIndex
CREATE INDEX "ProviderLog_createdAt_idx" ON "ProviderLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_trigger_key" ON "NotificationTemplate"("trigger");

-- CreateIndex
CREATE UNIQUE INDEX "FxMarginOverride_corridor_key" ON "FxMarginOverride"("corridor");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "GiftVoucher_code_key" ON "GiftVoucher"("code");

-- CreateIndex
CREATE INDEX "PepCheck_senderId_idx" ON "PepCheck"("senderId");

-- CreateIndex
CREATE INDEX "PepCheck_status_idx" ON "PepCheck"("status");

-- CreateIndex
CREATE INDEX "PepCheck_createdAt_idx" ON "PepCheck"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_key_key" ON "PlatformConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCardBrand_slug_key" ON "GiftCardBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_brandId_idx" ON "GiftCard"("brandId");

-- CreateIndex
CREATE INDEX "GiftCard_senderId_idx" ON "GiftCard"("senderId");

-- CreateIndex
CREATE INDEX "GiftCard_status_idx" ON "GiftCard"("status");

-- CreateIndex
CREATE INDEX "GiftCard_code_idx" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_type_idx" ON "GiftCardTransaction"("type");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_createdAt_idx" ON "GiftCardTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerConfig_partnerId_key" ON "PartnerConfig"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementTransaction_reference_key" ON "SettlementTransaction"("reference");

-- CreateIndex
CREATE INDEX "SettlementTransaction_senderId_idx" ON "SettlementTransaction"("senderId");

-- CreateIndex
CREATE INDEX "SettlementTransaction_status_idx" ON "SettlementTransaction"("status");

-- CreateIndex
CREATE INDEX "SettlementTransaction_createdAt_idx" ON "SettlementTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyConfig_configKey_key" ON "CompanyConfig"("configKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionEvent" ADD CONSTRAINT "TransactionEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLog" ADD CONSTRAINT "ProviderLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSendContribution" ADD CONSTRAINT "GroupSendContribution_groupSendId_fkey" FOREIGN KEY ("groupSendId") REFERENCES "GroupSend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "GiftCardBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

