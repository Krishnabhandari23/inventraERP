-- CreateTable Approval
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT 0,
    "entityId" TEXT,
    "entityType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable InboxMessage
CREATE TABLE "InboxMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entityId" TEXT,
    "entityType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex Approval_tenantId_status_idx
CREATE INDEX "Approval_tenantId_status_idx" ON "Approval"("tenantId", "status");

-- CreateIndex Approval_tenantId_type_idx
CREATE INDEX "Approval_tenantId_type_idx" ON "Approval"("tenantId", "type");

-- CreateIndex Approval_entityId_idx
CREATE INDEX "Approval_entityId_idx" ON "Approval"("entityId");

-- CreateIndex Notification_userId_tenantId_idx
CREATE INDEX "Notification_userId_tenantId_idx" ON "Notification"("userId", "tenantId");

-- CreateIndex Notification_userId_isRead_idx
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex InboxMessage_recipientId_tenantId_idx
CREATE INDEX "InboxMessage_recipientId_tenantId_idx" ON "InboxMessage"("recipientId", "tenantId");

-- CreateIndex InboxMessage_recipientId_isRead_idx
CREATE INDEX "InboxMessage_recipientId_isRead_idx" ON "InboxMessage"("recipientId", "isRead");

-- CreateIndex Payment_tenantId_status_idx
CREATE INDEX "Payment_tenantId_status_idx" ON "Payment"("tenantId", "status");

-- CreateIndex Payment_stripeSessionId_key
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");
