-- CreateTable
CREATE TABLE "Sender" (
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

-- CreateTable
CREATE TABLE "AdminUser" (
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

-- CreateTable
CREATE TABLE "Transaction" (
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

-- CreateTable
CREATE TABLE "TransactionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "provider" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipient" (
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

-- CreateTable
CREATE TABLE "Provider" (
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

-- CreateTable
CREATE TABLE "ProviderLog" (
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

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT,
    "body" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SettlementConfig" (
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

-- CreateTable
CREATE TABLE "FxMarginOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corridor" TEXT NOT NULL,
    "marginPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Corridor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sendCountry" TEXT,
    "receiveCountry" TEXT,
    "sendCurrency" TEXT,
    "receiveCurrency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RevenueRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "corridor" TEXT,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
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

-- CreateTable
CREATE TABLE "SplitRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "corridor" TEXT,
    "percentage" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "corridor" TEXT,
    "targetRate" REAL,
    "direction" TEXT,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecurringSend" (
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

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT,
    "referredId" TEXT,
    "code" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
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

-- CreateTable
CREATE TABLE "GroupSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GroupSendContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupSendId" TEXT,
    "senderId" TEXT,
    "amount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSendContribution_groupSendId_fkey" FOREIGN KEY ("groupSendId") REFERENCES "GroupSend" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftVoucher" (
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

-- CreateTable
CREATE TABLE "FamilyPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creatorId" TEXT,
    "targetAmount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BillPayment" (
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

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "ownerType" TEXT,
    "currency" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AmlFlag" (
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

-- CreateTable
CREATE TABLE "SenderNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "authorId" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WhatsAppOptIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SenderSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SenderPaystackAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "authCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PepCheck" (
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

-- CreateTable
CREATE TABLE "BusinessAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "registrationNumber" TEXT,
    "email" TEXT,
    "contactName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessTransaction" (
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

-- CreateTable
CREATE TABLE "DigestIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DigestSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InvestmentAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvestmentOrder" (
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

-- CreateTable
CREATE TABLE "FxOrder" (
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

-- CreateTable
CREATE TABLE "DividendPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AumFeeCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChinaCorridorPayment" (
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

-- CreateTable
CREATE TABLE "PapssSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RippleSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LiquidityProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT
);

-- CreateTable
CREATE TABLE "AchievementCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

